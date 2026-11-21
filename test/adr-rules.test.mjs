import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const read = async (path) => (await readFile(join(repoRoot, path), "utf8")).replace(/\s+/g, " ");

test("adrs.md has the three-part ADR test", async () => {
  const text = await read("architecture/adrs.md");
  assert.match(text, /Write an ADR only when all three are true:/);
  assert.match(text, /1\. The decision is hard to reverse\./);
  assert.match(text, /2\. A new reader would find it surprising without the context\./);
  assert.match(text, /3\. It comes from a real trade-off between options\./);
  assert.match(text, /Record a smaller decision in the map or in the pull request body\./);
  assert.doesNotMatch(text, /Write an ADR when a decision is hard to reverse or affects multiple components\./);
});

test("a new ADR has Status and Affects lines, and an old ADR does not need them", async () => {
  const text = await read("architecture/adrs.md");
  assert.match(text, /A new ADR has a `Status:` line/);
  assert.match(text, /`Proposed`, `Accepted` or `Superseded by NNNN`/);
  assert.match(text, /an `Affects:` line/);
  assert.match(text, /Do not add these lines to an old ADR\./);
  assert.match(text, /An old ADR with no `Status:` line counts as Accepted unless a later ADR supersedes it\./);
});

test("code that contradicts an Accepted ADR is High and blocks the merge", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const high = text.split("\n").find((line) => line.startsWith("| High |"));
  assert.ok(high, "the severity table must have a High row");
  assert.match(high, /code that contradicts an Accepted ADR/i);
  assert.match(high, /\| Yes \|$/);
});

test("an ADR finding quotes the ADR line and the code line", async () => {
  const text = await read("skills/code-review/SKILL.md");
  assert.match(text, /A High ADR finding quotes the ADR line and the code line that it breaks\./);
  assert.match(text, /Without both quotes, write it as a question, not as a High finding\./);
  assert.match(text, /A newer ADR that supersedes the old ADR clears the finding\./);
  assert.match(text, /read its title and its Decision section/);
  assert.match(text, /A missing `Affects:` line on an old ADR is never a finding\./);
});

test("the standards Architecture bullet points at the ADR rule", async () => {
  const text = await read("skills/review-standards/SKILL.md");
  const bullet = /- Architecture: [^\n]*?(?= - [A-Z][a-z ]+: )/.exec(text);
  assert.ok(bullet, "review-standards must have an Architecture bullet");
  assert.ok(bullet[0].includes(`${RAW}skills/code-review/SKILL.md#adr-findings`));
});

test("write-adr step 1 links the test and does not restate it", async () => {
  const text = await read("skills/write-adr/SKILL.md");
  const step1 = /1\. (.*?) 2\. /.exec(text);
  assert.ok(step1, "write-adr must have steps 1 and 2");
  assert.ok(step1[1].includes(`${RAW}architecture/adrs.md#when-to-write-an-adr`));
  assert.doesNotMatch(step1[1], /hard to reverse|surprising|trade-off|multiple components/);
});

test("write-adr step 2 adds Status and Affects for a new ADR", async () => {
  const text = await read("skills/write-adr/SKILL.md");
  const step2 = /2\. (.*?) 3\. /.exec(text);
  assert.ok(step2);
  assert.match(step2[1], /`Status:`/);
  assert.match(step2[1], /`Affects:`/);
});

test("ADR 0001 has no Affects line", async () => {
  const text = await readFile(join(repoRoot, "docs/adr/0001-how-consumers-follow-versions.md"), "utf8");
  assert.doesNotMatch(text, /Affects:/);
});
