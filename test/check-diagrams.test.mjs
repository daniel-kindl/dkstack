import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkDiagramText, checkDiagrams, countNodes } from "../scripts/check-diagrams.mjs";
import { makeTree, removeTree, readFile } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-diagrams.mjs");
const fence = (body) => "```mermaid\n" + body + "\n```\n";
const small = fence("flowchart TD\n  A --> B");
const big = (count) =>
  fence("flowchart TD\n" + Array.from({ length: count - 1 }, (_, i) => `  N${i} --> N${i + 1}`).join("\n"));

test("the repository passes", async () => {
  const result = await checkDiagrams(repoRoot);
  assert.deepEqual(result.errors, []);
});

test("a diagram with a paragraph directly above it passes", () => {
  assert.deepEqual(checkDiagramText("a.md", "Text that explains it.\n\n" + small).errors, []);
});

test("a diagram with no text above it fails", () => {
  const first = checkDiagramText("a.md", small);
  assert.deepEqual(first.errors, ["a.md:1: a mermaid diagram needs a paragraph of text directly above it"]);
  for (const above of ["## Title\n\n", "```text\nx\n```\n\n", "- item\n\n", "| a |\n\n", "> quote\n\n"]) {
    assert.equal(checkDiagramText("a.md", above + small).errors.length, 1, above);
  }
});

test("a diagram that follows its text with no blank line passes", () => {
  assert.deepEqual(checkDiagramText("a.md", "Text.\n" + small).errors, []);
});

test("a mermaid block inside an outer fence is skipped", () => {
  const result = checkDiagramText("a.md", "Text.\n\n````markdown\n" + small + "````\n");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.diagrams, 0);
});

test("a tilde fence and an unclosed fence count as diagrams", () => {
  assert.equal(checkDiagramText("a.md", "Text.\n\n~~~mermaid\nflowchart TD\n  A --> B\n~~~\n").diagrams, 1);
  assert.equal(checkDiagramText("a.md", "Text.\n\n```mermaid\nflowchart TD\n  A --> B\n").diagrams, 1);
});

test("a diagram with more than 12 nodes gives a warning, not an error", () => {
  const result = checkDiagramText("a.md", "Text.\n\n" + big(13));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, ["a.md:3: the diagram has 13 nodes. Split a diagram of more than 12 nodes"]);
});

test("a diagram with 12 nodes gives no warning", () => {
  assert.deepEqual(checkDiagramText("a.md", "Text.\n\n" + big(12)).warnings, []);
});

test("countNodes counts the nodes of each diagram kind", () => {
  assert.equal(countNodes("flowchart LR\n  A[Start] -->|yes| B(Run)\n  B --> C{Done?}\n  C -.-> A\n  D"), 4);
  assert.equal(countNodes("stateDiagram-v2\n  [*] --> a\n  a --> b: go\n  b --> [*]"), 2);
  assert.equal(countNodes("sequenceDiagram\n  participant U as User\n  U->>S: hi\n  S-->>U: ok\n  Note over U,S: x"), 2);
  assert.equal(countNodes("erDiagram\n  ORDER ||--o{ LINE : has\n  LINE }o--|| ITEM : is"), 3);
  assert.equal(countNodes("pie\n  \"a\": 1"), 0);
});

test("a tracked PNG or SVG file in docs fails", async () => {
  const root = await makeTree({ "docs/a.png": "x", "docs/img/b.svg": "x", "docs/c.md": "x\n", "other/d.png": "x" });
  try {
    const result = await checkDiagrams(root);
    assert.deepEqual(result.errors, [
      "docs/a.png: do not commit a binary image of a diagram. Use a mermaid block",
      "docs/img/b.svg: do not commit a binary image of a diagram. Use a mermaid block",
    ]);
  } finally {
    await removeTree(root);
  }
});

test("checkDiagrams reports each file with a path and line", async () => {
  const root = await makeTree({ "docs/a.md": small });
  try {
    const result = await checkDiagrams(root);
    assert.equal(result.diagrams, 1);
    assert.match(result.errors[0], /^docs\/a\.md:1: /);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 1 for an error, 0 for a warning, and 2 for bad usage", async () => {
  const bad = await makeTree({ "a.md": small });
  const warn = await makeTree({ "a.md": "Text.\n\n" + big(13) });
  const good = await makeTree({ "a.md": "Text.\n\n" + small });
  const empty = await makeTree({ "a.md": "Text.\n" });
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  try {
    const failRun = run(bad);
    assert.equal(failRun.status, 1);
    assert.match(failRun.stderr, /a\.md:1: a mermaid diagram needs/);
    const warnRun = run(warn);
    assert.equal(warnRun.status, 0);
    assert.match(warnRun.stderr, /warning: a\.md:3: the diagram has 13 nodes/);
    const passRun = run(good);
    assert.equal(passRun.status, 0);
    assert.match(passRun.stdout, /1 mermaid diagram\(s\)/);
    const emptyRun = run(empty);
    assert.equal(emptyRun.status, 0);
    assert.match(emptyRun.stdout, /No mermaid diagram/);
    assert.equal(run("-x").status, 2);
    assert.equal(run(join(good, "nope")).status, 2);
  } finally {
    for (const root of [bad, warn, good, empty]) await removeTree(root);
  }
});

test("npm run check and the validate workflow run the diagram check", async () => {
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");
  assert.equal(pkg.scripts["check:diagrams"], "node scripts/check-diagrams.mjs");
  assert.match(pkg.scripts.check, /npm run check:diagrams &&/);
  assert.match(workflow, /^\s+run: npm run check:diagrams\s*$/m);
});
