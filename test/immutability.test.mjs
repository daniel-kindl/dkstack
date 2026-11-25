import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("coding/immutability.md states the immutability rules", async () => {
  const page = await text("coding/immutability.md");
  for (const part of [
    "# Immutability",
    "`const`",
    "`readonly`",
    "`final`",
    "`val`",
    "argument",
    "Return a new value",
    "value object",
    "measurement",
    "prefer-const",
    "no-param-reassign",
    "architecture/concurrency.md",
    "Object.freeze",
  ]) {
    assert.ok(page.includes(part), `missing ${part}`);
  }
});

test("coding/immutability.md has a good and a bad example", async () => {
  const page = await text("coding/immutability.md");
  assert.ok(page.includes("## Good example"), "missing good example");
  assert.ok(page.includes("## Bad example"), "missing bad example");
});

test("coding/index.md lists coding/immutability.md", async () => {
  assert.ok((await text("coding/index.md")).includes("(immutability.md)"), "coding/index.md does not list the page");
});
