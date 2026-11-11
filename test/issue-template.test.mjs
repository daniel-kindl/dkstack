import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(repoRoot, ".github", "ISSUE_TEMPLATE", "external-request.md");

test("the external request template keeps the four fields", async () => {
  const text = await readFile(templatePath, "utf8");
  for (const heading of ["## Outcome", "## Constraints", "## Context", "## Acceptance intent"]) {
    assert.match(text, new RegExp(`^${heading}$`, "m"), `missing ${heading}`);
  }
});

test("the external request template sets no label and does not forbid a split", async () => {
  const text = await readFile(templatePath, "utf8");
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  assert.ok(m, "the template must have front matter");
  assert.doesNotMatch(m[1], /^labels:/m);
  assert.doesNotMatch(text, /status:triage/);
  assert.doesNotMatch(text, /Do not split/i);
  assert.doesNotMatch(text, /splitting/i);
});
