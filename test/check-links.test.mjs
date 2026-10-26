import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkLinks } from "../scripts/check-links.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-links.mjs");

async function linksFor(files) {
  const root = await makeTree(files);
  try {
    return await checkLinks(root);
  } finally {
    await removeTree(root);
  }
}

test("every relative link in the repository resolves", async () => {
  const result = await checkLinks(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.ok(result.checked > 0, "the check must find links in the repository");
});

test("no link in the repository points to an old flat skill path", async () => {
  const result = await checkLinks(repoRoot);
  const old = result.links.filter((l) => /(^|\/)skills\/(?!index\.md$)[^/]+\.md$/.test(l.resolved));
  assert.deepEqual(old, []);
});

test("a broken relative link is reported with file, line and target", async () => {
  const result = await linksFor({
    "AGENTS.md": "# A\n\nRead [triage](skills/triage.md) first.\n",
    "skills/triage/SKILL.md": "x\n",
  });
  assert.deepEqual(result.errors, ["AGENTS.md:3: broken link skills/triage.md"]);
});

test("links resolve relative to the file that contains them", async () => {
  const result = await linksFor({
    "skills/a/SKILL.md": "[up](../../coding/index.md) [bad](../coding/index.md)\n",
    "coding/index.md": "x\n",
  });
  assert.deepEqual(result.errors, ["skills/a/SKILL.md:1: broken link ../coding/index.md"]);
  assert.equal(result.checked, 2);
});

test("anchors, titles, images and folder targets are handled", async () => {
  const result = await linksFor({
    "README.md": [
      "[a](docs/x.md#part)",
      '[b](docs/x.md "Title")',
      "![img](docs/pic.png)",
      "[dir](docs/)",
      "[self](#top)",
      "[c](<docs/x.md>)",
      "[gone](docs/missing.md#part)",
    ].join("\n"),
    "docs/x.md": "x\n",
    "docs/pic.png": "png",
  });
  assert.deepEqual(result.errors, ["README.md:7: broken link docs/missing.md#part"]);
});

test("external links and links in code are not checked", async () => {
  const result = await linksFor({
    "README.md": [
      "[web](https://example.com/x.md) [mail](mailto:a@example.com)",
      "`[inline](nope.md)`",
      "```md",
      "[fenced](nope.md)",
      "```",
      "~~~",
      "[tilde](nope.md)",
      "~~~",
    ].join("\n"),
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 0);
});

test("node_modules and .git are not scanned", async () => {
  const result = await linksFor({
    "node_modules/pkg/README.md": "[x](missing.md)\n",
    ".git/notes.md": "[x](missing.md)\n",
    "README.md": "ok\n",
  });
  assert.deepEqual(result.errors, []);
});

test("the CLI exits 1 for a broken link and 0 for a clean tree", async () => {
  const bad = await makeTree({ "README.md": "[x](missing.md)\n" });
  const good = await makeTree({ "README.md": "[x](other.md)\n", "other.md": "x\n" });
  try {
    const failRun = spawnSync(process.execPath, [script, bad], { encoding: "utf8" });
    assert.equal(failRun.status, 1);
    assert.match(failRun.stderr, /README\.md:1: broken link missing\.md/);
    const passRun = spawnSync(process.execPath, [script, good], { encoding: "utf8" });
    assert.equal(passRun.stderr, "");
    assert.equal(passRun.status, 0);
    assert.equal(passRun.stdout, "1 relative link(s) resolve.\n");
  } finally {
    await removeTree(bad);
    await removeTree(good);
  }
});
