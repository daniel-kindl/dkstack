import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("coding/absent-values.md states the absent value rules", async () => {
  const page = await text("coding/absent-values.md");
  for (const part of [
    "# Absent values",
    "null check",
    "strictNullChecks",
    "<Nullable>enable</Nullable>",
    "special value",
    "`-1`",
    "at the boundary",
    "empty collection",
    "error-handling.md",
    "non-null assertion",
    "types.md",
  ]) {
    assert.ok(page.includes(part), `missing ${part}`);
  }
});

test("coding/absent-values.md has a good and a bad example", async () => {
  const page = await text("coding/absent-values.md");
  assert.ok(page.includes("## Good example"), "missing good example");
  assert.ok(page.includes("## Bad example"), "missing bad example");
});

test("coding/index.md lists coding/absent-values.md", async () => {
  assert.ok((await text("coding/index.md")).includes("(absent-values.md)"), "coding/index.md does not list the page");
});
