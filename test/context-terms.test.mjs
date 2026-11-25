import { test } from "node:test";
import assert from "node:assert/strict";
import { flatten, readFile, sectionText } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";
import { markdownFiles as listMarkdown } from "../scripts/markdown-files.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = (path) => readFile(join(repoRoot, path), "utf8");
const read = async (path) => (await raw(path)).replace(/\s+/g, " ");

// Issue #285: the pages use the terms of CONTEXT.md. CONTEXT.md names the
// avoided words, and CHANGELOG.md keeps the words of each released entry.
// The shared list reads the files that Git sees, so an ignored copy of the
// pages, or a copy in a nested Git work tree, does not fail a local run (#333).
async function markdownFiles(dir) {
  const files = await listMarkdown(join(repoRoot, dir));
  return files.map((full) => relative(repoRoot, full).split(sep).join("/"))
    .filter((path) => !["CHANGELOG.md", "CONTEXT.md"].includes(path));
}

// Return each word of each "_Avoid_:" line of CONTEXT.md.
async function avoidedWords() {
  const lines = (await raw("CONTEXT.md")).split("\n");
  return lines.filter((line) => line.startsWith("_Avoid_:"))
    .flatMap((line) => line.slice("_Avoid_:".length).split(","))
    .map((word) => word.trim())
    .filter(Boolean);
}

// "block" also names other things, for example a code block or a progress
// block. The skill pages test it below.
const SHARED_WORDS = new Set(["block"]);

test("no page uses an avoided word of CONTEXT.md", async () => {
  const words = (await avoidedWords()).filter((word) => !SHARED_WORDS.has(word));
  assert.ok(words.length > 0, "CONTEXT.md must have _Avoid_: words");
  const files = await markdownFiles(".");
  for (const word of words) {
    const pattern = new RegExp(`\\b${word.replace(/[-]/g, "[- ]?")}(?:s|ies)?\\b`, "i");
    for (const file of files) {
      assert.doesNotMatch(await read(file), pattern, `${file} uses "${word}"`);
    }
  }
});

test("a page calls a repository that points to dkstack a consumer", async () => {
  for (const file of ["AGENTS.md", "README.md", "docs/index.md", "skills/triage/SKILL.md"]) {
    assert.doesNotMatch(await read(file), /\b(?:project|repository) that points? to\b|\bpoints to them\b/i, file);
  }
  for (const file of ["AGENTS.md", "docs/index.md", "skills/triage/SKILL.md"]) {
    assert.match(await read(file), /\bconsumer\b/, file);
  }
  assert.match(await read("versioning/index.md"), /A consumer does not use them\./);
});

test("the skill pages call a building block a building block", async () => {
  const files = (await markdownFiles("skills")).concat(["CONTRIBUTING.md"]);
  for (const file of files) {
    const text = (await read(file)).replace(/building blocks?/gi, "");
    assert.doesNotMatch(text, /\b(?:one|a|each|its) blocks? of\b|\bits blocks\b|\b(?:a|each|use a) block\b(?! the merge)/i, file);
  }
  assert.doesNotMatch(await read("CONTRIBUTING.md"), /\bits parent\b|\bparent skill\b/i);
  assert.doesNotMatch(await read("test/skill-invocation.test.mjs"), /\b(?:review|setup) blocks?\b/i);
});

// The #191 entry is not released, and no release has safety.md#human-owner.
test("CHANGELOG.md links the Owner anchor and no removed anchor", async () => {
  const text = await read("CHANGELOG.md");
  assert.doesNotMatch(text, /safety\.md#human-owner/);
  assert.ok(text.includes("link `workflow/safety.md#owner`"));
});

// The Unreleased entries become the next release notes, so they use the terms too.
test("the Unreleased entries of CHANGELOG.md use no avoided word", async () => {
  const text = await read("CHANGELOG.md");
  const unreleased = text.slice(text.indexOf("## [Unreleased]"), text.search(/## \[\d/));
  for (const word of (await avoidedWords()).filter((w) => !SHARED_WORDS.has(w))) {
    assert.doesNotMatch(unreleased, new RegExp(`\\b${word}s?\\b`, "i"), word);
  }
  assert.doesNotMatch(unreleased, /\bthe blocks\b/i);
});

test("quality-gates calls a switched-off diagnostic a suppression", async () => {
  const text = await raw("coding/quality-gates.md");
  assert.match(text, /^## Suppressions$/m);
  assert.doesNotMatch(text, /^## Exceptions$/m);
  const section = flatten(sectionText(text, "## Suppressions"));
  assert.doesNotMatch(section.replace(/\[Precedence\]|exception to a dkstack rule|record an exception/g, ""), /exception/i);
  for (const file of ["coding/quality.md", "coding/naming.md"]) {
    assert.ok((await raw(file)).includes("quality-gates.md#suppressions"), file);
  }
});

test("a local run of the checks is a run of the quality gates", async () => {
  assert.match(await read("skills/tdd-loop/SKILL.md"), /Run the quality gates of the repository before you report\./);
  assert.match(await read("tdd/red-green-refactor.md"), /Run all quality gates before you open the pull request\./);
});
