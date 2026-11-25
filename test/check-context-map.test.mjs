import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkContext, checkContextText, checkMapText } from "../scripts/check-context.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-context.mjs");
const run = (args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

const MAP = `# Library

The library lends books.

## Contexts

- **Catalog**: [catalog/CONTEXT.md](catalog/CONTEXT.md)
- **Lending**: [lending/CONTEXT.md](lending/CONTEXT.md)

## Relations

- **Catalog** -> **Lending**: Catalog is upstream. Lending translates a book to a copy.
`;
const CATALOG = "# Catalog\n\nThe books.\n\n## Language\n\n**Book**:\nA title.\n";
const LENDING = "# Lending\n\nThe loans.\n\n## Language\n\n**Copy**:\nA physical book.\n";
const tree = (over = {}) => ({
  "CONTEXT-MAP.md": MAP, "catalog/CONTEXT.md": CATALOG, "lending/CONTEXT.md": LENDING, ...over,
});

test("a good map passes", () => {
  assert.deepEqual(checkMapText(MAP).errors, []);
  assert.deepEqual(checkMapText(MAP).contexts.map((c) => [c.name, c.path]),
    [["Catalog", "catalog/CONTEXT.md"], ["Lending", "lending/CONTEXT.md"]]);
});

test("a map with no H1 title fails", () => {
  assert.deepEqual(checkMapText(MAP.replace("# Library", "Library")).errors, [
    "CONTEXT-MAP.md:1: the file must start with an H1 title",
  ]);
});

test('a map with no "## Contexts" heading fails', () => {
  assert.deepEqual(checkMapText(MAP.replace("## Contexts", "## Parts")).errors, [
    'CONTEXT-MAP.md:1: the file has no "## Contexts" heading',
  ]);
});

test("a map with one context fails and points to the root CONTEXT.md", () => {
  const text = MAP.replace("- **Lending**: [lending/CONTEXT.md](lending/CONTEXT.md)\n", "")
    .replace(/\n## Relations[\s\S]*/, "");
  assert.deepEqual(checkMapText(text).errors, [
    "CONTEXT-MAP.md:5: the map lists 1 context. List two or more, or use CONTEXT.md at the root",
  ]);
});

test("a duplicate context name fails, and case is ignored", () => {
  const text = MAP.replace("**Lending**", "**catalog**");
  assert.ok(checkMapText(text).errors.includes(
    'CONTEXT-MAP.md:8: the context "catalog" is already listed on line 7'));
});

test("a file that two contexts share fails", () => {
  const text = MAP.replace("lending/CONTEXT.md](lending", "catalog/CONTEXT.md](catalog");
  assert.ok(checkMapText(text).errors.includes(
    'CONTEXT-MAP.md:8: the file "catalog/CONTEXT.md" is already listed on line 7'));
});

test("a context file outside its own folder fails", () => {
  for (const path of ["CONTEXT.md", "/abs/CONTEXT.md", "../up/CONTEXT.md", "lending/NOTES.md"]) {
    const text = MAP.replace("lending/CONTEXT.md](lending/CONTEXT.md", `${path}](${path}`);
    assert.deepEqual(checkMapText(text).errors, [
      `CONTEXT-MAP.md:8: the file "${path}" must be a CONTEXT.md in a folder below the root`,
    ], path);
  }
});

test("a relation that names an unknown context fails", () => {
  const text = MAP.replace("**Lending**: Catalog", "**Billing**: Catalog");
  assert.deepEqual(checkMapText(text).errors, [
    'CONTEXT-MAP.md:12: the relation names "Billing", which is not a listed context',
  ]);
});

test("a relation from a context to itself fails", () => {
  const text = MAP.replace("**Catalog** -> **Lending**", "**Catalog** -> **Catalog**");
  assert.deepEqual(checkMapText(text).errors, [
    "CONTEXT-MAP.md:12: the relation joins a context to itself",
  ]);
});

test("a relation with no text fails", () => {
  const text = MAP.replace(": Catalog is upstream. Lending translates a book to a copy.", ":");
  assert.deepEqual(checkMapText(text).errors, [
    "CONTEXT-MAP.md:12: the relation does not say who is upstream and how the data is translated",
  ]);
});

test("a context file is checked with its own path in each message", async () => {
  const root = await makeTree(tree({ "lending/CONTEXT.md": LENDING.replace("# Lending", "Lending") }));
  try {
    assert.deepEqual((await checkContext(root)).errors, [
      "lending/CONTEXT.md:1: the file must start with an H1 title",
    ]);
  } finally {
    await removeTree(root);
  }
});

test("a listed file that does not exist fails", async () => {
  const root = await makeTree({ "CONTEXT-MAP.md": MAP, "catalog/CONTEXT.md": CATALOG });
  try {
    assert.deepEqual((await checkContext(root)).errors, [
      'CONTEXT-MAP.md:8: the file "lending/CONTEXT.md" does not exist',
    ]);
  } finally {
    await removeTree(root);
  }
});

test("a good tree passes, and the CLI says so", async () => {
  const root = await makeTree(tree());
  try {
    const checked = await checkContext(root);
    assert.equal(checked.found, true);
    assert.deepEqual(checked.errors, []);
    const result = run([root]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "CONTEXT-MAP.md and 2 context file(s) have the glossary format.\n");
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 1 for a map finding", async () => {
  const root = await makeTree(tree({ "CONTEXT-MAP.md": MAP.replace("# Library", "Library") }));
  try {
    const result = run([root]);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "CONTEXT-MAP.md:1: the file must start with an H1 title\n");
  } finally {
    await removeTree(root);
  }
});

test("a map and a root CONTEXT.md can exist together", async () => {
  const root = await makeTree(tree({ "CONTEXT.md": CATALOG }));
  try {
    assert.deepEqual((await checkContext(root)).errors, []);
  } finally {
    await removeTree(root);
  }
});

test("checkContextText keeps CONTEXT.md as the default label", () => {
  assert.deepEqual(checkContextText("x", "a/CONTEXT.md")[0].startsWith("a/CONTEXT.md:1:"), true);
});

test("the glossary rules and the domain-glossary skill describe the map", async () => {
  const { readFile } = await import("./helpers.mjs");
  const flat = async (path) => (await readFile(join(repoRoot, path), "utf8")).replace(/\s+/g, " ");
  const rules = await flat("architecture/domain-languages.md");
  for (const phrase of [
    "A project with one [bounded context](domain-modeling.md#bounded-contexts) keeps the root `CONTEXT.md` as it is.",
    "Put one `CONTEXT.md` in the folder of each context.",
    "Put `CONTEXT-MAP.md` at the repository root.",
    "A term is unique inside one file only.",
    "Do not create it for one context.",
  ]) assert.ok(rules.includes(phrase), `missing: ${phrase}`);
  const skill = await flat("skills/domain-glossary/SKILL.md");
  assert.ok(skill.includes("If a `CONTEXT-MAP.md` exists, read it"));
  assert.ok(skill.includes("architecture/domain-languages.md#several-contexts"));
});
