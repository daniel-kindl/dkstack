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

test("the bootstrap CI workflow example runs npm ci and fails on a high npm audit finding", async () => {
  const lines = (await exampleFile(".github/workflows/ci.yml")).split("\n").map((l) => l.trim());
  assert.ok(lines.includes("- run: npm ci"), "npm ci installs from the committed lockfile");
  assert.ok(lines.includes("- run: npm audit --audit-level=high"), "npm audit fails on high or critical");
});

test("the bootstrap Dependabot example updates npm and github-actions", async () => {
  const text = await exampleFile(".github/dependabot.yml");
  const ecosystems = [...text.matchAll(/^\s*- package-ecosystem:\s*"([^"]+)"/gm)].map((m) => m[1]);
  assert.deepEqual(ecosystems.sort(), ["github-actions", "npm"]);
  assert.match(text, /^version: 2$/m);
});
