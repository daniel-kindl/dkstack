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
  const skill = await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8");
  const flatReview = review.replace(/\s+/g, " ");
  const flatRoles = roles.replace(/\s+/g, " ");
  const flatSkill = skill.replace(/\s+/g, " ");
  assert.match(flatRoles, /the author must not review, approve or merge their own pull request/i);
  assert.match(flatRoles, /human owner may merge a pull request after independent review and all merge checks pass/i);
  assert.match(flatRoles, /includes a pull request that the owner authored/i);
  assert.match(flatRoles, /The reviewer reviews pull requests and merges them\./);
  assert.doesNotMatch(flatRoles, /any merge an agent performs/i);
  assert.doesNotMatch(flatRoles, /agent may merge only with the owner's explicit authorization/i);
  assert.match(flatReview, /reviewer merges only the head that they reviewed, and only when the review passes, all required checks are green/i);
  assert.match(flatReview, /The author never merges\./);
  assert.match(flatReview, /human owner\]\(roles\.md#human-owner\) may also merge, including a pull request that they authored, after the same checks pass/i);
  assert.doesNotMatch(flatReview, /agent may merge only with the owner's explicit authorization/i);
  assert.match(flatSkill, /author never gives the verdict on, approves or merges their own pull request/i);
  assert.doesNotMatch(flatSkill, /agent may merge only with the owner's explicit authorization/i);
});

test("the workflow flow uses the same merge gates", async () => {
  const text = await readFile(join(repoRoot, "workflow/index.md"), "utf8");
  const flat = text.replace(/\s+/g, " ");
  assert.match(
    flat,
    /reviewer merges only the head that they reviewed, and only when the review passes, all required checks are green.*The author never merges\. The \[human owner\]\(roles\.md#human-owner\) may also merge\./,
  );
  assert.doesNotMatch(flat, /Agents may merge only with explicit owner authorization/);
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
  assert.match(rules[1], /reviewer merges only the head that they reviewed/);
  assert.match(rules[1], /Review the new head before a merge\. Required checks on that head must be green\./);
  assert.doesNotMatch(rules[1], /agent may merge only with the owner's explicit authorization/);
  assert.match(rules[1], /workflow\/review-and-merge\.md/);
});

test("roles.md defines the human owner under its own heading", async () => {
  const text = await readFile(join(repoRoot, "workflow/roles.md"), "utf8");
  const section = /^## Human owner\r?\n([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(section, "roles.md must have a Human owner section");
  assert.equal(
    section[1].replace(/\s+/g, " ").trim(),
    "The human owner is only the owner who acts in person, or the owner's own words. A bot or an agent that acts through the owner's account is always an agent. It is never the human owner. " +
      "A relayed decision counts as the owner's words only if it quotes the owner's exact words " +
      "with the time and the place where the owner wrote them, and the agent records that quote " +
      "in the issue or pull request before relying on it in a later session. A paraphrase or an " +
      "agent's summary never counts.",
  );
});

test("roles.md defines the generic roles and names no team", async () => {
  const text = await readFile(join(repoRoot, "workflow/roles.md"), "utf8");
  const section = /^## Role definitions\r?\n([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(section, "roles.md must have a Role definitions section");
  for (const role of ["implementer", "reviewer", "architect", "writer", "coordinator"]) {
    assert.match(section[1], new RegExp(`^- The ${role} `, "m"), `missing role ${role}`);
  }
  assert.match(section[1], /See \[Rules\]\(#rules\)\./);
  for (const name of [/Forge/, /Sentinel/, /Atlas/, /Scribe/, /\bPip\b/, /Daniel/, /This team/i]) {
    assert.doesNotMatch(text, name);
  }
  assert.doesNotMatch(text, /^## Role map$/m);
});

test("missing review evidence never counts as a review", async () => {
  const review = (await readFile(join(repoRoot, "workflow/review-and-merge.md"), "utf8")).replace(/\s+/g, " ");
  assert.match(review, /If a fact is missing, unverifiable or conflicting, do not treat the pull request as reviewed\./);
  assert.match(review, /Never backdate or fabricate review evidence\./);
});

test("review and release skills keep the merge and publish gates", async () => {
  const review = (await readFile(join(repoRoot, "skills/code-review/SKILL.md"), "utf8")).replace(/\s+/g, " ");
  const release = (await readFile(join(repoRoot, "skills/release/SKILL.md"), "utf8")).replace(/\s+/g, " ");
  assert.match(review, /author never gives the verdict on, approves or merges their own pull request/i);
  assert.match(review, /human owner\]\([^)]*roles\.md#human-owner\) may merge a pull request that they authored/i);
  assert.match(review, /reviewer merges only the head that they reviewed/i);
  assert.doesNotMatch(review, /agent may merge only with the owner's explicit authorization/i);
  assert.match(review, /required checks on that head must be green/i);
  assert.match(release, /OK names the exact version/);
  assert.match(release, /never covers a production deploy/);
});

test("review does not require a feature plan", async () => {
  const review = (await readFile(join(repoRoot, "workflow/review-and-merge.md"), "utf8")).replace(/\s+/g, " ");
  assert.match(review, /The review does not require a feature plan\./);
  assert.doesNotMatch(review, /feature-plans\.md/);
});
