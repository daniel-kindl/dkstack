import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function flat(path) {
  const text = await readFile(join(root, path), "utf8");
  return text.replaceAll(/\s+/g, " ");
}

test("a completed plan is removed before the pull request opens", async () => {
  const page = await flat("workflow/feature-plans.md");
  assert.match(page, /remove the completed plan before you open the pull request/);
  assert.match(page, /Do not remove a plan that is not complete or that is blocked/);
  assert.match(page, /ADR or in the permanent documentation/);
  assert.match(page, /Git history keeps the removed plan/);
  assert.match(page, /The review does not require the plan/);
  assert.doesNotMatch(page, /after the final review passes/);
  assert.doesNotMatch(page, /does not need a new review/);
  assert.doesNotMatch(page, /last commit/);
});

test("review does not require the plan or a cleanup commit", async () => {
  const review = await flat("workflow/review-and-merge.md");
  const skill = await flat("skills/code-review/SKILL.md");
  assert.match(review, /does not require a feature plan/);
  assert.doesNotMatch(review, /does not need a new review/);
  assert.doesNotMatch(review, /last commit/);
  assert.match(skill, /A feature plan is optional/);
  assert.match(skill, /Do not require a plan/);
  assert.doesNotMatch(skill, /check its statuses, actual commits and evidence/);
});

test("plan-work removes a completed plan before the pull request", async () => {
  const skill = await flat("skills/plan-work/SKILL.md");
  assert.match(skill, /remove the completed plan before you open the pull request/);
  assert.match(skill, /Do not remove a plan that is incomplete or blocked/);
});
