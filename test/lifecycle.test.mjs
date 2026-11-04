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
});

test("triage stops on scope when the pull request count is unknown or zero", () => {
  const scope = { action: "stop", skill: null, stop: true, reason: "scope" };
  const base = { phase: "triage", lifecycle: null, eligibility: null };
  assert.deepEqual(routeWork(base), scope);
  for (const pullRequestCount of [0, undefined, null, "1", "2", -1, 1.5, Number.NaN]) {
    assert.deepEqual(routeWork({ ...base, pullRequestCount }), scope, `count ${String(pullRequestCount)}`);
  }
  assert.equal(routeWork({ ...base, pullRequestCount: 3 }).skill, "map-work");
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
  const fresh = routeWork({ ...readyImplement, mappedChild: true, mappingMerged: true, mappingReviewVerified: true });
  assert.equal(fresh.action, "implement");
});

test("collision, an open prerequisite, a missing permission and an unreviewed merge stop", () => {
  assert.equal(routeWork({ ...readyImplement, claim: "collision" }).reason, "collision");
  assert.equal(routeWork({ ...readyImplement, prerequisiteComplete: false }).reason, "prerequisite");
  assert.equal(routeWork({ ...readyImplement, permission: "missing" }).reason, "permission");
  assert.equal(routeWork({ ...readyImplement, permission: "unverified" }).reason, "permission");
  const unreviewed = routeWork({ phase: "merge", mergeActor: "human-owner", ownerVerified: true, reviewPassed: false, checksGreen: true });
  assert.equal(unreviewed.action, "stop");
  assert.equal(unreviewed.reason, "unreviewed");
  assert.equal(routeWork({ phase: "merge", mergeActor: "human-owner", ownerVerified: true, reviewPassed: true, checksGreen: false }).reason, "checks");
  const thin = routeWork({ phase: "merge", mergeActor: "human-owner", ownerVerified: true, reviewPassed: true, checksGreen: true });
  assert.equal(thin.action, "stop");
  assert.equal(thin.reason, "head");
});

const readyMerge = {
  phase: "merge",
  mergeActor: "human-owner",
  ownerVerified: true,
  pullRequestAuthorIsOwner: true,
  reviewPassed: true,
  checksGreen: true,
  reviewedHead: "abc",
  currentHead: "abc",
  reviewerIndependent: true,
  mergeMethod: "squash",
  protectionAllowsMerge: true,
};

test("the human owner may merge their own PR after all gates", () => {
  assert.equal(routeWork(readyMerge).action, "merge");
  assert.equal(routeWork({ ...readyMerge, ownerVerified: false }).reason, "owner-identity");
  assert.equal(routeWork({ ...readyMerge, reviewerIndependent: false }).reason, "independent");
  assert.equal(routeWork({ ...readyMerge, currentHead: "def" }).reason, "head");
  assert.equal(routeWork({ ...readyMerge, reviewedHead: "" }).reason, "head");
  assert.equal(routeWork({ ...readyMerge, checksGreen: false }).reason, "checks");
  assert.equal(routeWork({ ...readyMerge, mergeMethod: "rebase" }).reason, "method");
  assert.equal(routeWork({ ...readyMerge, protectionAllowsMerge: false }).reason, "protection");
  assert.equal(routeWork({ ...readyMerge, protectionAllowsMerge: "unverified" }).reason, "protection");
});

test("the independent reviewer merges only after every common gate", () => {
  const agent = { ...readyMerge, mergeActor: "agent", ownerVerified: false, pullRequestAuthorIsOwner: false };
  assert.equal(routeWork(agent).action, "merge");
  assert.equal(routeWork({ ...agent, reviewerIndependent: false }).reason, "independent");
  assert.equal(routeWork({ ...agent, reviewPassed: false }).reason, "unreviewed");
  assert.equal(routeWork({ ...agent, checksGreen: false }).reason, "checks");
  assert.equal(routeWork({ ...agent, currentHead: "def" }).reason, "head");
  assert.equal(routeWork({ ...agent, mergeMethod: "merge" }).reason, "method");
  assert.equal(routeWork({ ...agent, protectionAllowsMerge: false }).reason, "protection");
  assert.equal(routeWork({ ...agent, mergeActor: "unknown" }).reason, "merge-actor");
  assert.equal(routeWork({ ...readyMerge, mergeActor: undefined }).reason, "merge-actor");
});

