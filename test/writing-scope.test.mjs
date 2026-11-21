import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";
import { writingWarnings } from "../scripts/check-writing.mjs";

// REED-3, IRIS-8 and REED-MISS-5 in #154, after D3: "D3: ASD-STE100 for all
// text, as today". One scope section owns where the rules apply.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (file) => (await readFile(join(repoRoot, file), "utf8")).replace(/\s+/g, " ");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

test("writing/index.md has one scope that covers all text, including product copy", async () => {
  const page = await read("writing/index.md");
  const scope = page.slice(page.indexOf("## Scope"), page.indexOf("## Rules"));
  assert.ok(page.includes("## Scope"));
  for (const phrase of ["all text that people or agents read", "Product copy", "UI text", "landing pages",
    "product READMEs", "release notes", "announcements", "emails", "Nothing is out of scope."]) {
    assert.ok(scope.includes(phrase), phrase);
  }
  assert.ok(page.slice(page.indexOf("## Application")).includes("(#scope)"));
});

test("writing-check and the UI content page link the scope and do not exclude UI copy", async () => {
  const check = await read("skills/writing-check/SKILL.md");
  assert.ok(check.includes(`(${RAW}writing/index.md#scope)`));
  const content = await read("ui/content-and-localization.md");
  assert.ok(content.includes("(../writing/index.md#scope)"));
  assert.doesNotMatch(content, /not to UI copy/);
});

// SCR-21 in #154: the two pages that the review named keep their sentences
// in the limits. A semicolon is a second sentence.
test("code-review and versioning/index.md have no sentence over 25 words and no semicolon", async () => {
  // The Low on #254: use the splitter of check-writing, not a copy of it.
  for (const file of ["skills/code-review/SKILL.md", "versioning/index.md"]) {
    const text = await readFile(join(repoRoot, file), "utf8");
    assert.deepEqual(writingWarnings(file, text), []);
  }
});

// REED-11, SCR-9 and REED-MISS-4 in #154, after the D3 sub-choices: the
// rules have limits that a check can test, and examples of AI prose patterns.
test("the writing rules set the sentence limits, ban semicolons and give AI prose examples", async () => {
  const page = await read("writing/index.md");
  const rules = page.slice(page.indexOf("## Rules"), page.indexOf("## Code comments"));
  for (const phrase of ["A step has at most 20 words.", "A sentence in a description has at most 25 words.", "Do not use a semicolon."]) assert.ok(rules.includes(phrase), phrase);
  const patterns = page.slice(page.indexOf("## AI prose patterns"), page.indexOf("## Code comments"));
  assert.ok(page.includes("## AI prose patterns"));
  const examples = patterns.split(" - ").length - 1;
  assert.ok(examples >= 5 && examples <= 6, `5 or 6 examples, not ${examples}`);
  assert.ok(page.slice(page.indexOf("## Scope"), page.indexOf("## Rules")).includes("the learn tutor"));
});

test("writing-check checks each rule in writing/index.md and lists no subset", async () => {
  const check = await read("skills/writing-check/SKILL.md");
  const steps = check.slice(check.indexOf("## Steps"), check.indexOf("## Subagents"));
  assert.ok(steps.includes("Check the text against each rule in"));
  assert.doesNotMatch(steps, /short sentences, active voice/);
});
