import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("the Blocking row matches the release rule", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const row = text.split("\n").find((line) => line.startsWith("| Blocking |"));
  assert.ok(row, "the severity table must have a Blocking row");
  assert.match(
    row,
    /an agent can start a production deploy or a project's release workflow, or release without the owner's OK/,
  );
});

test("the owner authorizes merging the reviewed head", async () => {
  const text = await readFile(join(repoRoot, "workflow/review-and-merge.md"), "utf8");
  const flat = text.replace(/\s+/g, " ");
  assert.match(
    flat,
    /Only the human owner may authorize a merge of the exact PR after independent review, green required checks and no rule bypass/,
  );
});

test("the workflow flow uses the same merge gates", async () => {
  const text = await readFile(join(repoRoot, "workflow/index.md"), "utf8");
  const flat = text.replace(/\s+/g, " ");
  assert.match(
    flat,
    /human owner authorizes the merge of the reviewed head.*Required checks must be green/,
  );
});

test("the Safety bullet uses the same three Blocking cases", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const line = text.split("\n").find((entry) => entry.startsWith("- Safety:"));
  assert.ok(line, "the standards list must have a Safety bullet");
  assert.match(
    line,
    /a production deploy or a project's release workflow, or release without the owner's OK/,
  );
});

test("the code-review rules link the reviewed-head rule", async () => {
  const text = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const rules = /^## Rules\r?\n([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(rules, "the code-review skill must have a Rules section");
  assert.match(rules[1], /owner authorizes the merge of only the head that was independently reviewed/);
  assert.match(rules[1], /workflow\/review-and-merge\.md/);
});
