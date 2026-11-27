#!/usr/bin/env node
// Validates and executes skill activation tests using an explicit agent adapter.
// This script never claims an agent evaluation passed without a real adapter run.
import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join, relative, isAbsolute, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SUITE = "evals/skill-cases.json";
const MIN_RUNS = 3;
const ACTIVATION_THRESHOLD = 2 / 3;

export function validateSuite(suite, names) {
  const errors = [];
  if (!suite || suite.version !== 1 || !Array.isArray(suite.skills)) return ["Suite must have version 1 and skills array"];
  const seen = new Set();
  const covered = new Set();
  for (const entry of suite.skills) {
    if (!entry || !names.includes(entry.skill)) { errors.push(`Unknown skill: ${entry?.skill}`); continue; }
    if (covered.has(entry.skill)) errors.push(`${entry.skill}: duplicate skill suite`);
    covered.add(entry.skill);
    if (!Array.isArray(entry.queries) || !entry.queries.length) { errors.push(`${entry.skill}: queries missing`); continue; }
    let positives = 0;
    let negatives = 0;
    for (const query of entry.queries) {
      if (!query || !/^[a-z0-9-]+$/.test(query.id || "") || seen.has(query.id)) { errors.push(`${entry.skill}: invalid or repeated id`); continue; }
      seen.add(query.id);
      if (typeof query.query !== "string" || query.query.length < 15) errors.push(`${query.id}: query too short`);
      if (typeof query.should_trigger !== "boolean") errors.push(`${query.id}: should_trigger must be boolean`);
      else if (query.should_trigger) positives++; else negatives++;
      if (!["train", "validation"].includes(query.split)) errors.push(`${query.id}: invalid split`);
      if (typeof query.expected_output !== "string" || query.expected_output.length < 12) errors.push(`${query.id}: expected_output missing`);
      if (!Array.isArray(query.assertions) || !query.assertions.length || query.assertions.some(x => typeof x !== "string" || x.length < 10)) {
        errors.push(`${query.id}: assertions missing`);
      }
    }
    if (positives < 2 || negatives < 2) errors.push(`${entry.skill}: need at least two positive and two negative cases`);
    if (!entry.queries.some(q => q.split === "train") || !entry.queries.some(q => q.split === "validation")) {
      errors.push(`${entry.skill}: both splits required`);
    }
  }
  for (const name of names) if (!covered.has(name)) errors.push(`${name}: missing evaluation suite`);
  return errors;
}

export function summarize(cases, records, runs) {
  const outcomes = [];
  for (const skill of cases.skills) {
    for (const testcase of skill.queries) {
      const matching = records.filter(r => r.case_id === testcase.id && r.mode === "with_skill" && r.status === "COMPLETED");
      const baseline = records.filter(r => r.case_id === testcase.id && r.mode === "without_skill" && r.status === "COMPLETED");
      const complete = matching.length === runs && baseline.length === runs;
      const invoked = matching.filter(r => r.activated_skills.includes(skill.skill)).length;
      const baselineInvoked = baseline.some(r => r.activated_skills.includes(skill.skill));
      const rate = complete ? invoked / runs : null;
      outcomes.push({
        skill: skill.skill, case_id: testcase.id, split: testcase.split,
        should_trigger: testcase.should_trigger, observed_runs: matching.length,
        baseline_runs: baseline.length, trigger_rate: rate,
        assertion_status: !complete ? "NOT_RUN" : matching.every(r => Array.isArray(r.assertion_results) && r.assertion_results.length === testcase.assertions.length) ?
          (matching.every(r => r.assertion_results.every((a, i) => a.text === testcase.assertions[i] && a.passed && a.evidence)) ? "PASS" : "FAIL") : "NOT_GRADED",
        status: !complete ? "NOT_RUN" : baselineInvoked ? "INVALID_BASELINE" :
          ((testcase.should_trigger && rate >= ACTIVATION_THRESHOLD) || (!testcase.should_trigger && rate <= 1 - ACTIVATION_THRESHOLD)) ? "PASS" : "FAIL",
      });
    }
  }
  return outcomes;
}

