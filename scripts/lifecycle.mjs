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
  if (Number.isInteger(pullRequestCount) && pullRequestCount > 1) return "map-work";
  return null;
}

function routeTriage(input) {
  const skill = triageSkill(input.pullRequestCount);
  if (skill === null) return stop("scope");
  return go("classify", skill);
}

function sameReviewedHead(input) {
  const reviewed = input.reviewedHead;
  const current = input.currentHead;
  return typeof reviewed === "string" && reviewed.length > 0 && reviewed === current;
}

function routeMerge(input) {
  if (input.mergeActor === "human-owner") {
    if (input.ownerVerified !== true) return stop("owner-identity");
  } else if (input.mergeActor !== "agent") {
    return stop("merge-actor");
  }
  if (input.reviewPassed !== true) return stop("unreviewed");
  if (input.checksGreen !== true) return stop("checks");
  if (!sameReviewedHead(input)) return stop("head");
  if (input.reviewerIndependent !== true) return stop("independent");
  if (input.mergeMethod !== "squash") return stop("method");
  if (input.protectionAllowsMerge !== true) return stop("protection");
  return go("merge");
}

function mappingStop(input) {
  if (input.sessionMappedIssue === true) return stop("same-session");
  if (input.mappedChild !== true) return null;
  if (input.mappingMerged !== true) return stop("mapping-handoff");
  if (input.mappingReviewVerified !== true) return stop("mapping-review");
  return null;
}

function routePrepare(input) {
  const blocked = mappingStop(input);
  if (blocked) return blocked;
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

function routeMapAmendment(input) {
  if (input.lifecycle !== "active") return stop("state");
  if (input.ownerApprovalRecorded !== true || input.approvalMatchesScope !== true) {
    return stop("owner-approval");
  }
  if (input.acceptanceCriteriaIncluded !== true) return stop("criteria");
  if (input.claim === "collision") return stop("collision");
  if (input.claim !== "effective") return stop("claim");
  if (input.preflightPassed !== true) return stop("preflight");
  if (input.permission !== "present") return stop("permission");
  if (input.trackerSupported !== true) return stop("tracker");
  if (input.duplicateChild !== false) return stop("duplicate");
  if (input.prerequisiteConflict !== false || input.dependencyCycle !== false) {
    return stop("prerequisite-conflict");
  }
  return go("amend-map", "map-work");
}

function routeImplement(input) {
  const blocked = mappingStop(input);
  if (blocked) return blocked;
  if (input.claim === "collision") return stop("collision");
  if (input.permission !== "present") return stop("permission");
  if (input.prerequisiteComplete !== true) return stop("prerequisite");
  if (input.readiness !== true) return stop("readiness");
  if (input.claim !== "effective") return stop("claim");
  return go("implement");
}

export function routeWork(input = {}) {
  if (input.phase === "prepare") return routePrepare(input);
  if (input.phase === "map-amendment") return routeMapAmendment(input);
  if (input.phase === "triage") return routeTriage(input);
  if (input.phase === "implement") return routeImplement(input);
  if (input.phase === "merge") return routeMerge(input);
  return stop("phase");
}
