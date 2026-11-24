import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
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

// M1 on #336: Git lists no file in an ignored folder. A check of that folder
// must not check zero files and pass, so the list comes from the walk.
test("a folder that .gitignore ignores is read with the folder walk", async () => {
  const root = await makeTree({ ".gitignore": "build/\n", "build/a.md": "", "build/sub/b.md": "" });
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });
    const dir = join(root, "build");
    const found = (await markdownFiles(dir)).map((p) => p.slice(dir.length + 1));
    assert.deepEqual(found, ["a.md", join("sub", "b.md")]);
  } finally {
    await removeTree(root);
  }
});

// M2 on #336: Git lists a file with a merge conflict once for each stage.
test("a Markdown file with a merge conflict is listed once", async () => {
  const root = await makeTree({ "a.md": "base\n" });
  const git = (...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args],
    { cwd: root, stdio: "ignore" });
  try {
    git("init", "--quiet", "--initial-branch=main");
    git("add", "a.md");
    git("commit", "--quiet", "-m", "base");
    git("switch", "--quiet", "-c", "other");
    await writeFile(join(root, "a.md"), "other\n");
    git("commit", "--quiet", "-am", "other");
    git("switch", "--quiet", "main");
    await writeFile(join(root, "a.md"), "main\n");
    git("commit", "--quiet", "-am", "main");
    const merge = git("merge", "--quiet", "other");
    assert.notEqual(merge.status, 0, "the merge must stop with a conflict");
    const found = (await markdownFiles(root)).map((p) => p.slice(root.length + 1));
    assert.deepEqual(found, ["a.md"]);
  } finally {
    await removeTree(root);
  }
});
