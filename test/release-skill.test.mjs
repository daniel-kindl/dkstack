import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
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

// SEN-4 and D2 in #154: no agent publishes or releases. The skill links the
// rule in workflow/safety.md and stops after it proposes the version.
test("the release skill links the rules and does not publish or release", async () => {
  const text = await skillText();
  assert.match(text, /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/versioning\/index\.md/);
  assert.match(text, /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/workflow\/safety\.md/);
  assert.doesNotMatch(text, /explicit OK/);
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
  assert.match(text, /One agent can do all the steps/);
  assert.doesNotMatch(text, /release-manager/i);
});

test("the release skill stops after it proposes the version and the changelog entry", async () => {
  const steps = sectionText(await read("skills/release/SKILL.md"), "## Steps")
    .filter((line) => /^\d+\. /.test(line));
  assert.deepEqual(steps.map((line) => line.split(".")[0]), ["1", "2", "3", "4", "5"]);
  assert.match(steps[4], /^5\. Propose the version and the changelog entry to the owner\. Then stop\./);
});

test("the release skill stops at the right step when a piece is missing", async () => {
  const text = sectionText(await read("skills/release/SKILL.md"), "## When a piece is missing").join(" ");
  assert.match(text, /No changelog entry for this release: stop at step 3\./);
  assert.doesNotMatch(text, /rights to create a tag/);
});

test("the release skill Rules section links the release rule and does not restate it", async () => {
  const rules = sectionText(await read("skills/release/SKILL.md"), "## Rules").join(" ");
  assert.ok(rules.includes("An agent does not publish or release."));
  assert.ok(rules.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md)"));
});

// D1 in #154: dkstack agents use the owner's account, so the release rule is
// an honor rule there. safety.md owns the rule. Other pages link it.
test("safety.md owns the release rule, and a tag or branch push that starts a release counts", async () => {
  const safety = (await read("workflow/safety.md")).replace(/\s+/g, " ");
  for (const phrase of ["No agent creates a release tag", "pushes to a release branch or to `v1`",
    "starts a release or deploy workflow", "counts as starting it", "honor rule"]) {
    assert.ok(safety.includes(phrase), phrase);
  }
  const versioning = (await read("versioning/index.md")).replace(/\s+/g, " ");
  assert.ok(versioning.includes("honor rule"));
  assert.ok(versioning.includes("do not stop an agent that uses Daniel's account"));
  const finish = versioning.slice(versioning.indexOf("### Finish a release"), versioning.indexOf("## Roll back"));
  assert.ok(finish.includes("Daniel only."));
  const contributing = (await read("CONTRIBUTING.md")).replace(/\s+/g, " ");
  assert.ok(contributing.includes("(workflow/safety.md)"));
  assert.doesNotMatch(contributing, /the release pull request, `validate`, the merge, the tag/);
});
