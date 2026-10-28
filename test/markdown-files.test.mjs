import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { markdownFiles } from "../scripts/markdown-files.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

test("Markdown files are sorted, and .git, node_modules and other files are skipped", async () => {
  const root = await makeTree({
    "z.md": "",
    "b/y.md": "",
    "a.md": "",
    "b/a.md": "",
    "c.txt": "",
    ".git/x.md": "",
    "node_modules/p/x.md": "",
  });
  try {
    const found = (await markdownFiles(root)).map((p) => p.slice(root.length + 1));
    assert.deepEqual(found, ["a.md", join("b", "a.md"), join("b", "y.md"), "z.md"]);
  } finally {
    await removeTree(root);
  }
});
