import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkWriting, writingWarnings } from "../scripts/check-writing.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

// SCR-M8 in #154, after the D3 sub-choices: warn on a step (numbered or a
// checklist item) over 20 words, a
// sentence over 25 words and a semicolon. The check fails when it finds a problem (#299).

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-writing.mjs");
const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

test("a short sentence gives no warning, and a long one gives one", () => {
  assert.deepEqual(writingWarnings("a.md", `# T\n\n${words(25)}.\n`), []);
  assert.deepEqual(writingWarnings("a.md", `# T\n\n${words(26)}.\n`), ["a.md:3: a sentence has 26 words, more than 25"]);
});

test("a numbered step has a limit of 20 words", () => {
  assert.deepEqual(writingWarnings("a.md", `1. ${words(20)}.\n2. ${words(21)}.\n`), ["a.md:2: a step has 21 words, more than 20"]);
});

test("a checklist item is a step too", () => {
  assert.deepEqual(writingWarnings("a.md", `- [ ] ${words(21)}.\n- [x] ${words(20)}.\n`), ["a.md:1: a step has 21 words, more than 20"]);
});

test("a sentence over two lines counts as one, and is reported at its first line", () => {
  assert.deepEqual(writingWarnings("a.md", `${words(15)}\n${words(15)}.\n`), ["a.md:1: a sentence has 30 words, more than 25"]);
});

test("a semicolon gives a warning outside code and quotes", () => {
  assert.deepEqual(writingWarnings("a.md", "Do this; do that.\n"), ["a.md:1: a semicolon"]);
  assert.deepEqual(writingWarnings("a.md", 'Use `a; b` and "x; y".\n'), []);
});

test("code blocks, block quotes, tables and headings are not checked", () => {
  const text = `# ${words(30)}\n\n\`\`\`\n${words(40)}; x\n\`\`\`\n\n> ${words(30)}; q\n\n| ${words(30)} |\n`;
  assert.deepEqual(writingWarnings("a.md", text), []);
});

test("a link counts as the words of its text, not of its URL", () => {
  assert.deepEqual(writingWarnings("a.md", `${words(24)} [one](https://example.com/a/b/c).\n`), []);
});

test("checkWriting skips CHANGELOG.md, and the CLI exits 1 for a problem", async () => {
  const root = await makeTree({ "CHANGELOG.md": `${words(40)}; x.\n`, "docs/a.md": `${words(30)}.\n` });
  try {
    const { checked, warnings } = await checkWriting(root);
    assert.equal(checked, 1);
    assert.deepEqual(warnings, ["docs/a.md:1: a sentence has 30 words, more than 25"]);
    const r = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /docs\/a\.md:1: a sentence has 30 words/);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 0 for a clean file", async () => {
  const root = await makeTree({ "docs/a.md": `${words(10)}.\n` });
  try {
    const r = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    assert.equal(r.status, 0);
    assert.equal(r.stderr, "");
    assert.match(r.stdout, /^1 Markdown file\(s\) checked\. 0 writing problem\(s\)\.\n$/);
  } finally {
    await removeTree(root);
  }
});
