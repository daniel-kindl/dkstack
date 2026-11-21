import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (path) => (await readFile(join(repoRoot, path), "utf8")).replace(/\s+/g, " ");

// Issue #166: one labeled, assigned issue per task. Pinned by key phrase (D7 in #154).
test("the issues page owns the one task, one issue rules", async () => {
  const text = await read("workflow/issues.md");
  for (const phrase of [
    "One task, one issue.",
    "Open a new issue only when none exists.",
    "Set exactly one type label: `type:bug`, `type:feature`, `type:chore`, `type:refactor`, `type:docs` or `type:research`.",
    "A priority label is optional",
    "Do not create, change or delete a label without the owner's OK.",
    "Assign the issue to the account that you are logged in as only when you start to work on it.",
    "Do not assign an issue when you only open, triage or review it.",
    "An assignment is a marker only. It is not an approval, a claim or a review.",
    "If a different account is assigned, do not start the work. Ask the owner.",
    "remove your assignment",
  ]) {
    assert.ok(text.includes(phrase), `missing: ${phrase}`);
  }
});

test("the issues page has a local file fallback", async () => {
  const text = await read("workflow/issues.md");
  assert.match(text, /## Projects without an issue tracker/);
  assert.ok(text.includes("`docs/issues/`"));
  for (const field of ["Type:", "Priority:", "Assignee:", "State: open | closed"]) {
    assert.ok(text.includes(field), `missing field: ${field}`);
  }
  assert.ok(text.includes("Do not delete the file."));
});

test("the issues page does not bring back the removed lifecycle labels", async () => {
  const text = await read("workflow/issues.md");
  assert.doesNotMatch(text, /status:|agent:|needs:/);
});

test("the start-issue skill links the page, names no code host and keeps the limits", async () => {
  const raw = await readFile(join(repoRoot, "skills", "start-issue", "SKILL.md"), "utf8");
  assert.ok(raw.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/issues.md)"));
  const text = raw.replace(/https:\/\/\S+/g, "").replace(/\s+/g, " ");
  assert.doesNotMatch(text, /github|\bgh\b|gitlab/i);
  assert.ok(text.includes("Do not create, change or delete a label without the owner's OK."));
  assert.ok(text.includes("if a different account is assigned, stop and ask the owner."));
  assert.ok(text.includes("If you only open, triage or review the issue, stop here. Do not assign it."));
  assert.ok(text.includes("When you start to work on the issue"));
  assert.doesNotMatch(text, /type:bug/, "the skill must not copy the label list");
});

test("the workflow index, the review page, the skill index and triage link the new rules", async () => {
  assert.match(await read("workflow/index.md"), /\[issues\.md\]\(issues\.md\)/);
  assert.match(await read("workflow/review-and-merge.md"), /\[issues\.md\]\(issues\.md\)/);
  assert.match(await read("skills/index.md"), /\[start-issue\]\(start-issue\/SKILL\.md\)/);
  assert.match(await read("skills/triage/SKILL.md"), /skills\/start-issue\/SKILL\.md/);
});
