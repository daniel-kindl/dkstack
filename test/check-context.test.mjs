import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkContext, checkContextText } from "../scripts/check-context.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-context.mjs");

const GOOD = `# Folium

Folium is a personal library of books that stays on one device.

## Language

**Book**:
A saved book with its own local identifier.
_Avoid_: Entry, record, item

### Reading

**Reading status**:
The place of a saved book in the person's reading.
_Avoid_: Progress, state
`;

const run = (args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

test("this repository passes, with or without CONTEXT.md", async () => {
  assert.deepEqual((await checkContext(repoRoot)).errors, []);
});

test("the folium format passes", () => {
  assert.deepEqual(checkContextText(GOOD), []);
});

test("a file with no H1 title fails", () => {
  assert.deepEqual(checkContextText(GOOD.replace("# Folium", "Folium")), [
    "CONTEXT.md:1: the file must start with an H1 title",
  ]);
});

test('a file with no "## Language" heading fails', () => {
  assert.deepEqual(checkContextText(GOOD.replace("## Language", "## Terms")), [
    'CONTEXT.md:1: the file has no "## Language" heading',
  ]);
});

test("a Language section with no term fails", () => {
  assert.deepEqual(checkContextText("# Folium\n\nA library.\n\n## Language\n\nNothing yet.\n"), [
    'CONTEXT.md:5: the "## Language" section has no **Term**: entry',
  ]);
});

test("a term with no definition fails", () => {
  const text = GOOD.replace("A saved book with its own local identifier.\n", "");
  assert.deepEqual(checkContextText(text), ['CONTEXT.md:7: the term "Book" has no definition']);
});

test("a duplicate term fails, and case is ignored", () => {
  const text = `${GOOD}\n**book**:\nA second meaning.\n`;
  assert.deepEqual(checkContextText(text), ['CONTEXT.md:17: the term "book" is already defined on line 7']);
});

test("a term on an _Avoid_ line fails", () => {
  const text = GOOD.replace("_Avoid_: Progress, state", "_Avoid_: Progress, book");
  assert.deepEqual(checkContextText(text), ['CONTEXT.md:15: "book" is a term and is also on an _Avoid_: line']);
});

test("a missing CONTEXT.md is a pass", async () => {
  const root = await makeTree({ "README.md": "# x\n" });
  try {
    assert.deepEqual(await checkContext(root), { found: false, errors: [] });
    const result = run([root]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "No CONTEXT.md. Nothing to check.\n");
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 0 for a good file, 1 for findings and 2 for a usage error", async () => {
  const good = await makeTree({ "CONTEXT.md": GOOD });
  const bad = await makeTree({ "CONTEXT.md": GOOD.replace("# Folium", "Folium") });
  try {
    const pass = run([good]);
    assert.equal(pass.status, 0);
    assert.equal(pass.stdout, "CONTEXT.md has the glossary format.\n");
    const fail = run([bad]);
    assert.equal(fail.status, 1);
    assert.equal(fail.stderr, "CONTEXT.md:1: the file must start with an H1 title\n");
    const usage = run(["--bad-flag"]);
    assert.equal(usage.status, 2);
    assert.match(usage.stderr, /^usage: /);
  } finally {
    await removeTree(good);
    await removeTree(bad);
  }
});

test("the CLI exits 2 when CONTEXT.md cannot be read", async () => {
  const root = await makeTree({ "CONTEXT.md/inner.md": "a folder, not a file\n" });
  try {
    const result = run([root]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /^cannot read CONTEXT\.md: /);
  } finally {
    await removeTree(root);
  }
});
