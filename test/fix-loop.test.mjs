import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// Issue #279: the author fixes every finding and gets a new review until the review approves.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const raw = async (file) => readFile(join(repoRoot, file), "utf8");
const flat = async (file) => (await raw(file)).replace(/\s+/g, " ");

test("the review page owns the fix loop, with a reason", async () => {
  const text = await flat("workflow/review-and-merge.md");
  const start = text.indexOf("- After a verdict that is not APPROVE-RECOMMENDED");
  assert.notEqual(start, -1, "the review page must have the fix loop rule");
  const rule = text.slice(start, text.indexOf(" - ", start + 2));
  for (const phrase of [
    "the author fixes each finding of every severity with [tdd-loop](../skills/tdd-loop/SKILL.md).",
    "Then the author gets a new independent review of the new head.",
    "Repeat until the verdict is APPROVE-RECOMMENDED.",
    "Do not ask the owner whether to fix a finding.",
    "Ask the owner only for a decision that only the owner can make.",
    "If you think that a finding is wrong, give the evidence on the pull request. The next review decides.",
  ]) {
    assert.ok(rule.includes(phrase), `missing: ${phrase}`);
  }
  assert.match(rule, /Reason: /);
});

test("a Low finding blocks the merge", async () => {
  const text = await raw("skills/code-review/SKILL.md");
  const rows = text.split("\n").filter((l) => /^\| (Blocking|High|Medium|Low) \|/.test(l));
  assert.equal(rows.length, 4);
  for (const row of rows) assert.match(row, /\| Yes \|$/, `must block the merge: ${row}`);
});

test("APPROVE-RECOMMENDED means no open finding", async () => {
  const text = await raw("skills/code-review/SKILL.md");
  const verdict = text.slice(text.indexOf("## Verdict"), text.indexOf("## Output"));
  const line = (name) => verdict.split("\n").find((l) => l.startsWith(`- ${name}:`));
  assert.match(line("CHANGES-REQUESTED"), /one or more High, Medium or Low findings/);
  assert.match(line("APPROVE-RECOMMENDED"), /^- APPROVE-RECOMMENDED: no open finding, and each required check is green on the reviewed head\./);
  assert.doesNotMatch(verdict, /only Low findings/);
  assert.ok(verdict.includes(`(${RAW}workflow/review-and-merge.md#rules)`), "the verdict section must link the fix loop");
});

test("the self-review fixes the findings and does not only list them", async () => {
  const text = await flat("skills/code-review/SKILL.md");
  const self = text.slice(text.indexOf("## Self-review"), text.indexOf("## Rules"));
  assert.match(self, /The author fixes each finding\./);
  assert.doesNotMatch(self, /lists them in the body/);
});

test("the workflow flow has the fix loop", async () => {
  const text = await flat("workflow/index.md");
  assert.match(text, /If the verdict is not APPROVE-RECOMMENDED, the author fixes each finding and gets a new review\. See the \[fix loop\]\(review-and-merge\.md#rules\)\./);
});

test("no rule tells the author to ask whether to fix a finding", async () => {
  for (const file of ["workflow/review-and-merge.md", "skills/code-review/SKILL.md", "workflow/index.md",
    "skills/tdd-loop/SKILL.md", "skills/write-pr/SKILL.md"]) {
    assert.doesNotMatch(await flat(file), /(?<!not )ask (the owner )?(whether|if) (to|you should) fix/i, file);
  }
});
