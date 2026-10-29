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
