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

test("owner and agent merge authority stays distinct", async () => {
  const roles = await readFile(join(repoRoot, "workflow/roles.md"), "utf8");
  const review = await readFile(join(repoRoot, "workflow/review-and-merge.md"), "utf8");
  const work = await readFile(join(repoRoot, "workflow/work.md"), "utf8");
  const skill = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const flatReview = review.replace(/\s+/g, " ");
  assert.match(roles, /human owner may merge a pull request they authored/i);
  assert.match(roles, /every release and any merge an agent performs/i);
  assert.match(roles, /agent author must not review or approve their own\s+pull request/i);
  assert.match(roles, /agent may merge only with the owner's explicit authorization/i);
  assert.doesNotMatch(roles, /author must not review or merge their own pull request/i);
  assert.match(flatReview, /independent review.*required checks.*squash.*protection/i);
  assert.match(flatReview, /human owner may merge a pull request they authored/i);
  assert.match(flatReview, /an agent may merge only with the owner's explicit authorization/i);
  assert.match(flatReview, /agent may merge only with the owner's explicit authorization for that exact pull request/i);
  assert.match(work, /human owner may merge an authored pull request/i);
  assert.doesNotMatch(work, /The author does not merge that pull request/i);
  assert.match(skill, /agent author never gives the verdict on or approves their own pull request/i);
  assert.match(skill, /human owner may merge a PR they authored/i);
  assert.doesNotMatch(skill, /author never gives the verdict on, approves or merges their own pull request/i);
});

test("the workflow flow uses the same merge gates", async () => {
  const text = await readFile(join(repoRoot, "workflow/index.md"), "utf8");
  const flat = text.replace(/\s+/g, " ");
  assert.match(
    flat,
    /human owner may merge an authored PR after independent review.*Agents may merge only with explicit owner authorization.*Required checks must be green/,
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
  assert.match(rules[1], /human owner may merge only the head that was independently reviewed/);
  assert.match(rules[1], /This includes a PR they authored/);
  assert.match(rules[1], /agent may merge only with the owner's explicit authorization for that exact PR/);
  assert.match(rules[1], /workflow\/review-and-merge\.md/);
});
