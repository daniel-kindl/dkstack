import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Issue #292: bootstrap sets up the labels that workflow/issues.md requires.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const raw = (path) => readFile(join(repoRoot, path), "utf8");
const flat = async (path) => (await raw(path)).replace(/\s+/g, " ");
const TYPES = ["bug", "feature", "chore", "refactor", "docs", "research"].map((t) => `type:${t}`);
const PRIORITIES = ["p0", "p1", "p2", "p3"].map((p) => `priority:${p}`);

test("setup-labels lists each label that the issue rules name", async () => {
  const skill = await raw("skills/setup-labels/SKILL.md");
  const rules = await raw("workflow/issues.md");
  for (const label of [...TYPES, ...PRIORITIES]) {
    assert.ok(skill.includes(`\`${label}\``), `skill: ${label}`);
  }
  for (const label of [...TYPES, "priority:p0", "priority:p3"]) {
    assert.ok(rules.includes(`\`${label}\``), `rules: ${label}`);
  }
  assert.ok(skill.includes(`(${RAW}workflow/issues.md)`), "links the issue rules");
});

test("setup-labels changes labels only with the owner's OK and skips a project without a tracker", async () => {
  const text = await flat("skills/setup-labels/SKILL.md");
  assert.match(text, /only with the owner's OK that names the labels/);
  assert.match(text, /Do not change or delete an existing label without the owner's OK/);
  assert.ok(text.includes(`(${RAW}workflow/issues.md#projects-without-an-issue-tracker)`));
});

test("bootstrap step 7 runs setup-labels and the index lists it under bootstrap", async () => {
  const bootstrap = await raw("skills/bootstrap/SKILL.md");
  const seven = /^7\. (.*)$/m.exec(bootstrap)[1];
  assert.ok(seven.includes(`(${RAW}skills/setup-labels/SKILL.md)`));
  assert.match(await raw("skills/index.md"), /^ {2}- \[setup-labels\]\(setup-labels\/SKILL\.md\) \(agent\):/m);
});

// The review of #293 (M2): the steps that do the work have tests.
const stepOf = async (n) => {
  const text = await raw("skills/setup-labels/SKILL.md");
  const m = new RegExp(`^${n}\\. ([\\s\\S]*?)(?=^\\d+\\. |^## |(?![\\s\\S]))`, "m").exec(text);
  assert.ok(m, `step ${n}`);
  return m[1].replace(/\s+/g, " ");
};

test("setup-labels step 4 offers to keep or rename a similar label", async () => {
  const four = await stepOf(4);
  assert.match(four, /Keep it, and add the dkstack label/);
  assert.match(four, /Rename it to the dkstack label/);
});

test("setup-labels step 5 creates or renames only the labels that the owner names", async () => {
  assert.match(await stepOf(5), /Create or rename only the labels that the owner names in the OK/);
});

test("setup-labels step 6 reads the labels again and records the result in the issue", async () => {
  const six = await stepOf(6);
  assert.match(six, /Read the labels again/);
  assert.match(six, /Record in the issue what the owner applied and what stays open/);
});
