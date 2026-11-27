#!/usr/bin/env node
import { readFile, lstat, realpath } from "node:fs/promises";
import { resolve, dirname, join, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

// The runner is in scripts/. The scenario data is in evals/engineering/.
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "evals", "engineering");
const manifest = join(root, "scenarios.json");
const validId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function safeRelativePath(value) {
  if (typeof value !== "string" || !value || isAbsolute(value)) return false;
  const normalized = value.replaceAll("\\", "/");
  if (normalized.split("/").some((part) => part === ".." || part === "." || !part)) return false;
  return !normalized.startsWith("/") && !normalized.includes("\0");
}

function inside(root, path) {
  const rel = relative(root, path);
  return Boolean(rel) && rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel);
}

export async function loadScenarios(base = root) {
  const list = JSON.parse(await readFile(join(base, "scenarios.json"), "utf8"));
  if (!Array.isArray(list) || list.length === 0) throw new Error("No scenarios");
  const ids = new Set();
  const realBase = await realpath(base);
  for (const item of list) {
    if (!item || !validId.test(item.id) || ids.has(item.id)) throw new Error("Invalid or duplicate scenario ID");
    ids.add(item.id);
    for (const key of ["goal", "topic", "oracle", "starter"]) {
      if (typeof item[key] !== "string" || !item[key].trim()) throw new Error("Missing " + key);
    }
    for (const key of ["oracle", "starter"]) {
      if (!safeRelativePath(item[key])) throw new Error("Unsafe " + key);
      const full = resolve(base, item[key]);
      const entry = await lstat(full);
      if (entry.isSymbolicLink()) throw new Error("Symlink not allowed");
      // A symlinked parent folder can point outside the root, so compare the real paths.
      if (!inside(realBase, await realpath(full))) throw new Error("Outside evaluation root");
    }
    if (!item.oracle.endsWith(".test.mjs")) throw new Error("Oracle must be a test module");
    const starter = await lstat(join(base, item.starter, "subject.mjs")).catch(() => null);
    if (!starter?.isFile()) throw new Error("Starter subject missing");
  }
  return list;
}

export const TIMEOUT_MS = 30000;

export async function gradeScenario(item, candidate, base = root, { timeoutMs = TIMEOUT_MS } = {}) {
  const resolvedCandidate = await realpath(candidate);
  const subject = join(resolvedCandidate, "subject.mjs");
  const entry = await lstat(subject);
  if (!entry.isFile() || entry.isSymbolicLink()) throw new Error("Candidate must contain a regular subject.mjs");
  const oracle = resolve(base, item.oracle);
  // The oracle runs in the same process as the test runner. The runner kills its whole process
  // group, so the time limit also stops each process that the candidate starts.
  const result = await run(process.execPath, ["--test", "--test-isolation=none", oracle], {
    timeout: timeoutMs,
    env: { PATH: process.env.PATH || "", DKSTACK_CANDIDATE_ROOT: resolvedCandidate },
  });
  return {
    passed: result.status === 0 && !result.error,
    exit_code: result.status,
    error: result.error?.message || null,
    output: result.output.slice(-6000),
  };
}

