import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, sectionText } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("coding/quality.md owns the literal value rule", async () => {
  const section = sectionText(await text("coding/quality.md"), "## Literal values");
  for (const part of ["named constant", "`0`", "`1`", "test", "configuration", "no-magic-numbers", "PLR2004"]) {
    assert.ok(section.includes(part), `missing ${part}`);
  }
});

test("coding/quality.md owns the complexity rule", async () => {
  const section = sectionText(await text("coding/quality.md"), "## Complexity");
  for (const part of ["cyclomatic complexity", "10", "in CI as an error", "Record", "Do not raise the limit", "complexity", "C901", "CA1502"]) {
    assert.ok(section.includes(part), `missing ${part}`);
  }
});

test("review-standards links the two smells to their owner sections", async () => {
  const lines = (await text("skills/review-standards/SKILL.md")).split("\n");
  const magic = lines.find((line) => line.startsWith("| Magic value"));
  const long = lines.find((line) => line.startsWith("| Long function"));
  assert.ok(magic.includes("v1/coding/quality.md#literal-values"), "Magic value row must link the rule");
  assert.ok(long.includes("v1/coding/quality.md#complexity"), "Long function row must link the rule");
});
