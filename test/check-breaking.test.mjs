import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { breakingItems, missingPieces } from "../scripts/check-breaking.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

// C2 in #200 and #300: a removed page, skill or linked anchor is MAJOR
// (versioning/index.md, "Breaking changes in dkstack").

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-breaking.mjs");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

const CHANGELOG = (unreleased) => `# Changelog\n\n## [Unreleased]\n\n${unreleased}\n## [1.0.0] - 2026-01-01\n\n- Consumer action: old.\n`;

const BASE = {
  "AGENTS.md": "# AGENTS\n\nSee [the rule](guide/rules.md#keep-it) and [other](guide/other.md).\n",
  "guide/rules.md": "# Rules\n\n## Keep it\n\nText.\n\n## Old name\n\nText.\n",
  "guide/other.md": "# Other\n",
  "skills/tdd-loop/SKILL.md": `---\nname: tdd-loop\n---\n\n# TDD\n\nRead ${RAW}guide/rules.md#old-name and [here](#steps).\n\n## Steps\n`,
  "skills/tdd-loop/notes.md": "# Notes\n",
  "docs/maps/flow.md": "# Flow\n",
  "test/fixtures/page.md": "# Fixture\n",
  "CHANGELOG.md": CHANGELOG(""),
};

const git = (root, ...args) => {
  const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args],
    { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
};

// Commit BASE on main, then apply `change` on the branch "work" and commit it.
// A value of null removes the file.
async function repoWith(change) {
  const root = await makeTree(BASE);
  git(root, "init", "-q", "-b", "main");
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "base");
  git(root, "switch", "-q", "-c", "work");
  for (const [path, content] of Object.entries(change)) {
    if (content === null) await rm(join(root, path));
    else {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
  }
  git(root, "add", "-A");
  git(root, "commit", "-q", "--allow-empty", "-m", "change");
  return root;
}

const run = (root, title, args = ["--base", "main", root]) => {
  const env = { ...process.env };
  delete env.TITLE;
  if (title !== undefined) env.TITLE = title;
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env });
};

async function itemsFor(change) {
  const root = await repoWith(change);
  try {
    const r = run(root, "feat!: x");
    return r.stdout + r.stderr;
  } finally {
    await removeTree(root);
  }
}

// A tree as the pure functions read it.
const tree = (files) => ({ paths: Object.keys(files), read: (path) => files[path] });
const without = (files, ...paths) => Object.fromEntries(Object.entries(files).filter(([p]) => !paths.includes(p)));

test("no change gives no breaking item", () => {
  assert.deepEqual(breakingItems(tree(BASE), tree(BASE)), []);
});

test("a removed page is breaking, but not a map or a test fixture", () => {
  const head = without(BASE, "guide/other.md", "docs/maps/flow.md", "test/fixtures/page.md");
  assert.deepEqual(breakingItems(tree(BASE), tree(head)), ["removed page guide/other.md"]);
});

test("a removed skill is one item, and a removed page in a kept skill is a page", () => {
  const gone = without(BASE, "skills/tdd-loop/SKILL.md", "skills/tdd-loop/notes.md");
  assert.deepEqual(breakingItems(tree(BASE), tree(gone)), ["removed skill skills/tdd-loop"]);
  const notes = without(BASE, "skills/tdd-loop/notes.md");
  assert.deepEqual(breakingItems(tree(BASE), tree(notes)), ["removed page skills/tdd-loop/notes.md"]);
});

test("a removed anchor that a skill or AGENTS.md links is breaking", () => {
  const head = { ...BASE, "guide/rules.md": "# Rules\n\n## Kept\n\nText.\n\n## New name\n" };
  assert.deepEqual(breakingItems(tree(BASE), tree(head)), [
    "removed anchor guide/rules.md#keep-it (linked from AGENTS.md:3)",
    "removed anchor guide/rules.md#old-name (linked from skills/tdd-loop/SKILL.md:7)",
  ]);
  const skill = { ...BASE, "skills/tdd-loop/SKILL.md": BASE["skills/tdd-loop/SKILL.md"].replace("## Steps", "## Step list") };
  assert.deepEqual(breakingItems(tree(BASE), tree(skill)), [
    "removed anchor skills/tdd-loop/SKILL.md#steps (linked from skills/tdd-loop/SKILL.md:7)",
  ]);
});

test("an anchor that no skill or AGENTS.md links is not breaking", () => {
  const base = { ...BASE, "guide/other.md": "# Other\n\n## Free\n", "README.md": "[x](guide/other.md#free)\n" };
  const head = { ...base, "guide/other.md": "# Other\n" };
  assert.deepEqual(breakingItems(tree(base), tree(head)), []);
});

