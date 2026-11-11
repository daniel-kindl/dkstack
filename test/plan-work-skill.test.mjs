import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillFile = join(repoRoot, "skills", "plan-work", "SKILL.md");

// Return the text of the section with the given "## " heading.
async function section(heading) {
  const text = await readFile(skillFile, "utf8");
  const start = text.indexOf(`\n## ${heading}\n`);
  assert.notEqual(start, -1, `the plan-work skill must have a "${heading}" section`);
  const rest = text.slice(start + heading.length + 5);
  const end = rest.search(/^## /m);
  return end === -1 ? rest : rest.slice(0, end);
}

test("the plan-work skill uses subagents with a complete brief", async () => {
  const text = await section("Subagents");
  assert.match(text, /If you can start subagents/);
  assert.match(text, /complete without your context/);
  assert.match(text, /word limit/);
  assert.match(text, /"Report to me only\. Do not change the plan, commit, push, post, approve or merge\."/);
  assert.match(text, /Check each difference that a report gives against its source/);
  assert.match(text, /In step 7, compare the plan with the issue/);
  assert.match(text, /The full text of steps 5 to 7\./);
});

test("the plan-work skill falls back to steps in order", async () => {
  const text = await section("Subagents");
  assert.match(text, /If you cannot start subagents, do the steps one at a time in the order of this skill\./);
});

test("the plan-work skill has a fallback for each missing piece", async () => {
  const text = await section("When a piece is missing");
  for (const piece of [/^- No issue:/m, /^- No automated checks:/m,
    /^- You cannot write the plan where the task asks:/m]) {
    assert.match(text, piece);
  }
  assert.match(text, /Do not invent them\./);
});

// Skills are agent- and tool-agnostic.
test("the plan-work skill names no tool or platform", async () => {
  const text = (await readFile(skillFile, "utf8")).replace(/https:\/\/\S+/g, "");
  for (const name of [/github/i, /gitlab/i, /gitea/i, /\bgh\b/, /\bnpm\b/, /\bgit\b/i,
    /Conventional Commits/]) {
    assert.doesNotMatch(text, name);
  }
});

test("the plan-work skill links the small steps principle", async () => {
  const text = await section("Steps");
  assert.match(text, /architecture\/small-steps\.md/);
});

test("the plan-work steps keep the goal, small increments, tests first and the criteria map", async () => {
  const steps = (await section("Steps")).replace(/\s+/g, " ");
  assert.match(steps, /1\. Find the goal, the acceptance criteria/);
  assert.match(steps, /smallest increments that are complete and that a reviewer can review alone/);
  assert.match(steps, /put the tests before the behavior changes/);
  assert.match(steps, /Map each acceptance criterion to a test or a check in the plan\./);
  assert.match(steps, /6\. After each commit, if its result shows a new fact, change the later items\./);
  assert.match(steps, /7\. Before you report, compare the plan with the issue, the commits and the check results\./);
});

test("the plan goes where the task asks", async () => {
  const text = (await readFile(skillFile, "utf8")).replace(/\s+/g, " ");
  assert.match(text, /Put the plan where the task asks: in the issue, in the pull request or in the chat\./);
});

test("the plan-work skill does not invent", async () => {
  const text = await section("Boundaries");
  assert.match(text, /Do not invent a commit identifier, a test result or a decision\./);
  assert.ok(text.includes("- Obey the hard limits in [safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md)."));
});

test("the plan-work skill has no lifecycle terms", async () => {
  const text = await readFile(skillFile, "utf8");
  for (const term of [/\bclaims?\b/i, /status/i, /\bagent:/, /\bneeds:/, /\.plans/, /\bRELEASE\b/,
    /map-work/, /lifecycle/i, /preflight/i, /feature-plans/, /work\.md/, /claims\.md/,
    /readiness/i, /handoff/i]) {
    assert.doesNotMatch(text, term);
  }
});

test("the plan format has no pull request or status field", async () => {
  const text = await readFile(skillFile, "utf8");
  const start = text.indexOf("\n## Plan format\n");
  assert.notEqual(start, -1, "the plan-work skill must have a Plan format section");
  const fence = text.slice(start).match(/```\w*\n([\s\S]*?)\n```/);
  assert.ok(fence, "the Plan format section must have a fenced plan template");
  assert.doesNotMatch(fence[1], /^PR:/m);
  assert.doesNotMatch(fence[1], /^Status:/m);
  assert.match(fence[1], /^Issue: <reference or none>\n\n## Goal$/m);
  assert.match(fence[1], /^Tests first:$/m);
  assert.match(fence[1], /^Criteria covered:$/m);
});

test("the missing-piece section expects no pull request", async () => {
  const text = (await section("When a piece is missing")).replace(/\s+/g, " ");
  assert.match(text, /The steps expect an issue, automated checks and a place for the plan\./);
  assert.doesNotMatch(text, /a pull request/);
});

test("triage has no lifecycle routing", async () => {
  const text = await readFile(join(repoRoot, "skills", "triage", "SKILL.md"), "utf8");
  for (const term of [/verified claim/i, /claim before/i, /claims\.md/, /status:/, /\bagent:/,
    /\bneeds:/, /\.plans/, /\bRELEASE\b/, /map-work/, /lifecycle/i, /preflight/i,
    /feature-plans/, /work\.md/, /readiness/i, /^## Work route$/m, /^Handoffs:$/m]) {
    assert.doesNotMatch(text, term);
  }
  assert.match(text, /workflow\/safety\.md#owner-instructions-in-chat/);
});
