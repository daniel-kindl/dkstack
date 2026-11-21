import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkTitle } from "../scripts/check-title.mjs";

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

// Dependabot titles must pass the title check. Without a prefix, the title starts with "Bump".
test("the repository Dependabot file sets the ci prefix for commit titles", async () => {
  const file = await readFile(join(repoRoot, ".github", "dependabot.yml"), "utf8");
  assert.match(file, /^ {4}commit-message:\n {6}prefix: "ci"$/m);
});

test("a short Dependabot title with the ci prefix passes the title check", () => {
  assert.deepEqual(checkTitle("ci: bump actions/checkout from 7.0.1 to 7.1.0"), []);
});

// A long title still fails. The reviewer edits the title before the merge.
test("a Dependabot title over 50 characters still fails the title check", () => {
  const title = "ci: bump actions/create-github-app-token from 3.3.0 to 3.4.0";
  assert.equal(checkTitle(title).length, 1);
});