test("a renamed anchor that keeps the old anchor as a redirect id is not breaking", () => {
  const head = {
    ...BASE,
    "guide/rules.md": '# Rules\n\n## Keep it\n\n<a id="old-name"></a>\n\n## New name\n',
  };
  assert.deepEqual(breakingItems(tree(BASE), tree(head)), []);
  const named = { ...head, "guide/rules.md": "# Rules\n\n## Keep it\n\n<a name=\"old-name\"></a>\n" };
  assert.deepEqual(breakingItems(tree(BASE), tree(named)), []);
});

test("a blob URL to a removed anchor is breaking, and a bad URI is skipped", () => {
  const base = { ...BASE, "AGENTS.md": "See https://github.com/daniel-kindl/dkstack/blob/main/guide/rules.md#keep-it and [x](%E0%A4%A.md#a).\n" };
  const head = { ...base, "guide/rules.md": "# Rules\n\n## Old name\n" };
  assert.deepEqual(breakingItems(tree(base), tree(head)), ["removed anchor guide/rules.md#keep-it (linked from AGENTS.md:1)"]);
});

test("a link that was already broken at the base is not an item", () => {
  const base = { ...BASE, "AGENTS.md": "[a](guide/rules.md#none) [b](missing.md#x) [c](https://example.com/a.md#x)\n" };
  assert.deepEqual(breakingItems(tree(base), tree(base)), []);
});

// L1 on #326: a line from an earlier pull request does not cover a new breaking change.
test("a Consumer action line that [Unreleased] had at the merge base does not count", () => {
  const earlier = CHANGELOG("- Consumer action: earlier change.\n");
  const missing = ['the ## [Unreleased] section of CHANGELOG.md has no new line that starts with "Consumer action:"'];
  assert.deepEqual(missingPieces("docs!: remove kiss", earlier, earlier), missing);
  assert.deepEqual(missingPieces("docs!: remove kiss",
    CHANGELOG("- Consumer action: earlier change.\n- Consumer action: stop reading kiss.md.\n"), earlier), []);
});

test("the CLI compares with the pull request target from CI", async () => {
  const root = await repoWith({ "guide/other.md": null });
  try {
    const env = { ...process.env, TITLE: "docs: remove other", PR_BASE: "HEAD" };
    const pr = spawnSync(process.execPath, [script, root], { encoding: "utf8", env });
    assert.equal(pr.status, 0, pr.stderr);
    assert.equal(pr.stdout, "No breaking change.\n");
    const explicit = spawnSync(process.execPath, [script, "--base", "main", root], { encoding: "utf8", env });
    assert.equal(explicit.status, 1);
    assert.match(explicit.stderr, /removed page guide\/other\.md/);
  } finally {
    await removeTree(root);
  }
});

test("the CLI fails when only an earlier Consumer action line is in [Unreleased]", async () => {
  const root = await makeTree({ ...BASE, "CHANGELOG.md": CHANGELOG("- Consumer action: earlier change.\n") });
  try {
    git(root, "init", "-q", "-b", "main");
    git(root, "add", ".");
    git(root, "commit", "-q", "-m", "base");
    git(root, "switch", "-q", "-c", "work");
    await rm(join(root, "guide/other.md"));
    git(root, "commit", "-q", "-am", "remove other");
    const r = run(root, "docs!: remove other");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /^missing: the ## \[Unreleased\] section of CHANGELOG\.md has no new line/m);
  } finally {
    await removeTree(root);
  }
});

// L2 on #326: a map in docs/maps/ is planning state that chart-route owns. No consumer links it.
test("a removed map in docs/maps is not breaking", () => {
  assert.deepEqual(breakingItems(tree(BASE), tree(without(BASE, "docs/maps/flow.md"))), []);
});

// L3 on #326: each guard of the anchor search has a case that needs it.
test("two links to one removed anchor give one item", () => {
  const base = { ...BASE, "AGENTS.md": "[a](guide/rules.md#keep-it)\n\n[b](guide/rules.md#keep-it)\n" };
  const head = { ...base, "guide/rules.md": "# Rules\n\n## Old name\n" };
  assert.deepEqual(breakingItems(tree(base), tree(head)), ["removed anchor guide/rules.md#keep-it (linked from AGENTS.md:1)"]);
});

test("a link to a page that only HEAD has, or outside the repository, is not an item", () => {
  const base = { ...BASE, "AGENTS.md": "[a](guide/new.md#x) [b](../outside.md#x) [c](https://example.com/guide/rules.md#keep-it)\n" };
  const head = { ...base, "guide/new.md": "# New\n", "guide/rules.md": "# Rules\n\n## Old name\n" };
  const strict = (files) => ({ paths: Object.keys(files), read: (path) => {
    if (!(path in files)) throw new Error(`no file ${path}`);
    return files[path];
  } });
  assert.deepEqual(breakingItems(strict(base), strict(head)), []);
});