// Send SIGKILL to each process in the group. SIGKILL, because the test runner handles SIGTERM
// only when a busy candidate yields. A group with no process left is not an error.
function killGroup(pid) {
  if (!pid) return;
  try { process.kill(-pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
}

// Run a child process in its own process group without blocking the event loop.
// At the time limit, and when the child ends, kill the group, so no process that it started remains.
// Keep only the last 1 MiB of output.
function run(command, args, { timeout, env }) {
  return new Promise((done) => {
    const child = spawn(command, args, { env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const keep = (chunk) => { output = (output + chunk).slice(-1024 * 1024); };
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    let error = null;
    const timer = setTimeout(() => {
      error = new Error(`Stopped by SIGKILL after the time limit of ${timeout} ms (ETIMEDOUT)`);
      killGroup(child.pid);
    }, timeout);
    child.on("error", (value) => { error ??= value; });
    child.on("exit", () => { clearTimeout(timer); killGroup(child.pid); });
    child.on("close", (status) => { clearTimeout(timer); done({ status, error, output }); });
  });
}

export async function compareScenario(id, candidate, base = root) {
  const list = await loadScenarios(base);
  const item = list.find((value) => value.id === id);
  if (!item) throw new Error("Unknown scenario");
  // The starter is the broken module. It must fail, or the oracle proves nothing.
  const starter = await gradeScenario(item, resolve(base, item.starter), base);
  const updated = await gradeScenario(item, candidate, base);
  return {
    scenario: id,
    starter_passed: starter.passed,
    candidate_passed: updated.passed,
    outcome: !starter.passed && updated.passed ? "PASS" : "FAIL",
    starter,
    candidate: updated,
  };
}

export const ARMS = ["baseline", "dkstack"];
const NOT_RUN = { status: "NOT_RUN", reason: "No candidate for this arm" };

// Compare the arm without dkstack guidance (baseline) with the arm that has it (dkstack).
// An arm with no candidate is NOT_RUN, and then the comparison is NOT_RUN too.
export async function compareArms(id, candidates = {}, base = root, options = {}) {
  const list = await loadScenarios(base);
  const item = list.find((value) => value.id === id);
  if (!item) throw new Error("Unknown scenario");
  const starter = await gradeScenario(item, resolve(base, item.starter), base, options);
  const arms = {};
  for (const arm of ARMS) {
    if (candidates[arm] === undefined) { arms[arm] = { ...NOT_RUN }; continue; }
    const result = await gradeScenario(item, candidates[arm], base, options);
    arms[arm] = { status: !starter.passed && result.passed ? "PASS" : "FAIL", candidate: result };
  }
  return { scenario: id, starter_passed: starter.passed, arms, comparison: compareStatus(arms) };
}

function compareStatus({ baseline, dkstack }) {
  if (baseline.status === "NOT_RUN" || dkstack.status === "NOT_RUN") return "NOT_RUN";
  if (baseline.status === dkstack.status) return "SAME";
  return dkstack.status === "PASS" ? "DKSTACK_BETTER" : "BASELINE_BETTER";
}

const USAGE = [
  "Usage: node scripts/engineering-evals.mjs [check | list]",
  "       node scripts/engineering-evals.mjs grade <id> <candidate-dir> --execute-untrusted",
  "       node scripts/engineering-evals.mjs compare <id> [--baseline <dir>] [--dkstack <dir>] [--execute-untrusted]",
  "compare needs --execute-untrusted when it gets a candidate.",
].join("\n");

class UsageError extends Error {}

function parseCompare(args) {
  if (!args[0] || args[0].startsWith("--")) throw new UsageError();
  const candidates = {};
  let trusted = false;
  for (let at = 1; at < args.length; at += 1) {
    if (args[at] === "--execute-untrusted") { trusted = true; continue; }
    const arm = args[at].slice(2);
    if (!args[at].startsWith("--") || !ARMS.includes(arm) || !args[at + 1]) throw new UsageError();
    candidates[arm] = args[at + 1];
    at += 1;
  }
  if (Object.keys(candidates).length && !trusted) throw new UsageError();
  return { id: args[0], candidates };
}

// Return the exit code: 0 done, 1 failed result or error, 2 usage error.
export async function main(args, io = process, base = root) {
  const action = args[0] || "check";
  try {
    if (action === "check") {
      io.stdout.write("Validated " + (await loadScenarios(base)).length + " engineering scenarios.\n");
      return 0;
    }
    if (action === "list") {
      io.stdout.write(JSON.stringify(await loadScenarios(base), null, 2) + "\n");
      return 0;
    }
    if (action === "compare") {
      const { id, candidates } = parseCompare(args.slice(1));
      const result = await compareArms(id, candidates, base);
      io.stdout.write(JSON.stringify(result, null, 2) + "\n");
      for (const arm of ARMS) {
        const { status, reason } = result.arms[arm];
        io.stderr.write(arm + ": " + (status === "NOT_RUN" ? "NOT RUN, " + reason : status) + "\n");
      }
      io.stderr.write("comparison: " + result.comparison.replace("_", " ") + "\n");
      return 0;
    }
    if (action !== "grade" || args.length !== 4 || args[3] !== "--execute-untrusted") throw new UsageError();
    const result = await compareScenario(args[1], args[2], base);
    io.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return result.outcome === "PASS" ? 0 : 1;
  } catch (error) {
    if (error instanceof UsageError) { io.stderr.write(USAGE + "\n"); return 2; }
    io.stderr.write(error.message + "\n");
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
