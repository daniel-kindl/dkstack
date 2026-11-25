import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("coding/feature-flags.md states the feature flag rules", async () => {
  const page = await text("coding/feature-flags.md");
  for (const part of [
    "# Feature flags",
    "owner",
    "linked issue",
    "each state",
    "Remove the flag",
    "dead path",
    "architecture/configuration.md",
    "permission",
    "safe default",
    "Do not nest",
  ]) {
    assert.ok(page.includes(part), `missing ${part}`);
  }
});

test("coding/feature-flags.md has a good and a bad example", async () => {
  const page = await text("coding/feature-flags.md");
  assert.ok(page.includes("## Good example"), "missing good example");
  assert.ok(page.includes("## Bad example"), "missing bad example");
});

test("coding/index.md lists coding/feature-flags.md", async () => {
  assert.ok((await text("coding/index.md")).includes("(feature-flags.md)"), "coding/index.md does not list the page");
});
