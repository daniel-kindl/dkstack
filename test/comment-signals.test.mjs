import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, sectionText } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("writing/comments.md treats a workaround or constraint comment as a signal", async () => {
  const section = sectionText(await text("writing/comments.md"), "## A comment as a signal");
  for (const part of [
    "workaround",
    "Fix the cause",
    "link the issue",
    "constraint",
    "failing test",
    "Then delete the comment",
    "### Comments that stay",
    "license header",
    "external specification",
    "public API",
    "cannot change",
    "tdd-loop",
    "coding/quality-gates.md",
  ]) {
    assert.ok(section.includes(part), `missing ${part}`);
  }
});

test("writing/comments.md has a good and a bad example for a comment as a signal", async () => {
  const section = sectionText(await text("writing/comments.md"), "## A comment as a signal");
  assert.ok(section.includes("### Good example"), "missing good example");
  assert.ok(section.includes("### Bad example"), "missing bad example");
});

test("review-standards lists a workaround or constraint comment as a smell", async () => {
  const skill = await text("skills/review-standards/SKILL.md");
  const row = skill.split("\n").find((line) => line.startsWith("| Signal comment"));
  assert.ok(row, "missing smell row");
  assert.ok(row.includes("writing/comments.md#a-comment-as-a-signal"), "row must link the rule");
});
