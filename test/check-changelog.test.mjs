import { test } from "node:test";
import assert from "node:assert/strict";
import { checkChangelog } from "../scripts/check-changelog.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

async function run(files) {
  const root = await makeTree(files);
  try { return await checkChangelog(root); } finally { await removeTree(root); }
}
const pkg = (v) => JSON.stringify({ version: v });
const missing = (v) => [`CHANGELOG.md: add a "## [${v}]" entry for the package.json version ${v}`];

test("a version with an entry passes", async () => {
  assert.deepEqual(await run({ "package.json": pkg("1.0.0"), "CHANGELOG.md": "## [Unreleased]\n\n## [1.0.0] - 2026-10-28\n" }), []);
});
test("a version with no entry fails with a clear message", async () => {
  assert.deepEqual(await run({ "package.json": pkg("0.1.0"), "CHANGELOG.md": "## [Unreleased]\n" }),
    ['CHANGELOG.md: add a "## [0.1.0]" entry for the package.json version 0.1.0']);
});
test("a prefix match or a version in body text does not count", async () => {
  const r = await run({ "package.json": pkg("1.0.0"), "CHANGELOG.md": "## [1.0.01]\n## [1.0.0-rc.1]\n- 1.0.0 is next\n### [1.0.0]\n" });
  assert.deepEqual(r, missing("1.0.0"));
});
test("a missing CHANGELOG or a missing version fails", async () => {
  assert.deepEqual(await run({ "package.json": pkg("1.0.0") }), ["CHANGELOG.md: the file does not exist"]);
  assert.deepEqual(await run({ "package.json": "{}", "CHANGELOG.md": "" }), ["package.json: the version field is missing"]);
});

test("the Keep a Changelog form passes: a date, no date, the end of the file and CRLF", async () => {
  for (const text of [
    "## [1.0.0] - 2026-10-28\n",
    "## [1.0.0]\n",
    "## [Unreleased]\r\n\r\n## [1.0.0] - 2026-10-28\r\n",
    "## [1.0.0]",
  ]) {
    assert.deepEqual(await run({ "package.json": pkg("1.0.0"), "CHANGELOG.md": text }), [], text);
  }
});

test("other text right after the closing bracket does not count", async () => {
  assert.deepEqual(await run({ "package.json": pkg("1.0.0"), "CHANGELOG.md": "## [1.0.0]x\n" }), missing("1.0.0"));
});

test("a dot in the version matches only a dot", async () => {
  assert.deepEqual(await run({ "package.json": pkg("1.0.0"), "CHANGELOG.md": "## [1x0x0]\n" }), missing("1.0.0"));
});

test("an empty version fails", async () => {
  assert.deepEqual(await run({ "package.json": pkg(""), "CHANGELOG.md": "## []\n" }),
    ["package.json: the version field is missing"]);
});