test("the title needs ! and [Unreleased] needs a Consumer action line when there is an item", () => {
  const good = CHANGELOG("### Removed\n\n- Consumer action: change `x` to `y`.\n");
  assert.deepEqual(missingPieces("feat(skills)!: rename x", good), []);
  assert.deepEqual(missingPieces("feat!: rename x", CHANGELOG("Consumer action: do it.\n")), []);
  assert.deepEqual(missingPieces("feat(skills): rename x", CHANGELOG("- Old line.\n")), [
    'the pull request title has no "!" before the colon: feat(skills): rename x',
    'the ## [Unreleased] section of CHANGELOG.md has no new line that starts with "Consumer action:"',
  ]);
  assert.deepEqual(missingPieces("feat: x!: y", good), ['the pull request title has no "!" before the colon: feat: x!: y']);
  assert.deepEqual(missingPieces("feat!: x", null), [
    'the ## [Unreleased] section of CHANGELOG.md has no new line that starts with "Consumer action:"',
  ]);
});

test("the CLI passes with no breaking change and no !", async () => {
  const root = await repoWith({ "guide/new.md": "# New\n" });
  try {
    const r = run(root, "feat: add a page");
    assert.equal(r.stderr, "");
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "No breaking change.\n");
  } finally {
    await removeTree(root);
  }
});

test("the CLI fails for a removed page without ! and Consumer action, and names each piece", async () => {
  const root = await repoWith({ "guide/other.md": null });
  try {
    const r = run(root, "docs: remove other");
    assert.equal(r.status, 1);
    assert.equal(r.stderr, [
      "breaking: removed page guide/other.md",
      'missing: the pull request title has no "!" before the colon: docs: remove other',
      'missing: the ## [Unreleased] section of CHANGELOG.md has no new line that starts with "Consumer action:"',
      "",
    ].join("\n"));
  } finally {
    await removeTree(root);
  }
});

test("the CLI passes for a breaking change with ! and a Consumer action line", async () => {
  const root = await repoWith({ "guide/other.md": null, "CHANGELOG.md": CHANGELOG("- Consumer action: stop reading other.md.\n") });
  try {
    const r = run(root, "docs!: remove other");
    assert.equal(r.stderr, "");
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "breaking: removed page guide/other.md\nThe title has \"!\" and CHANGELOG.md has a Consumer action line.\n");
  } finally {
    await removeTree(root);
  }
});

test("the CLI counts a renamed file as removed", async () => {
  const out = await itemsFor({ "guide/other.md": null, "guide/renamed.md": "# Other\n" });
  assert.match(out, /^breaking: removed page guide\/other\.md$/m);
});

test("the CLI finds a removed skill and a removed linked anchor", async () => {
  const out = await itemsFor({
    "skills/tdd-loop/SKILL.md": null,
    "skills/tdd-loop/notes.md": null,
    "guide/rules.md": "# Rules\n\n## Keep it\n",
  });
  assert.match(out, /^breaking: removed skill skills\/tdd-loop$/m);
  assert.match(out, /^breaking: removed anchor guide\/rules\.md#old-name \(linked from skills\/tdd-loop\/SKILL\.md:7\)$/m);
});

test("the CLI exits 2 with no title, a bad argument or a bad base ref", async () => {
  const root = await repoWith({});
  try {
    const none = run(root, undefined);
    assert.equal(none.status, 2);
    assert.match(none.stderr, /^usage: /);
    assert.equal(run(root, "feat: x", ["--bad"]).status, 2);
    const bad = run(root, "feat: x", ["--base", "no-such-ref", root]);
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /^cannot read the git trees: /);
  } finally {
    await removeTree(root);
  }
});

test("validate runs check-breaking on pull_request with the title through env", async () => {
  const { readFile } = await import("./helpers.mjs");
  const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");
  const step = workflow.split(/\n(?= {6}- name: )/).find((s) => /node scripts\/check-breaking\.mjs/.test(s));
  assert.ok(step, "a check-breaking step");
  assert.ok(step.includes("if: ${{ !cancelled() && steps.node.outcome == 'success' && github.event_name == 'pull_request' }}"));
  assert.match(step, /TITLE: \$\{\{ github\.event\.pull_request\.title \}\}/);
  assert.match(step, /^\s+run: node scripts\/check-breaking\.mjs$/m);
});

test("an anchor in a file that is not Markdown is not an item", () => {
  const base = { ...BASE, "AGENTS.md": "[a](notes.txt#top)\n", "notes.txt": "# Top\n" };
  const head = { ...base, "notes.txt": "# Other\n" };
  assert.deepEqual(breakingItems(tree(base), tree(head)), []);
});
