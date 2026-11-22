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

// M1 on #189 and FRG-3 in #154: release.mjs reads a CRLF file as LF, so the
// check accepts a CRLF Unreleased line too. Both sides agree.
test("a CRLF Unreleased heading line passes, and release.mjs accepts the same text", async () => {
  const text = "## [Unreleased]\r\n\r\n## [1.0.0] - 2026-10-28\r\n\r\n[Unreleased]: https://example.com\r\n";
  assert.deepEqual(await forText(text), []);
  const { releaseChangelog } = await import("../scripts/release.mjs");
  assert.doesNotThrow(() => releaseChangelog(text, { version: "1.0.1", previous: "1.0.0", date: "2026-11-21", commits: [] }));
});

// C12 in #200 and #310: a change that adds a page or a skill also changes the
// Unreleased notes. These tests use a temporary git repository.
const { execFileSync, spawnSync } = await import("node:child_process");
const { mkdir, writeFile } = await import("node:fs/promises");
const { dirname, join } = await import("node:path");
const { checkChangelogDiff } = await import("../scripts/check-changelog.mjs");
const SCRIPT = new URL("../scripts/check-changelog.mjs", import.meta.url).pathname;

const git = (root, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const put = async (root, files) => {
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
};
const BASE = { "CHANGELOG.md": `${HEAD}## [1.0.0]\n${LINK}`, "coding/index.md": "# Coding\n", "coding/old.md": "old\n", "docs/adr/0001-x.md": "x\n", "skills/index.md": "# Skills\n", "skills/old/SKILL.md": "old\n" };
const ENTRY = { "CHANGELOG.md": `## [Unreleased]\n\n### Added\n\n- A new page (#1).\n\n## [1.0.0]\n${LINK}` };

// Make a repository with a base commit, apply `changes`, and run the diff mode.
async function diff(changes) {
  const root = await makeTree({});
  try {
    git(root, "init", "-q", "-b", "main");
    await put(root, BASE);
    git(root, "add", ".");
    git(root, "commit", "-q", "-m", "base");
    git(root, "switch", "-q", "-c", "topic");
    await put(root, changes);
    git(root, "add", ".");
    git(root, "commit", "-q", "-m", "change");
    const out = spawnSync("node", [SCRIPT, "--diff", "--base", "main", root], { encoding: "utf8" });
    return { code: out.status, out: out.stdout, err: out.stderr };
  } finally {
    await removeTree(root);
  }
}

test("diff mode: an added page with no Unreleased change fails and names the page", async () => {
  const r = await diff({ "coding/new.md": "new\n" });
  assert.equal(r.code, 1);
  assert.match(r.err, /coding\/new\.md/);
  assert.match(r.err, /\[Unreleased\]/);
});

test("diff mode: an added page with an Unreleased change passes", async () => {
  const r = await diff({ "coding/new.md": "new\n", ...ENTRY });
  assert.equal(r.code, 0, r.err);
});

test("diff mode: an added skill with no Unreleased change fails, and with one passes", async () => {
  const r = await diff({ "skills/new/SKILL.md": "new\n" });
  assert.equal(r.code, 1);
  assert.match(r.err, /skills\/new\/SKILL\.md/);
  assert.equal((await diff({ "skills/new/SKILL.md": "new\n", ...ENTRY })).code, 0);
});

test("diff mode: a changed page, a docs page, a test file and a CHANGELOG-only change pass", async () => {
  for (const changes of [{ "coding/old.md": "changed\n" }, { "docs/adr/0002-y.md": "y\n" }, { "test/new.test.mjs": "z\n" }, { "skills/old/extra.md": "e\n" }, { "other/new.md": "n\n" }, ENTRY]) {
    const r = await diff(changes);
    assert.equal(r.code, 0, `${Object.keys(changes)}: ${r.err}`);
  }
});

test("diff mode: the release change passes, because it adds no page", async () => {
  const r = await diff({ "CHANGELOG.md": `${HEAD}## [1.0.1] - 2026-11-22\n\n- moved\n\n## [1.0.0]\n${LINK}` });
  assert.equal(r.code, 0, r.err);
});

test("diff mode: a change in another part of the CHANGELOG does not count", async () => {
  const r = await diff({ "coding/new.md": "new\n", "CHANGELOG.md": `${HEAD}## [1.0.0]\n\n- late note\n${LINK}` });
  assert.equal(r.code, 1);
});

test("diff mode: an untracked page counts, and a bad base is a usage error", async () => {
  const root = await makeTree({});
  try {
    git(root, "init", "-q", "-b", "main");
    await put(root, BASE);
    git(root, "add", ".");
    git(root, "commit", "-q", "-m", "base");
    await put(root, { "coding/new.md": "new\n" });
    assert.equal(spawnSync("node", [SCRIPT, "--diff", "--base", "main", root], { encoding: "utf8" }).status, 1);
    assert.equal(spawnSync("node", [SCRIPT, "--diff", "--base", "nope", root], { encoding: "utf8" }).status, 2);
  } finally {
    await removeTree(root);
  }
});

test("diff mode: a missing base CHANGELOG counts as empty, and a bad option is a usage error", async () => {
  const root = await makeTree({ "coding/index.md": "# C\n", "coding/new.md": "n\n", "CHANGELOG.md": "## [Unreleased]\n- a\n" });
  try {
    assert.deepEqual(await checkChangelogDiff(root, ["coding/new.md"], null), []);
    assert.equal((await checkChangelogDiff(root, ["coding/new.md"], "## [Unreleased]\n- a\n")).length, 1);
    assert.deepEqual(await checkChangelogDiff(root, [], "x"), []);
    assert.equal(spawnSync("node", [SCRIPT, "--bogus"], { encoding: "utf8" }).status, 2);
  } finally {
    await removeTree(root);
  }
});

// Review of #324. A rename counts as an added page, with any diff.renames value.
test("diff mode: a renamed page fails, with diff.renames true or false", async () => {
  for (const setting of ["true", "false"]) {
    const root = await makeTree({});
    try {
      git(root, "init", "-q", "-b", "main");
      await put(root, BASE);
      git(root, "add", ".");
      git(root, "commit", "-q", "-m", "base");
      git(root, "switch", "-q", "-c", "topic");
      git(root, "mv", "coding/old.md", "coding/renamed.md");
      git(root, "commit", "-q", "-m", "rename");
      const env = { ...process.env, GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "diff.renames", GIT_CONFIG_VALUE_0: setting };
      const r = spawnSync("node", [SCRIPT, "--diff", "--base", "main", root], { encoding: "utf8", env });
      assert.equal(r.status, 1, `diff.renames=${setting}: ${r.stderr}`);
      assert.match(r.stderr, /coding\/renamed\.md/);
    } finally {
      await removeTree(root);
    }
  }
});

test("diff mode: a dot folder with an index.md is not a section", async () => {
  const r = await diff({ ".hidden/index.md": "# H\n", ".hidden/new.md": "n\n" });
  assert.equal(r.code, 0, r.err);
});

test("diff mode: a page with a non-ASCII name fails and is named in clear text", async () => {
  const r = await diff({ "coding/příběh.md": "n\n" });
  assert.equal(r.code, 1);
  assert.match(r.err, /coding\/příběh\.md/);
});

test("the default mode fails on a bad CHANGELOG through the command line", async () => {
  const root = await makeTree({ "package.json": pkg("1.0.0"), "CHANGELOG.md": "## [0.9.0]\n" });
  const ok = await makeTree({ "package.json": pkg("1.0.0"), "CHANGELOG.md": `${HEAD}## [1.0.0]\n${LINK}` });
  try {
    const r = spawnSync("node", [SCRIPT, root], { encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Unreleased/);
    assert.equal(spawnSync("node", [SCRIPT, ok], { encoding: "utf8" }).status, 0);
  } finally {
    await removeTree(root);
    await removeTree(ok);
  }
});
