import { test } from "node:test";
import assert from "node:assert/strict";
import { checkChangelog } from "../scripts/check-changelog.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

async function run(files) {
  const root = await makeTree(files);
  try {
    return await checkChangelog(root);
  } finally {
    await removeTree(root);
  }
}
const pkg = (v) => JSON.stringify({ version: v });
const missing = (v) => [
  `CHANGELOG.md: add a "## [${v}]" entry for the package.json version ${v}`,
];
// Run the check for version 1.0.0 and the given CHANGELOG text.
const forText = (text) => run({ "package.json": pkg("1.0.0"), "CHANGELOG.md": text });
// The Unreleased heading and its compare link that each CHANGELOG needs.
const HEAD = "## [Unreleased]\n\n";
const LINK = "\n[Unreleased]: https://example.com/compare/v1.0.0...HEAD\n";
const NO_HEADING = 'CHANGELOG.md: add a "## [Unreleased]" heading line';
const NO_LINK = 'CHANGELOG.md: add an "[Unreleased]:" compare link';

test("a version with an entry passes", async () => {
  assert.deepEqual(await forText(`${HEAD}## [1.0.0] - 2026-10-28\n${LINK}`), []);
});
test("a version with no entry fails with a clear message", async () => {
  const result = await run({ "package.json": pkg("0.1.0"), "CHANGELOG.md": `${HEAD}${LINK}` });
  assert.deepEqual(result, [
    'CHANGELOG.md: add a "## [0.1.0]" entry for the package.json version 0.1.0',
  ]);
});
test("a prefix match or a version in body text does not count", async () => {
  const r = await forText(`${HEAD}## [1.0.01]\n## [1.0.0-rc.1]\n- 1.0.0 is next\n### [1.0.0]\n${LINK}`);
  assert.deepEqual(r, missing("1.0.0"));
});
test("a missing CHANGELOG or a missing version fails", async () => {
  assert.deepEqual(await run({ "package.json": pkg("1.0.0") }), [
    "CHANGELOG.md: the file does not exist",
  ]);
  assert.deepEqual(await run({ "package.json": "{}", "CHANGELOG.md": "" }), [
    "package.json: the version field is missing",
  ]);
});

test("the Keep a Changelog forms pass: a date, no date and the end of the file", async () => {
  for (const text of [
    `${HEAD}## [1.0.0] - 2026-10-28\n${LINK}`,
    `${HEAD}## [1.0.0]\n${LINK}`,
    `${HEAD}${LINK}## [1.0.0]`,
  ]) {
    assert.deepEqual(await forText(text), [], text);
  }
});

test("other text right after the closing bracket does not count", async () => {
  assert.deepEqual(await forText(`${HEAD}## [1.0.0]x\n${LINK}`), missing("1.0.0"));
});

test("a dot in the version matches only a dot", async () => {
  assert.deepEqual(await forText(`${HEAD}## [1x0x0]\n${LINK}`), missing("1.0.0"));
});

test("an empty version fails", async () => {
  assert.deepEqual(await run({ "package.json": pkg(""), "CHANGELOG.md": "## []\n" }),
    ["package.json: the version field is missing"]);
});

// FRG-12 in #154: release.mjs needs both lines. The check finds a missing
// line on the pull request, not in the Release run.
test("a CHANGELOG with no exact Unreleased heading line fails", async () => {
  for (const text of ["## [1.0.0]\n" + LINK, "## [Unreleased] - soon\n\n## [1.0.0]\n" + LINK, "### [Unreleased]\n\n## [1.0.0]\n" + LINK]) {
    assert.deepEqual(await forText(text), [NO_HEADING], text);
  }
});

test("a CHANGELOG with no Unreleased compare link fails", async () => {
  for (const text of [`${HEAD}## [1.0.0]\n`, `${HEAD}## [1.0.0]\n- see [Unreleased]: here\n`]) {
    assert.deepEqual(await forText(text), [NO_LINK], text);
  }
});

test("each missing part gives its own message", async () => {
  assert.deepEqual(await forText("## [0.9.0]\n"), [NO_HEADING, NO_LINK, ...missing("1.0.0")]);
});

// M1 on #189: release.mjs splits the file on "\n" and needs the exact line.
// A CRLF heading line fails here, so that it does not fail the Release run.
test("a CRLF Unreleased heading line fails, as release.mjs needs the exact line", async () => {
  const text = "## [Unreleased]\r\n\r\n## [1.0.0] - 2026-10-28\r\n\r\n[Unreleased]: https://example.com\r\n";
  assert.deepEqual(await forText(text), [NO_HEADING]);
  const { releaseChangelog } = await import("../scripts/release.mjs");
  assert.throws(() => releaseChangelog(text, { version: "1.0.1", previous: "1.0.0", date: "2026-11-21", commits: [] }), /no "## \[Unreleased\]" section/);
});
