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
  if (input.phase === "triage") return go("classify", triageSkill(input.pullRequestCount));
  if (input.phase === "implement") return routeImplement(input);
  if (input.phase === "merge") {
    if (input.reviewPassed !== true) return stop("unreviewed");
    if (input.checksGreen !== true) return stop("checks");
    return go("merge");
  }
  return stop("phase");
}
