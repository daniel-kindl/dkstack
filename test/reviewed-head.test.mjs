import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";
import { markdownFiles as listMarkdown } from "../scripts/markdown-files.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the Blocking row names a deploy or release that an agent starts without the owner's OK", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const row = text.split("\n").find((line) => line.startsWith("| Blocking |"));
  assert.ok(row, "the severity table must have a Blocking row");
  assert.match(
    row,
    /an agent can start a production deploy or a project's release workflow, or release without the owner's OK/,
  );
});

// SEN-10 in #154: a check that is not green must not get an approval.
test("APPROVE-RECOMMENDED needs each required check green, and a pending check gets no verdict yet", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const verdict = text.slice(text.indexOf("## Verdict"), text.indexOf("## Output"));
  const approve = verdict.split("\n").find((l) => l.startsWith("- APPROVE-RECOMMENDED:"));
  assert.match(approve, /each required check is green on the reviewed head/);
  assert.doesNotMatch(approve, /or its state is stated/);
  assert.match(verdict.replace(/\s+/g, " "), /If a required check is pending, give no verdict yet\./);
});

test("a broken build or a failing required check is in the High row only", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const rows = text.split("\n").filter((l) => /^\| (Blocking|High|Medium|Low) \|/.test(l));
  const withFact = (re) => rows.filter((r) => re.test(r)).map((r) => r.split("|")[1].trim());
  assert.deepEqual(withFact(/broken build/), ["High"]);
  assert.deepEqual(withFact(/failing required check/), ["High"]);
});

test("owner and agent merge authority stays distinct", async () => {
  const review = (await readFile(join(repoRoot, "workflow/review-and-merge.md"), "utf8")).replace(/\s+/g, " ");
  const skill = (await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8")).replace(/\s+/g, " ");
  assert.match(review, /The author never merges\./);
  assert.match(review, /owner\]\(safety\.md#owner\) may also merge/i);
  assert.match(skill, /author never gives the verdict on, approves or merges their own pull request/i);
  for (const text of [review, skill]) {
    assert.doesNotMatch(text, /agent may merge only with the owner's explicit authorization/i);
    assert.doesNotMatch(text, /any merge an agent performs/i);
  }
});

test("the Safety bullet uses the same three Blocking cases", async () => {
  const text = await readFile(join(repoRoot, "skills/review-standards/SKILL.md"), "utf8");
  const line = text.split("\n").find((entry) => entry.startsWith("- Safety:"));
  assert.ok(line, "the standards list must have a Safety bullet");
  assert.match(
    line,
    /a production deploy or a project's release workflow, or release without the owner's OK/,
  );
});

test("the code-review rules link the merge gate", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const rules = /^## Rules\r?\n([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(rules, "the code-review skill must have a Rules section");
  assert.match(rules[1], /workflow\/review-and-merge\.md#rules/);
  assert.doesNotMatch(rules[1], /agent may merge only with the owner's explicit authorization/);
});

test("safety.md defines the owner under its own heading", async () => {
  const text = await readFile(join(repoRoot, "workflow/safety.md"), "utf8");
  const section = /^## Owner\r?\n([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(section, "safety.md must have an Owner section");
  const flat = section[1].replace(/\s+/g, " ");
  assert.ok(flat.includes("A bot or an agent that acts through the owner's account is always an agent."));
  assert.ok(flat.includes("It is never the owner."));
});

// The shared list reads the files that Git sees, so an ignored copy of the
// pages, or a copy in a nested Git work tree, does not fail a local run (#333).
async function markdownFiles(dir) {
  const files = await listMarkdown(join(repoRoot, dir));
  return files.map((full) => relative(repoRoot, full).split(sep).join("/"))
    .filter((path) => path !== "CHANGELOG.md");
}

// #191: an agent does not get a role. The task and the skills tell it what to do.
test("no page defines an agent role or links the removed roles page", async () => {
  await assert.rejects(access(join(repoRoot, "workflow/roles.md")), "workflow/roles.md must not exist");
  for (const file of await markdownFiles(".")) {
    const text = (await readFile(join(repoRoot, file), "utf8")).replace(/\s+/g, " ");
    assert.doesNotMatch(text, /\broles\.md\b/, `${file} links roles.md`);
    assert.doesNotMatch(text, /\bthe (?:implementer|architect|writer|coordinator)\b/i, `${file} names an agent role`);
    assert.doesNotMatch(text, /^#+ Role definitions/m, `${file} defines roles`);
  }
});

test("missing review evidence never counts as a review", async () => {
  const review = (await readFile(join(repoRoot, "workflow/review-and-merge.md"), "utf8")).replace(/\s+/g, " ");
  const evidence = review.slice(review.indexOf("## Missing review evidence after merge"), review.indexOf("## Good example"));
  assert.ok(evidence.includes("do not treat the pull request as reviewed"));
  assert.ok(evidence.includes("Never backdate or invent review evidence."));
  assert.ok(evidence.includes("It never allows a self-review."));
  assert.ok(evidence.includes("independent of the author"));
  assert.ok(evidence.includes("It never removes the need for an independent review."));
  assert.doesNotMatch(evidence, /;|\b(?:durably|attest|establish|genuine|obtain|insufficient)\b/i);
});

test("review and release skills keep the merge and publish gates", async () => {
  const review = (await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8")).replace(/\s+/g, " ");
  const release = (await readFile(join(repoRoot, "skills/release/SKILL.md"), "utf8")).replace(/\s+/g, " ");
  assert.match(review, /author never gives the verdict on, approves or merges their own pull request/i);
  assert.doesNotMatch(review, /agent may merge only with the owner's explicit authorization/i);
  // D2 in #154: no agent publishes or releases.
  assert.match(release, /An agent does not publish or release\./);
});

test("review-and-merge names no feature plan", async () => {
  const review = (await readFile(join(repoRoot, "workflow/review-and-merge.md"), "utf8")).replace(/\s+/g, " ");
  assert.doesNotMatch(review, /The review does not require a feature plan\./);
  assert.doesNotMatch(review, /feature-plans\.md/);
});
