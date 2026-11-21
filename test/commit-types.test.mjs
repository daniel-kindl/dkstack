import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TYPES } from "../scripts/check-title.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// The page lists the types that the title check allows. The two lists must be the same.
test("the version control page lists each type that the title check allows", async () => {
  const page = await readFile(join(repoRoot, "version-control", "index.md"), "utf8");
  const match = /^- Allowed types: ([\s\S]*?)\. A title with a different type fails/m.exec(page);
  assert.ok(match, "version-control/index.md has no 'Allowed types:' rule");
  const listed = [...match[1].matchAll(/`([a-z]+)`/g)].map((m) => m[1]);
  assert.deepEqual(listed, TYPES);
});
