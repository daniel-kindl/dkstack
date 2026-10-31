// Decide the next lifecycle action from facts the caller already has.
// Triage classifies a request before implementation readiness.

function stop(reason) {
  return { action: "stop", skill: null, stop: true, reason };
}

function go(action, skill = null) {
  return { action, skill, stop: false, reason: null };
}

function triageSkill(pullRequestCount) {
  if (pullRequestCount === 1) return "plan-work";
  if (typeof pullRequestCount === "number" && pullRequestCount > 1) return "map-work";
  return null;
}

function sameReviewedHead(input) {
  const reviewed = input.reviewedHead;
  const current = input.currentHead;
  return typeof reviewed === "string" && reviewed.length > 0 && reviewed === current;
}

function routeMerge(input) {
  if (input.reviewPassed !== true) return stop("unreviewed");
  if (input.checksGreen !== true) return stop("checks");
  if (!sameReviewedHead(input)) return stop("head");
  if (input.reviewerIndependent !== true) return stop("independent");
  if (input.mergeMethod !== "squash") return stop("method");
  if (input.protectionAllowsMerge !== true) return stop("protection");
  return go("merge");
}

function routePrepare(input) {
  if (input.ownerInstruction !== true || input.ownerVerified !== true) return stop("owner-authorization");
  if (input.conflict === true || input.humanOnly === true) return stop("conflict");
  if (input.permission !== "present") return stop("permission");
  if (input.prerequisiteComplete !== true) return stop("prerequisite");
  if (input.acceptanceCriteria !== true) return stop("criteria");
  if (input.trackerSupported !== true) return stop("tracker");
  if (input.lifecycle !== null && input.lifecycle !== "triage" && input.lifecycle !== "planning") return stop("state");
  if (input.eligibility !== null && input.eligibility !== "agent") return stop("eligibility");
  return go("prepare-ready");
}

function routeImplement(input) {
  if (input.sessionMappedIssue === true) return stop("same-session");
  if (input.mappedChild === true && input.mappingMerged !== true) return stop("mapping-handoff");
  if (input.claim === "collision") return stop("collision");
  if (input.permission !== "present") return stop("permission");
  if (input.prerequisiteComplete !== true) return stop("prerequisite");
  if (input.readiness !== true) return stop("readiness");
  if (input.claim !== "effective") return stop("claim");
  return go("implement");
}

export function routeWork(input = {}) {
  if (input.phase === "prepare") return routePrepare(input);
  if (input.phase === "triage") return go("classify", triageSkill(input.pullRequestCount));
  if (input.phase === "implement") return routeImplement(input);
  if (input.phase === "merge") return routeMerge(input);
  return stop("phase");
}
