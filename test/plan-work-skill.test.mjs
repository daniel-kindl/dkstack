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
});

test("the plan-work skill falls back to steps in order", async () => {
  const text = await section("Subagents");
  assert.match(text, /If you cannot start subagents, do the steps one at a time in the order of this skill\./);
});

test("the plan-work skill has a fallback for each missing piece", async () => {
  const text = await section("When a piece is missing");
  for (const piece of [/^- No issue:/m, /^- No branch:/m, /^- No pull request yet:/m,
    /^- No automated checks:/m, /^- You cannot write to the plan path:/m,
    /^- The plan changed since you read it/m]) {
    assert.match(text, piece);
  }
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
