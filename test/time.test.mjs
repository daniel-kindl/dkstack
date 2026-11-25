import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("coding/time.md states the time and date rules", async () => {
  const page = await text("coding/time.md");
  for (const part of [
    "# Time and dates",
    "UTC",
    "RFC 3339",
    "IANA time zone",
    "Europe/Prague",
    "clock",
    "TimeProvider",
    "java.time.Clock",
    "monotonic",
    "performance.now()",
    "time.monotonic()",
    "tdd/deterministic-tests.md",
    "86400",
  ]) {
    assert.ok(page.includes(part), `missing ${part}`);
  }
});

test("coding/time.md has a good and a bad example", async () => {
  const page = await text("coding/time.md");
  assert.ok(page.includes("## Good example"), "missing good example");
  assert.ok(page.includes("## Bad example"), "missing bad example");
});

test("coding/index.md lists coding/time.md", async () => {
  assert.ok((await text("coding/index.md")).includes("(time.md)"), "coding/index.md does not list the page");
});
