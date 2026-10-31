import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = join(repoRoot, "workflow", "work.md");

async function pageText() {
  return readFile(pagePath, "utf8");
}

test("workflow/index.md indexes the work contract", async () => {
  const text = await readFile(join(repoRoot, "workflow", "index.md"), "utf8");
  assert.match(text, /\[work\.md\]\(work\.md\)/);
});

test("the work contract defines the lifecycle, readiness and sources", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /triage.*planning.*ready.*active.*review.*closed/);
  assert.match(flat, /one lifecycle state/);
  assert.match(flat, /feature, bug, refactor, chore, docs or research/);
  assert.match(flat, /p0, p1, p2 or p3/);
  assert.match(flat, /Priority does not make an issue ready/);
  assert.match(flat, /agent or human/);
  assert.match(flat, /If eligibility is absent, the issue is not ready/);
  assert.match(flat, /state is ready/);
  assert.match(flat, /eligibility is agent/);
  assert.match(flat, /[Ee]very prerequisite is complete/);
  assert.match(flat, /acceptance criteria exist/);
  assert.match(flat, /native hierarchy/);
  assert.match(flat, /native blocker link/);
  assert.match(flat, /plan file in the repository/);
  assert.match(flat, /review record on that pull request/);
});

test("the work contract fails closed and isolates the mapping session", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /fail closed/);
  assert.match(flat, /missing, unsupported or in conflict/);
  assert.match(flat, /must not implement a mapped issue in that same session/);
  assert.match(flat, /context-sharing subagent is the same session/);
  assert.match(flat, /A fresh session implements the mapped issue/);
  assert.match(flat, /map-work/);
  assert.match(flat, /plan-work/);
  assert.match(flat, /plan-work plans the commits of one issue/);
});

test("mapping isolation applies to children, not the parent", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /mapped issue.*child issue/);
  assert.match(flat, /parent objective.*not a mapped issue/);
});

test("a closed prerequisite unlocks work only when it is complete", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /only when that prerequisite is complete/);
  assert.match(flat, /Closed is not enough/);
  assert.match(flat, /A rejected prerequisite is not complete/);
  assert.match(flat, /An abandoned prerequisite is not complete/);
  assert.match(flat, /does not say whether it is complete, rejected or abandoned, fail closed/);
  assert.doesNotMatch(flat, /every prerequisite is closed/i);
});

test("in-scope mapping does not need a separate owner record", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /does not need a new approval from the owner/);
  assert.match(flat, /material expansion of that scope/);
  assert.match(flat, /restricted action/);
  assert.doesNotMatch(flat, /authorized map-work in the parent issue/);
});

test("the work contract links the existing rules and does not copy them", async () => {
  const text = await pageText();
  assert.match(text, /\[safety\.md\]\(safety\.md\)/);
  assert.match(text, /\[roles\.md\]\(roles\.md\)/);
  assert.match(text, /\[review-and-merge\.md\]\(review-and-merge\.md\)/);
  assert.match(text, /\[feature-plans\.md\]\(feature-plans\.md\)/);
  assert.doesNotMatch(text, /Do not force-push/);
  assert.doesNotMatch(text, /The reviewer merges only the head that they reviewed/);
  assert.doesNotMatch(text, /github/i);
  assert.doesNotMatch(text, /gitea/i);
  assert.doesNotMatch(text, /gitlab/i);
});
