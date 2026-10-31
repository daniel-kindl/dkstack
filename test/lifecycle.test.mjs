import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { routeWork } from "../scripts/lifecycle.mjs";

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

test("triage classifies before implementation readiness", async () => {
  const text = await flat("skills/triage/SKILL.md");
  assert.match(text, /workflow\/work\.md/);
  assert.match(text, /workflow\/preflight\.md/);
  assert.match(text, /missing lifecycle or eligibility does not stop triage/i);
  assert.match(text, /implementation readiness.*before implementation/i);
  assert.doesNotMatch(text, /If a readiness check fails, stop/);
  assert.match(text, /one pull request.*plan-work/i);
  assert.match(text, /more than one pull request.*map-work/i);
});

const readyImplement = {
  phase: "implement",
  sessionMappedIssue: false,
  mappedChild: false,
  mappingMerged: false,
  readiness: true,
  prerequisiteComplete: true,
  permission: "present",
  claim: "effective",
};

test("an unlabeled external request is classified", () => {
  const many = routeWork({ phase: "triage", lifecycle: null, eligibility: null, pullRequestCount: 2 });
  assert.equal(many.action, "classify");
  assert.equal(many.skill, "map-work");
  assert.equal(many.stop, false);
  const one = routeWork({ phase: "triage", lifecycle: null, eligibility: null, pullRequestCount: 1 });
  assert.equal(one.action, "classify");
  assert.equal(one.skill, "plan-work");
  assert.equal(one.stop, false);
  const unread = routeWork({ phase: "triage", lifecycle: null, eligibility: null });
  assert.equal(unread.action, "classify");
  assert.equal(unread.skill, null);
  assert.equal(unread.stop, false);
});

test("missing implementation readiness stops implementation only", () => {
  const triage = routeWork({ phase: "triage", lifecycle: null, eligibility: null, readiness: false, pullRequestCount: 1 });
  assert.equal(triage.stop, false);
  const implement = routeWork({ ...readyImplement, readiness: false });
  assert.deepEqual(implement, { action: "stop", skill: null, stop: true, reason: "readiness" });
});

test("a mapping handoff blocks the mapping session and an unmerged map", () => {
  const same = routeWork({ ...readyImplement, sessionMappedIssue: true, mappedChild: true, mappingMerged: true });
  assert.equal(same.reason, "same-session");
  const waiting = routeWork({ ...readyImplement, mappedChild: true, mappingMerged: false });
  assert.equal(waiting.reason, "mapping-handoff");
  const fresh = routeWork({ ...readyImplement, mappedChild: true, mappingMerged: true });
  assert.equal(fresh.action, "implement");
});

test("collision, an open prerequisite, a missing permission and an unreviewed merge stop", () => {
  assert.equal(routeWork({ ...readyImplement, claim: "collision" }).reason, "collision");
  assert.equal(routeWork({ ...readyImplement, prerequisiteComplete: false }).reason, "prerequisite");
  assert.equal(routeWork({ ...readyImplement, permission: "missing" }).reason, "permission");
  assert.equal(routeWork({ ...readyImplement, permission: "unverified" }).reason, "permission");
  const unreviewed = routeWork({ phase: "merge", reviewPassed: false, checksGreen: true });
  assert.equal(unreviewed.action, "stop");
  assert.equal(unreviewed.reason, "unreviewed");
  assert.equal(routeWork({ phase: "merge", reviewPassed: true, checksGreen: false }).reason, "checks");
  const thin = routeWork({ phase: "merge", reviewPassed: true, checksGreen: true });
  assert.equal(thin.action, "stop");
  assert.equal(thin.reason, "head");
});

const readyMerge = {
  phase: "merge",
  reviewPassed: true,
  checksGreen: true,
  reviewedHead: "abc",
  currentHead: "abc",
  reviewerIndependent: true,
  mergeMethod: "squash",
  protectionAllowsMerge: true,
};

test("a merge needs the reviewed head, an independent reviewer, squash and protection", () => {
  assert.equal(routeWork(readyMerge).action, "merge");
  assert.equal(routeWork({ ...readyMerge, currentHead: "def" }).reason, "head");
  assert.equal(routeWork({ ...readyMerge, reviewedHead: "" }).reason, "head");
  assert.equal(routeWork({ ...readyMerge, reviewerIndependent: false }).reason, "independent");
  assert.equal(routeWork({ ...readyMerge, mergeMethod: "rebase" }).reason, "method");
  assert.equal(routeWork({ ...readyMerge, protectionAllowsMerge: false }).reason, "protection");
  assert.equal(routeWork({ ...readyMerge, protectionAllowsMerge: "unverified" }).reason, "protection");
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

test("verified owner direction permits preparation of missing readiness metadata", () => {
  const request = {
    phase: "prepare", ownerInstruction: true, ownerVerified: true,
    lifecycle: null, eligibility: null, conflict: false, humanOnly: false,
    permission: "present", prerequisiteComplete: true,
    acceptanceCriteria: true, trackerSupported: true,
  };
  assert.equal(routeWork(request).action, "prepare-ready");
  assert.equal(routeWork({ ...request, lifecycle: "triage" }).action, "prepare-ready");
  assert.equal(routeWork({ ...request, lifecycle: "planning", eligibility: "agent" }).action, "prepare-ready");
  assert.equal(routeWork({ ...request, ownerInstruction: false }).reason, "owner-authorization");
  assert.equal(routeWork({ ...request, ownerVerified: false }).reason, "owner-authorization");
  assert.equal(routeWork({ ...request, humanOnly: true }).reason, "conflict");
  assert.equal(routeWork({ ...request, eligibility: "human" }).reason, "eligibility");
  assert.equal(routeWork({ ...request, lifecycle: "active" }).reason, "state");
  assert.equal(routeWork({ ...request, prerequisiteComplete: false }).reason, "prerequisite");
  assert.equal(routeWork({ ...request, acceptanceCriteria: false }).reason, "criteria");
  assert.equal(routeWork({ ...request, permission: "missing" }).reason, "permission");
  assert.equal(routeWork({ ...request, trackerSupported: false }).reason, "tracker");
  assert.equal(routeWork({ ...request, conflict: true }).reason, "conflict");
  assert.equal(routeWork({ ...request, phase: "implement", readiness: false, claim: "effective" }).reason, "readiness");
});
