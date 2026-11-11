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

async function read(path) {
  return readFile(join(repoRoot, path), "utf8");
}

// Return the text of one "## " section, without its heading.
function sectionText(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.indexOf(heading);
  assert.notEqual(start, -1, `missing section ${heading}`);
  let end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  if (end === -1) end = lines.length;
  return lines.slice(start + 1, end);
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

test("the release skill applies the publish rule at step 5, before steps 6 and 7", async () => {
  const steps = sectionText(await read("skills/release/SKILL.md"), "## Steps")
    .filter((line) => /^\d+\. /.test(line));
  assert.deepEqual(steps.map((line) => line.split(".")[0]), ["1", "2", "3", "4", "5", "6", "7"]);
  assert.equal(steps[4],
    "5. Apply the publish rule. Stop when the rule does not allow the release. Do not start step 6 before this check passes.");
  assert.match(steps[5], /^6\. Follow the release steps on the versioning page\./);
  assert.match(steps[6], /^7\. Verify the release as the versioning page says\./);
});

test("the release skill stops at the right step when a piece is missing", async () => {
  const lines = sectionText(await read("skills/release/SKILL.md"), "## When a piece is missing")
    .filter((line) => line.trim() !== "");
  assert.deepEqual(lines, [
    "The steps expect a changelog entry, the rights to create a tag and the owner's OK for this release. " +
      "If a piece is missing, stop and report it. Do not guess the missing piece.",
    "- No changelog entry for this release: stop at step 3. Report that the entry is missing. " +
      "Do not write an entry that nobody reviewed.",
    "- No rights to create a tag or to do another release step: stop before step 6. " +
      "Report the step and the right that is missing. Do not use other rights and do not change the protection.",
    "- No OK from the owner for this release and this version: stop at step 5. " +
      "Report the version that you chose and ask the owner. An OK for a different version is not the OK.",
  ]);
});

test("the release skill Rules section keeps the publish rule", async () => {
  const rules = sectionText(await read("skills/release/SKILL.md"), "## Rules");
  assert.ok(rules.includes("- An agent publishes or releases only with the owner's explicit OK for that release. " +
    "The OK names the exact version. It never covers a production deploy or a project's release workflow."));
});
