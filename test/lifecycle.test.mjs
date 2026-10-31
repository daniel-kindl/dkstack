import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function flat(path) {
  return (await readFile(join(root, path), "utf8")).replace(/\s+/g, " ");
}

test("the lifecycle page orders the route and links the contracts", async () => {
  const page = await flat("workflow/lifecycle.md");
  const external = page.search(/external request/i);
  const preflight = page.indexOf("preflight");
  const map = page.search(/map-work/);
  const fresh = page.search(/fresh session/i);
  const review = page.search(/independent review/i);
  const merge = page.search(/reviewed head/i);
  assert.ok(external >= 0 && preflight > external, "preflight follows the external request");
  assert.ok(map > preflight && fresh > map, "a fresh session follows map-work");
  assert.ok(review > fresh && merge > review, "merge follows independent review of the head");
  assert.match(page, /\[work\.md\]\(work\.md\)/);
  assert.match(page, /\[claims\.md\]\(claims\.md\)/);
  assert.match(page, /\[preflight\.md\]\(preflight\.md\)/);
  assert.match(page, /\[review-and-merge\.md\]\(review-and-merge\.md\)/);
  assert.match(page, /\[safety\.md\]\(safety\.md\)/);
  assert.doesNotMatch(page, /Do not force-push/);
});

test("negative lifecycle cases stop without a new procedure", async () => {
  const page = await flat("workflow/lifecycle.md");
  assert.match(page, /collision.*stop/i);
  assert.match(page, /prerequisite is not complete.*stop/i);
  assert.match(page, /permission.*missing.*stop/i);
  assert.match(page, /same session.*stop/i);
  assert.match(page, /unreviewed.*do not merge/i);
});

test("the external request template does not ask for a decomposition", async () => {
  const text = await flat(".github/ISSUE_TEMPLATE/external-request.md");
  assert.match(text, /## Outcome/);
  assert.match(text, /## Constraints/);
  assert.match(text, /## Context/);
  assert.match(text, /## Acceptance intent/);
  assert.match(text, /do not split this request/i);
  assert.doesNotMatch(text, /map-work/);
});

test("triage checks readiness and chooses plan-work or map-work", async () => {
  const text = await flat("skills/triage/SKILL.md");
  assert.match(text, /workflow\/work\.md/);
  assert.match(text, /workflow\/preflight\.md/);
  assert.match(text, /readiness check fails.*stop/i);
  assert.match(text, /one pull request.*plan-work/i);
  assert.match(text, /more than one pull request.*map-work/i);
});

test("plan-work and tdd-loop keep the claim and the fresh session", async () => {
  const plan = await flat("skills/plan-work/SKILL.md");
  const tdd = await flat("skills/tdd-loop/SKILL.md");
  for (const text of [plan, tdd]) {
    assert.match(text, /workflow\/claims\.md/);
    assert.match(text, /verified claim/i);
    assert.match(text, /fresh session/i);
    assert.match(text, /workflow\/work\.md/);
  }
  assert.match(plan, /issue scope/i);
  assert.match(tdd, /must not implement a mapped issue in the session that mapped it/i);
});

test("review and release skills keep the merge and publish gates", async () => {
  const review = await flat("skills/code-review/SKILL.md");
  const release = await flat("skills/release/SKILL.md");
  assert.match(review, /reviewer merges only the head that they reviewed/i);
  assert.match(review, /author never.*merges their own pull request/i);
  assert.match(review, /required checks on that head must be green/i);
  assert.match(release, /OK names the exact version/);
  assert.match(release, /never covers a production deploy/);
});

test("the workflow index links the lifecycle page", async () => {
  const index = await readFile(join(root, "workflow", "index.md"), "utf8");
  assert.match(index, /\[lifecycle\.md\]\(lifecycle\.md\)/);
});