export function validateAdapterResult(value) {
  if (!value || !Array.isArray(value.activated_skills) || value.activated_skills.some(x => typeof x !== "string")) {
    throw new Error("Adapter must return activated_skills string array");
  }
  if (typeof value.evidence !== "string" || !value.evidence.trim()) {
    throw new Error("Adapter must cite recorded activation evidence");
  }
  if (value.assertion_results !== undefined && (!Array.isArray(value.assertion_results) ||
    value.assertion_results.some(x => typeof x.text !== "string" || typeof x.passed !== "boolean" || !x.evidence))) {
    throw new Error("Invalid assertion_results: evidence required");
  }
  if (value.assertion_results !== undefined && !["independent-llm", "deterministic", "human"].includes(value.graded_by)) {
    throw new Error("assertion_results require an independent graded_by value");
  }
  return value;
}

export async function runAdapter(command, payload, timeoutMs = 120000) {
  if (!command || command.includes("\0")) throw new Error("Adapter executable required");
  return new Promise((ok, fail) => {
    const child = spawn(command, [], { stdio: ["pipe", "pipe", "pipe"], shell: false });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", chunk => { stdout += chunk; if (stdout.length > 2000000) child.kill("SIGKILL"); });
    child.stderr.on("data", chunk => { stderr += chunk; if (stderr.length > 2000000) child.kill("SIGKILL"); });
    child.on("error", error => { if (!settled) { settled = true; clearTimeout(timer); fail(error); } });
    child.on("close", code => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      if (code !== 0) { fail(new Error(`Adapter failed (${code}): ${stderr.slice(0, 500)}`)); return; }
      try { ok(validateAdapterResult(JSON.parse(stdout))); }
      catch (error) { fail(error); }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(JSON.stringify(payload));
  });
}

async function runEvaluation(suite, adapter, outDir, runs) {
  if (!Number.isInteger(runs) || runs < MIN_RUNS || runs > 20) throw new Error("Runs must be between 3 and 20");
  const results = [];
  await mkdir(outDir, { recursive: false });
  for (const skill of suite.skills) {
    for (const testcase of skill.queries) {
      for (const mode of ["with_skill", "without_skill"]) {
        for (let iteration = 1; iteration <= runs; iteration++) {
          const payload = { case_id: testcase.id, skill: skill.skill, query: testcase.query, mode, iteration };
          const value = await runAdapter(adapter, payload);
          const record = { ...value, ...payload, status: "COMPLETED" };
          const folder = join(outDir, testcase.id, mode);
          await mkdir(folder, { recursive: true });
          await writeFile(join(folder, `run-${iteration}.json`), JSON.stringify(record, null, 2) + "\n");
          results.push(record);
        }
      }
    }
  }
  const outcomes = summarize(suite, results, runs);
  await writeFile(join(outDir, "summary.json"), JSON.stringify({runs, outcomes}, null, 2) + "\n");
  return outcomes;
}

async function main(args) {
  const command = args.shift() || "check";
  const root = resolve(".");
  const names = (await readdir(join(root, "skills"), { withFileTypes: true })).filter(x => x.isDirectory()).map(x => x.name);
  const suite = JSON.parse(await readFile(join(root, DEFAULT_SUITE), "utf8"));
  const errors = validateSuite(suite, names);
  if (errors.length) throw new Error(errors.join("\n"));
  if (command === "check") { console.log(`${suite.skills.length} evaluation skill suites valid`); return; }
  if (command !== "run") throw new Error("Usage: node scripts/skill-evals.mjs check | run --adapter <executable> --out <directory> [--runs 3]");
  const options = {};
  while (args.length) {
    const key = args.shift();
    if (!["--adapter", "--out", "--runs"].includes(key) || !args.length) throw new Error(`Unknown or missing argument: ${key}`);
    options[key] = args.shift();
  }
  if (!options["--adapter"] || !options["--out"]) throw new Error("Adapter and output directory required");
  const out = resolve(options["--out"]);
  const rel = relative(root, out);
  if (!rel || rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) throw new Error("Results must be inside repository");
  const outcomes = await runEvaluation(suite, resolve(options["--adapter"]), out, Number(options["--runs"] || MIN_RUNS));
  if (outcomes.some(x => x.status !== "PASS")) process.exitCode = 1;
  console.log(`${outcomes.filter(x => x.status === "PASS").length}/${outcomes.length} trigger cases passed`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
