import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeTree, readFile, removeTree } from "./helpers.mjs";

const here = fileURLToPath(import.meta.url);
const repo = join(dirname(here), "..");
const SECTIONS = [
  "architecture",
  "coding",
  "tdd",
  "learning",
  "ui",
  "version-control",
  "versioning",
  "writing",
  "workflow",
];

// Return each page path (section/name.md) of the section folders.
async function listPages(root, sections) {
  const pages = [];
  for (const section of sections) {
    for (const name of (await readdir(join(root, section))).sort()) {
      if (name.endsWith(".md")) pages.push(`${section}/${name}`);
    }
  }
  return pages;
}

// Return the pages whose path no test file names. This file is skipped, so
// it cannot name a page for itself.
async function pagesWithoutTest(root, sections, testDir, self) {
  let all = "";
  for (const name of await readdir(testDir)) {
    if (name.endsWith(".mjs") && name !== self) {
      all += `${await readFile(join(testDir, name), "utf8")}\n`;
    }
  }
  return (await listPages(root, sections)).filter((page) => !all.includes(page));
}

test("a page that no test file names is reported", async () => {
  const root = await makeTree({
    "coding/a.md": "",
    "coding/b.md": "",
    "coding/note.txt": "",
  });
  const tests = await makeTree({
    "x.test.mjs": 'read("coding/a.md")',
    "self.test.mjs": 'read("coding/b.md")',
  });
  try {
    assert.deepEqual(await listPages(root, ["coding"]), ["coding/a.md", "coding/b.md"]);
    assert.deepEqual(await pagesWithoutTest(root, ["coding"], tests, "self.test.mjs"), ["coding/b.md"]);
    assert.deepEqual(await pagesWithoutTest(root, ["coding"], tests, "none.mjs"), []);
  } finally {
    await removeTree(root);
    await removeTree(tests);
  }
});

test("each page in a section folder has a test that names its path", async () => {
  const missing = await pagesWithoutTest(repo, SECTIONS, join(repo, "test"), basename(here));
  assert.deepEqual(missing, []);
});
