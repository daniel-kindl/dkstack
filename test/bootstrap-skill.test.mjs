import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkWorkflows } from "../scripts/check-workflows.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillFile = join(repoRoot, "skills", "bootstrap", "SKILL.md");

// Return the fenced YAML block in the bootstrap skill that starts with "# <path>".
async function exampleFile(path) {
  const text = await readFile(skillFile, "utf8");
  const blocks = [...text.matchAll(/^( *)```ya?ml\r?\n([\s\S]*?)^\1```/gm)].map((m) =>
    m[2].replace(new RegExp(`^${m[1]}`, "gm"), ""),
  );
  const found = blocks.filter((b) => b.startsWith(`# ${path}\n`));
  assert.equal(found.length, 1, `the bootstrap skill must have one YAML example for ${path}`);
  return found[0];
}

test("the bootstrap CI workflow example passes the dkstack workflow check", async () => {
  const workflow = await exampleFile(".github/workflows/ci.yml");
  const root = await makeTree({ ".github/workflows/ci.yml": workflow });
  try {
    assert.deepEqual(await checkWorkflows(root), { checked: 1, errors: [] });
  } finally {
    await removeTree(root);
  }
});

test("the bootstrap CI example runs npm ci and fails on a high npm audit finding", async () => {
  const lines = (await exampleFile(".github/workflows/ci.yml")).split("\n").map((l) => l.trim());
  assert.ok(lines.includes("- run: npm ci"), "npm ci must install from the lockfile");
  const audit = "- run: npm audit --audit-level=high";
  assert.ok(lines.includes(audit), "npm audit must fail on high or critical");
});

test("the bootstrap Dependabot example updates npm and github-actions", async () => {
  const text = await exampleFile(".github/dependabot.yml");
  const ecosystems = [...text.matchAll(/^\s*- package-ecosystem:\s*"([^"]+)"/gm)].map((m) => m[1]);
  assert.deepEqual(ecosystems.sort(), ["github-actions", "npm"]);
  assert.match(text, /^version: 2$/m);
});

// Return the key paths of a simple block YAML file, such as "jobs.check.steps".
// The path comes from the indentation, so a key at the wrong level gets a wrong
// path. A list item "- key:" counts as a key two columns to the right. All
// children of one key must have the same indentation, as in YAML. A child with
// other indentation gives the path "<parent> has mixed indentation".
function keyPaths(text) {
  const stack = [];
  const paths = new Set();
  const childIndent = new Map();
  for (const raw of text.split("\n")) {
    if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
    const item = /^( *)- /.exec(raw);
    const line = item ? `${item[1]}  ${raw.slice(item[0].length)}` : raw;
    const key = /^( *)([A-Za-z0-9_-]+):/.exec(line);
    if (!key) continue;
    const indent = key[1].length;
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack.map((s) => s.key).join(".");
    if (!childIndent.has(parent)) childIndent.set(parent, indent);
    if (childIndent.get(parent) !== indent) paths.add(`${parent} has mixed indentation`);
    stack.push({ indent, key: key[2] });
    paths.add(stack.map((s) => s.key).join("."));
  }
  return paths;
}

// Return the paths that have no child path, sorted.
function leaves(paths) {
  return [...paths].filter((p) => ![...paths].some((q) => q.startsWith(`${p}.`))).sort();
}

test("the bootstrap YAML examples have each key at the correct level", async () => {
  const ci = keyPaths(await exampleFile(".github/workflows/ci.yml"));
  const ciKeys = ["name", "on.pull_request", "on.push.branches", "permissions.contents",
    "jobs.check.runs-on", "jobs.check.steps.uses", "jobs.check.steps.with.persist-credentials",
    "jobs.check.steps.with.node-version", "jobs.check.steps.run"];
  assert.deepEqual(leaves(ci), ciKeys.sort());
  const bot = keyPaths(await exampleFile(".github/dependabot.yml"));
  const botKeys = ["version", "updates.package-ecosystem", "updates.directory",
    "updates.schedule.interval"];
  assert.deepEqual(leaves(bot), botKeys.sort());
});
