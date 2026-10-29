import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// dkstack has no npm dependencies, so its own Dependabot file has only the
// github-actions entry. This tests the repository, not the bootstrap skill (issue #36).
test("the repository Dependabot file updates the pinned actions weekly", async () => {
  const file = await readFile(join(repoRoot, ".github", "dependabot.yml"), "utf8");
  assert.match(file, /^version: 2$/m);
  const ecosystems = [...file.matchAll(/^\s*- package-ecosystem:\s*"([^"]+)"/gm)].map((m) => m[1]);
  assert.deepEqual(ecosystems, ["github-actions"]);
  assert.match(file, /^ {4}directory: "\/"$/m);
  assert.match(file, /^ {4}schedule:\n {6}interval: "weekly"$/m);
});
