import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { markdownFiles } from "../scripts/markdown-files.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

// "b.md" sorts before "b/a.md", but a walk of folder "b" lists "b/a.md" first.
test("Markdown files are sorted by full path, and .git, node_modules and other files are skipped", async () => {
  const root = await makeTree({
    "z.md": "",
    "b.md": "",
    "b/y.md": "",
    "a.md": "",
    "b/a.md": "",
    "c.txt": "",
    ".git/x.md": "",
    "node_modules/p/x.md": "",
  });
  try {
    const found = (await markdownFiles(root)).map((p) => p.slice(root.length + 1));
    assert.deepEqual(found, ["a.md", "b.md", join("b", "a.md"), join("b", "y.md"), "z.md"]);
  } finally {
    await removeTree(root);
  }
});

// In a Git work tree, the list equals the files that CI sees in a clean
// checkout, plus the untracked files that .gitignore does not ignore (#333).
test("in a Git work tree, ignored Markdown files are skipped and untracked files are listed", async () => {
  const root = await makeTree({
    ".gitignore": "ignored/\nlocal.md\n",
    "tracked.md": "",
    "gone.md": "",
    "new.md": "",
    "local.md": "",
    "ignored/spec.md": "",
    "docs/a.md": "",
  });
  const git = (...args) => execFileSync("git", args, { cwd: root, stdio: "ignore" });
  try {
    git("init", "--quiet");
    git("add", "tracked.md", "gone.md", "docs/a.md");
    await rm(join(root, "gone.md"));
    const found = (await markdownFiles(root)).map((p) => p.slice(root.length + 1));
    assert.deepEqual(found, [join("docs", "a.md"), "new.md", "tracked.md"]);
  } finally {
    await removeTree(root);
  }
});
