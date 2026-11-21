import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// ATL-M1, SCR-M2 and SCR-M4 in #154, after D5: "D5: same, but a renamed
// anchor that keeps a redirect is MINOR". The owner chose no v1 fixes after v2.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (file) => (await readFile(join(repoRoot, file), "utf8")).replace(/\s+/g, " ");

test("versioning/index.md defines MAJOR, MINOR and PATCH for dkstack, with one example each", async () => {
  const page = await read("versioning/index.md");
  const at = page.indexOf("## Breaking changes in dkstack");
  assert.notEqual(at, -1);
  const section = page.slice(at, page.indexOf(" ## ", at + 5));
  for (const phrase of ["MAJOR:", "remove or rename a skill, a page or an anchor that a skill or AGENTS.md links",
    "add a hard limit", "MINOR:", "a new skill, a new page or a new duty", "keeps the old anchor as a redirect",
    "PATCH:", "wording only", "Example:", "`!`", "Consumer action:"]) {
    assert.ok(section.includes(phrase), phrase);
  }
  assert.equal(section.split("Example:").length - 1, 3, "one example for each class");
});

test("SECURITY.md says that v1 gets no fixes after v2, and CHANGELOG.md links the rule", async () => {
  assert.ok((await read("SECURITY.md")).includes("After `v2` is released, `v1` gets no fixes."));
  const changelog = await read("CHANGELOG.md");
  assert.ok(changelog.slice(0, changelog.indexOf("## [Unreleased]")).includes("(versioning/index.md#breaking-changes-in-dkstack)"));
});
