#!/usr/bin/env node
import { readFile, lstat, realpath } from "node:fs/promises";
import { resolve, dirname, join, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

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
  const result = spawnSync(process.execPath, ["--test", oracle], {
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024,
    encoding: "utf8",
    env: { PATH: process.env.PATH || "", DKSTACK_CANDIDATE_ROOT: resolvedCandidate },
  });
  return {
    passed: result.status === 0 && !result.error,
    exit_code: result.status,
    error: result.error?.message || null,
    output: (result.stdout + result.stderr).slice(-6000),
  };
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

async function main(args) {
  const action = args[0] || "check";
  if (action === "check") {
    const list = await loadScenarios();
    process.stdout.write("Validated " + list.length + " engineering scenarios.\n");
    return;
  }
  if (action === "list") {
    process.stdout.write(JSON.stringify(await loadScenarios(), null, 2) + "\n");
    return;
  }
  if (action !== "grade" || args.length !== 4 || args[3] !== "--execute-untrusted") {
    throw new Error("Usage: node scripts/engineering-evals.mjs grade <id> <candidate-dir> --execute-untrusted");
  }
  const result = await compareScenario(args[1], args[2]);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (result.outcome !== "PASS") process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  });
}