test("ownerMergeApproved has no effect on an agent merge", () => {
  const agent = { ...readyMerge, mergeActor: "agent", ownerVerified: false, pullRequestAuthorIsOwner: false };
  assert.equal(routeWork({ ...agent, ownerMergeApproved: false }).action, "merge");
  assert.equal(routeWork({ ...agent, ownerMergeApproved: true, reviewerIndependent: false }).reason, "independent");
  assert.equal(routeWork({ ...agent, ownerMergeApproved: true, reviewPassed: false }).reason, "unreviewed");
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
  assert.match(review, /author never gives the verdict on, approves or merges their own pull request/i);
  assert.match(review, /human owner\]\([^)]*roles\.md#human-owner\) may merge a pull request that they authored/i);
  assert.match(review, /reviewer merges only the head that they reviewed/i);
  assert.doesNotMatch(review, /agent may merge only with the owner's explicit authorization/i);
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

test("mapped child implementation requires verified review evidence after merge", () => {
  const child = { ...readyImplement, mappedChild: true, mappingMerged: true };
  assert.equal(routeWork(child).reason, "mapping-review");
  assert.equal(routeWork({ ...child, mappingReviewVerified: false }).reason, "mapping-review");
  assert.equal(routeWork({ ...child, mappingReviewVerified: true }).action, "implement");
  assert.equal(routeWork({ ...child, mappingReviewVerified: true, sessionMappedIssue: true }).reason, "same-session");
});

test("owner direction cannot prepare a mapped child before reviewed map handoff", () => {
  const child = {
    phase: "prepare", ownerInstruction: true, ownerVerified: true,
    conflict: false, humanOnly: false, permission: "present",
    prerequisiteComplete: true, acceptanceCriteria: true, trackerSupported: true,
    lifecycle: "planning", eligibility: null, mappedChild: true,
    mappingMerged: true, mappingReviewVerified: true,
  };
  assert.equal(routeWork(child).action, "prepare-ready");
  assert.equal(routeWork({ ...child, mappingMerged: false }).reason, "mapping-handoff");
  assert.equal(routeWork({ ...child, mappingReviewVerified: undefined }).reason, "mapping-review");
  assert.equal(routeWork({ ...child, sessionMappedIssue: true }).reason, "same-session");
  assert.equal(routeWork({ ...child, ownerVerified: false }).reason, "owner-authorization");
  assert.equal(routeWork({ ...child, humanOnly: true }).reason, "conflict");
});

test("attestation cannot substitute for normal review before a merge", () => {
  assert.equal(routeWork({ ...readyMerge, reviewPassed: false, ownerAttestation: true }).reason, "unreviewed");
});

test("active-parent map amendments require every approval and safety fact", () => {
  const amendment = {
    phase: "map-amendment",
    lifecycle: "active",
    ownerApprovalRecorded: true,
    approvalMatchesScope: true,
    acceptanceCriteriaIncluded: true,
    claim: "effective",
    preflightPassed: true,
    permission: "present",
    trackerSupported: true,
    duplicateChild: false,
    prerequisiteConflict: false,
    dependencyCycle: false,
  };
  assert.equal(routeWork(amendment).action, "amend-map");
  assert.equal(routeWork({ ...amendment, lifecycle: "planning" }).reason, "state");
  assert.equal(routeWork({ ...amendment, ownerApprovalRecorded: false }).reason, "owner-approval");
  assert.equal(routeWork({ ...amendment, approvalMatchesScope: false }).reason, "owner-approval");
  assert.equal(routeWork({ ...amendment, acceptanceCriteriaIncluded: false }).reason, "criteria");
  assert.equal(routeWork({ ...amendment, claim: "collision" }).reason, "collision");
  assert.equal(routeWork({ ...amendment, claim: null }).reason, "claim");
  assert.equal(routeWork({ ...amendment, preflightPassed: false }).reason, "preflight");
  assert.equal(routeWork({ ...amendment, permission: "unverified" }).reason, "permission");
  assert.equal(routeWork({ ...amendment, trackerSupported: false }).reason, "tracker");
  assert.equal(routeWork({ ...amendment, duplicateChild: true }).reason, "duplicate");
  assert.equal(routeWork({ ...amendment, duplicateChild: undefined }).reason, "duplicate");
  assert.equal(routeWork({ ...amendment, prerequisiteConflict: true }).reason, "prerequisite-conflict");
  assert.equal(routeWork({ ...amendment, prerequisiteConflict: undefined }).reason, "prerequisite-conflict");
  assert.equal(routeWork({ ...amendment, dependencyCycle: true }).reason, "prerequisite-conflict");
  assert.equal(routeWork({ ...amendment, dependencyCycle: undefined }).reason, "prerequisite-conflict");
});

test("active-parent amendments do not change the initial mapping route", () => {
  assert.equal(routeWork({ phase: "map-amendment", lifecycle: "active" }).action, "stop");
  assert.equal(routeWork({ phase: "prepare", lifecycle: "active", ownerInstruction: true, ownerVerified: true }).action, "stop");
});

test("parent mapping approval prepares a mapped child without an owner instruction", () => {
  const child = {
    phase: "prepare", parentMappingApproved: true,
    conflict: false, humanOnly: false, permission: "present",
    prerequisiteComplete: true, acceptanceCriteria: true, trackerSupported: true,
    lifecycle: "planning", eligibility: "agent", mappedChild: true,
    mappingMerged: true, mappingReviewVerified: true,
  };
  assert.equal(routeWork(child).action, "prepare-ready");
  for (const parentMappingApproved of [false, undefined, null, "true", 1]) {
    assert.equal(routeWork({ ...child, parentMappingApproved }).reason, "owner-authorization");
  }
  assert.equal(routeWork({ ...child, mappedChild: false }).reason, "owner-authorization");
  assert.equal(routeWork({ ...child, mappedChild: undefined }).reason, "owner-authorization");
  assert.equal(routeWork({ ...child, mappingMerged: false }).reason, "mapping-handoff");
  assert.equal(routeWork({ ...child, mappingReviewVerified: false }).reason, "mapping-review");
  assert.equal(routeWork({ ...child, sessionMappedIssue: true }).reason, "same-session");
  assert.equal(routeWork({ ...child, humanOnly: true }).reason, "conflict");
  assert.equal(routeWork({ ...child, conflict: true }).reason, "conflict");
  assert.equal(routeWork({ ...child, permission: "missing" }).reason, "permission");
  assert.equal(routeWork({ ...child, prerequisiteComplete: false }).reason, "prerequisite");
  assert.equal(routeWork({ ...child, acceptanceCriteria: false }).reason, "criteria");
  assert.equal(routeWork({ ...child, trackerSupported: false }).reason, "tracker");
  assert.equal(routeWork({ ...child, lifecycle: "active" }).reason, "state");
  assert.equal(routeWork({ ...child, eligibility: "human" }).reason, "eligibility");
});

test("parent mapping approval never allows a merge", () => {
  const merge = { ...readyMerge, mappedChild: true, parentMappingApproved: true };
  assert.equal(routeWork(merge).action, "merge");
  assert.equal(routeWork({ ...merge, reviewPassed: false }).reason, "unreviewed");
  assert.equal(routeWork({ ...merge, checksGreen: false }).reason, "checks");
  assert.equal(routeWork({ ...merge, reviewerIndependent: false }).reason, "independent");
  assert.equal(routeWork({ ...merge, mergeActor: undefined }).reason, "merge-actor");
  assert.equal(routeWork({ ...merge, mergeActor: "human-owner", ownerVerified: false }).reason, "owner-identity");
  const agent = { ...merge, mergeActor: "agent", pullRequestAuthorIsOwner: false };
  assert.equal(routeWork(agent).action, "merge");
  for (const actor of [merge, agent]) {
    assert.equal(routeWork({ ...actor, currentHead: "def" }).reason, "head");
    assert.equal(routeWork({ ...actor, mergeMethod: "rebase" }).reason, "method");
    assert.equal(routeWork({ ...actor, protectionAllowsMerge: false }).reason, "protection");
  }
});

test("the lifecycle page names the parent mapping approval", async () => {
  const page = await flat("workflow/lifecycle.md");
  assert.match(page, /For a mapped child, callers set `parentMappingApproved` only when the \[human owner\]\(roles\.md#human-owner\) approval of the parent mapping is recorded on the parent issue\./);
  assert.match(page, /With that approval, the router allows preparation and pull request creation for the child without a new owner instruction\. It never allows a merge\./);
});

test("parent mapping approval needs established agent eligibility", () => {
  const child = {
    phase: "prepare", parentMappingApproved: true,
    conflict: false, humanOnly: false, permission: "present",
    prerequisiteComplete: true, acceptanceCriteria: true, trackerSupported: true,
    lifecycle: "planning", eligibility: "agent", mappedChild: true,
    mappingMerged: true, mappingReviewVerified: true,
  };
  assert.equal(routeWork(child).action, "prepare-ready");
  for (const eligibility of [null, undefined, "human", "Agent", ""]) {
    assert.equal(routeWork({ ...child, eligibility }).reason, "eligibility", `eligibility ${String(eligibility)}`);
  }
  const owner = { ...child, parentMappingApproved: undefined, ownerInstruction: true, ownerVerified: true };
  assert.equal(routeWork({ ...owner, eligibility: null }).action, "prepare-ready");
  assert.equal(routeWork({ ...owner, eligibility: "agent" }).action, "prepare-ready");
  assert.equal(routeWork({ ...owner, eligibility: "human" }).reason, "eligibility");
  assert.equal(routeWork({ ...owner, mappedChild: false, eligibility: null }).action, "prepare-ready");
});

test("an agent merge needs the reviewer, never the author", () => {
  const reviewer = { ...readyMerge, mergeActor: "agent", ownerVerified: false, pullRequestAuthorIsOwner: false };
  assert.equal(routeWork(reviewer).action, "merge");
  const author = { ...reviewer, reviewerIndependent: false };
  assert.equal(routeWork(author).reason, "independent");
  assert.equal(routeWork({ ...author, ownerVerified: true }).reason, "independent");
  assert.equal(routeWork({ ...author, ownerMergeApproved: true }).reason, "independent");
  assert.equal(routeWork({ ...author, parentMappingApproved: true, mappedChild: true }).reason, "independent");
  for (const value of [undefined, null, "true", 1, "reviewer"]) {
    const unknown = routeWork({ ...reviewer, reviewerIndependent: value });
    assert.equal(unknown.reason, "independent", `reviewerIndependent ${String(value)} must stop`);
    assert.equal(unknown.stop, true);
  }
});
