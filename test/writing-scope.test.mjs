import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

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
