import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Skills that use subagents where they help (issue #58).
const skills = ["code-review", "writing-check", "apply-architecture", "write-adr", "clarify-intent"];

// Return the text of the "Subagents" section of a skill.
async function subagents(skill) {
  const text = await readFile(join(repoRoot, "skills", skill, "SKILL.md"), "utf8");
  const m = /^## Subagents\r?\n([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(m, `the ${skill} skill must have a Subagents section`);
  return m[1];
}

for (const skill of skills) {
  test(`the ${skill} skill has a Subagents section with a fallback`, async () => {
    const text = await subagents(skill);
    assert.match(text, /^If you can start subagents, /m);
    assert.match(text, /complete without your context/);
    assert.match(text, /word limit/);
    assert.match(text, /"Report to me only\. Do not [^"]*post, approve or merge\."/);
    assert.match(text, /^If you cannot start subagents, do the steps one at a time in the order of this skill\./m);
  });

  // Skills are agent- and tool-agnostic (issues #57 and #58).
  test(`the ${skill} Subagents section names no bot, tool or platform`, async () => {
    const text = (await subagents(skill)).replace(/https:\/\/\S+/g, "");
    const names = [/github/i, /gitea/i, /gitlab/i, /claude/i, /cursor/i, /grok/i, /codex/i,
      /copilot/i, /openai/i, /anthropic/i, /scribe/i, /sentinel/i, /\batlas\b/i, /\bpip\b/i];
    for (const name of names) assert.doesNotMatch(text, name);
  });
}

test("the writing-check skill gives the brief before step 2", async () => {
  const text = await subagents("writing-check");
  const brief = text.indexOf("complete without your context");
  const step2 = text.search(/do step 2 yourself/i);
  assert.notEqual(brief, -1);
  assert.notEqual(step2, -1);
  assert.ok(brief < step2, "the brief must come before step 2");
});

test("the apply-architecture skill chooses only after every design is checked", async () => {
  const text = await subagents("apply-architecture");
  assert.match(text, /For each design, do steps 2 and 3\./);
  assert.match(text, /Do steps 4 and 5 once, after you have checked every design\./);
  assert.doesNotMatch(text, /Check one design fully/);
});

test("the changelog states each subagent procedure in its own sentence", async () => {
  const text = await readFile(join(repoRoot, "CHANGELOG.md"), "utf8");
  const start = text.indexOf("- `skills/writing-check`, `skills/apply-architecture`, `skills/write-adr` and");
  assert.notEqual(start, -1);
  const end = text.indexOf("\n- `", start + 1);
  const bullet = text.slice(start, end).replace(/\s+/g, " ");
  assert.match(bullet, /A new reader checks the text in `writing-check`\./);
  assert.match(bullet, /Each design gets its own subagent in `apply-architecture`\./);
  assert.match(bullet, /Each option gets its own subagent in `write-adr`\./);
  assert.match(bullet, /One subagent reads the code and one subagent reads the docs in `clarify-intent`\./);
  assert.doesNotMatch(bullet, / or /);
});
