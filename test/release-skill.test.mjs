import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = join(repoRoot, "skills", "release", "SKILL.md");

async function skillText() {
  return readFile(skillPath, "utf8");
}

test("the release skill links the rules and states the publish rule", async () => {
  const text = await skillText();
  assert.match(text, /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/versioning\/index\.md/);
  assert.match(text, /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/workflow\/safety\.md/);
  assert.match(text, /owner's explicit OK for that release/);
  assert.match(text, /The OK names the exact version/);
  assert.match(text, /production deploy/);
  assert.match(text, /project's release workflow/);
});

test("the release skill does not copy the versioning or safety rules", async () => {
  const text = await skillText();
  const copied = [
    /Increment MAJOR when you make an incompatible change/,
    /refs\/heads\/v1/,
    /protect-release-tags/,
    /git push origin/,
    /npx skills add/,
    /Do not force-push/,
  ];
  for (const rule of copied) assert.doesNotMatch(text, rule);
});

test("the release skill names no bot, tool or platform and no single role", async () => {
  const text = (await skillText()).replace(/https:\/\/\S+/g, "");
  const names = [/github/i, /gitea/i, /gitlab/i, /claude/i, /cursor/i, /grok/i, /codex/i,
    /copilot/i, /openai/i, /anthropic/i, /scribe/i, /sentinel/i, /\batlas\b/i, /\bpip\b/i,
    /release-manager/i];
  for (const name of names) assert.doesNotMatch(text, name);
  assert.match(text, /One agent can do all the steps/);
  assert.match(text, /A skill does not make one role into one agent/);
});

test("skills/index.md lists the release skill", async () => {
  const text = await readFile(join(repoRoot, "skills", "index.md"), "utf8");
  assert.match(text, /\[release\]\(release\/SKILL\.md\)/);
});

test("triage routes a release and keeps the ladder small", async () => {
  const text = await readFile(join(repoRoot, "skills", "triage", "SKILL.md"), "utf8");
  const flat = text.replace(/\s+/g, " ");
  assert.match(text, /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/skills\/release\/SKILL\.md/);
  assert.match(flat, /Bug fix:.*tdd-loop.*code-review/);
  assert.match(flat, /Feature:.*clarify-intent.*apply-architecture.*plan-work.*tdd-loop.*code-review/);
  assert.match(flat, /one or two skills/);
  assert.match(flat, /review finding goes back to the implementation step/);
  assert.match(flat, /design finding goes back to the architecture step/);
  assert.match(text, /One agent can do all the steps/);
  assert.doesNotMatch(text, /release-manager/i);
});
