#!/usr/bin/env node
// Discover the tracker and plan a preflight. The default is a dry run.
// --apply creates only missing catalog labels.

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const CAPABILITIES = [
  "issues",
  "labels",
  "milestones",
  "parent/sub-issues",
  "blocking links",
  "assignment",
  "comments",
  "PRs/reviews",
  "checks",
  "protection",
];

export const CATALOG = [
  { name: "type:feature", color: "1F6FEB", description: "A new behavior." },
  { name: "type:bug", color: "D1242F", description: "A defect." },
  { name: "type:refactor", color: "8250DF", description: "A structure change that keeps the behavior." },
  { name: "type:chore", color: "64748B", description: "Maintenance work." },
  { name: "type:docs", color: "0E8A93", description: "A documentation change." },
  { name: "type:research", color: "C86B12", description: "A question to answer before a change." },
  { name: "status:triage", color: "B6BDC7", description: "The issue waits for the first decision." },
  { name: "status:planning", color: "A371F7", description: "The scope is being planned." },
  { name: "status:ready", color: "238636", description: "The readiness checks can pass." },
  { name: "status:active", color: "0969DA", description: "The work has started." },
  { name: "status:review", color: "BF8700", description: "The change is in review." },
  { name: "agent:ready", color: "2DA44E", description: "An agent may do the work." },
  { name: "agent:human-only", color: "CF222E", description: "Only a human does the work." },
  { name: "priority:p0", color: "B60205", description: "The most urgent work." },
  { name: "priority:p1", color: "E8590C", description: "Urgent work." },
  { name: "priority:p2", color: "D4A72C", description: "Normal work." },
  { name: "priority:p3", color: "6F879D", description: "The least urgent work." },
  { name: "needs:decision", color: "C69026", description: "The owner must decide." },
  { name: "needs:clarification", color: "D876E3", description: "The requirement is not clear." },
];

const FALLBACKS = {
  issues: "Do not track work in a second store. Report that the tracker has no issues.",
  labels: "Do not create labels. Do not store the catalog in a comment.",
  milestones: "Record the milestone as unsupported. Do not invent a milestone in a comment.",
  "parent/sub-issues": "Do not write a hierarchy in a comment. An action that needs a parent or a child fails closed.",
  "blocking links": "Do not write a prerequisite in a comment. An action that needs a prerequisite fails closed.",
  assignment: "Do not record an assignee in a comment.",
  comments: "Do not claim that a comment was stored.",
  "PRs/reviews": "Use the code host record for a pull request and a review. If that record is missing, fail closed.",
  checks: "Report that checks are unsupported. Do not treat a missing check as a pass.",
  protection: "Do not change protection. A change to protection needs the owner.",
};

const GROUPS = [
  { name: "type", prefix: "type:", min: 1, max: 1 },
  { name: "status", prefix: "status:", min: 1, max: 1 },
  { name: "agent", prefix: "agent:", min: 0, max: 1 },
  { name: "priority", prefix: "priority:", min: 0, max: 1 },
  { name: "needs", prefix: "needs:", min: 0, max: 2 },
];

const OWNER_GATED = [
  { action: "protection", reason: "A change to protection needs the owner." },
  { action: "settings", reason: "A change to settings needs the owner." },
  { action: "infrastructure", reason: "A change to infrastructure needs the owner." },
];

function requireArray(value, name) {
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`);
}

function readCapabilities(capabilities) {
  if (capabilities === null || typeof capabilities !== "object" || Array.isArray(capabilities)) {
    throw new Error("capabilities must be an object");
  }
  const keys = Object.keys(capabilities);
  const sameKeys = keys.length === CAPABILITIES.length
    && CAPABILITIES.every((name) => Object.hasOwn(capabilities, name));
  const booleans = CAPABILITIES.every((name) => typeof capabilities[name] === "boolean");
  if (!sameKeys || !booleans) {
    throw new Error("the capability record must set every capability to true or false");
  }
  return capabilities;
}

export function planPreflight(input = {}) {
  const capabilities = readCapabilities(input.capabilities);
  const labels = input.labels ?? [];
  const issues = input.issues ?? [];
  requireArray(labels, "labels");
  requireArray(issues, "issues");
  const apply = input.apply === true;
  const names = new Set(CATALOG.map((entry) => entry.name));
  const unsupported = CAPABILITIES
    .filter((capability) => capabilities[capability] !== true)
    .map((capability) => ({ capability, fallback: FALLBACKS[capability] }));
  const creates = [];
  const differs = [];
  const kept = [];
  if (capabilities.labels === true) {
    const current = new Map();
    for (const item of labels) {
      if (typeof item?.name !== "string" || item.name === "") {
        throw new Error("each label needs a name");
      }
      if (current.has(item.name)) throw new Error(`duplicate label: ${item.name}`);
      current.set(item.name, item);
      if (!names.has(item.name)) kept.push(item.name);
    }
    for (const entry of CATALOG) {
      const found = current.get(entry.name);
      if (!found) {
        creates.push({ name: entry.name, color: entry.color, description: entry.description });
        continue;
      }
      if (String(found.color ?? "").toUpperCase() !== entry.color) {
        differs.push({ name: entry.name, field: "color", catalog: entry.color, current: found.color ?? "" });
      }
      if ((found.description ?? "") !== entry.description) {
        differs.push({
          name: entry.name,
          field: "description",
          catalog: entry.description,
          current: found.description ?? "",
        });
      }
    }
  }
  const conflicts = [];
  const missing = [];
  const blocked = [];
  for (const issue of issues) {
    const issueLabels = issue.labels ?? [];
    requireArray(issueLabels, "issue labels");
    if (issueLabels.some((name) => typeof name !== "string" || name === "")) {
      throw new Error("each issue label must be a non-empty string");
    }
    for (const group of GROUPS) {
      const found = issueLabels.filter((name) => String(name).startsWith(group.prefix));
      if (found.length > group.max) conflicts.push({ issue: issue.id, group: group.name, labels: found });
      if (found.length < group.min) missing.push({ issue: issue.id, group: group.name });
    }
    const prerequisites = issue.prerequisites ?? [];
    if (prerequisites.some((item) => item.complete !== true)) {
      blocked.push({ issue: issue.id, reason: "a prerequisite is not complete" });
    }
  }
  return {
    mode: apply ? "apply" : "dry-run",
    instruction: apply
      ? "You may create only the labels in creates. Do not change an existing label. Do not remove a label. Do not change protection, settings or infrastructure."
      : "Do not create labels. This is a dry run.",
    creates,
    updates: [],
    removes: [],
    differs,
    kept,
    unsupported,
    conflicts,
    missing,
    blocked,
    ownerGated: OWNER_GATED,
  };
}

function gh(args) {
  const result = spawnSync("gh", args, { encoding: "utf8" });
  if (result.error) {
    throw new Error("The tracker client is not available. Discovery did not run.");
  }
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function parseJson(text, name) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Discovery did not run. The ${name} result is not JSON.`);
  }
}

function probe(ghRun, args, allow) {
  const result = ghRun(args);
  if (result.status === 0) return true;
  return Boolean(allow && allow.test(result.stderr ?? ""));
}

export function discoverTracker({ ghRun = gh } = {}) {
  const repoResult = ghRun(["repo", "view", "--json", "nameWithOwner,hasIssuesEnabled,defaultBranchRef"]);
  if (repoResult.status !== 0) {
    throw new Error("Discovery did not run. The tracker client could not read the repository.");
  }
  const repo = parseJson(repoResult.stdout, "repository");
  const nwo = repo.nameWithOwner;
  const branch = repo.defaultBranchRef?.name;
  if (typeof nwo !== "string" || nwo === "" || typeof branch !== "string" || branch === "") {
    throw new Error("Discovery did not run. The repository record is incomplete.");
  }
  const issuesOn = repo.hasIssuesEnabled === true;
  const labelResult = ghRun(["label", "list", "--limit", "1000", "--json", "name,color,description"]);
  const labelsOk = labelResult.status === 0;
  const listed = labelsOk ? parseJson(labelResult.stdout, "label list") : [];
  if (!Array.isArray(listed)) throw new Error("Discovery did not run. The label list is not an array.");
  const labels = listed.map((item) => ({
    name: item.name,
    color: String(item.color ?? "").replace(/^#/, ""),
    description: item.description ?? "",
  }));
  const sampleResult = issuesOn
    ? ghRun(["issue", "list", "--state", "all", "--limit", "1", "--json", "number"])
    : { status: 1, stdout: "[]" };
  let sample = null;
  if (sampleResult.status === 0) {
    const parsed = parseJson(sampleResult.stdout, "issue list");
    if (Array.isArray(parsed) && Number.isInteger(parsed[0]?.number)) sample = parsed[0].number;
  }
  return {
    capabilities: {
      issues: issuesOn,
      labels: issuesOn && labelsOk,
      milestones: issuesOn && probe(ghRun, ["api", `repos/${nwo}/milestones`]),
      "parent/sub-issues": sample !== null && probe(ghRun, ["api", `repos/${nwo}/issues/${sample}/sub_issues`]),
      "blocking links": sample !== null && probe(ghRun, ["api", `repos/${nwo}/issues/${sample}/dependencies`]),
      assignment: issuesOn,
      comments: issuesOn,
      "PRs/reviews": probe(ghRun, ["pr", "list", "--limit", "1", "--json", "number"]),
      checks: probe(ghRun, ["api", `repos/${nwo}/commits/${branch}/check-runs`, "--jq", ".total_count"]),
      protection: probe(
        ghRun,
        ["api", `repos/${nwo}/branches/${branch}/protection`],
        /Branch not protected/,
      ),
    },
    labels,
    issues: [],
  };
}

export function createMissingLabels(creates, { ghRun = gh } = {}) {
  const created = [];
  for (const label of creates) {
    const result = ghRun([
      "label", "create", label.name,
      "--color", label.color,
      "--description", label.description,
    ]);
    if (result.status !== 0) {
      throw new Error(`The label create failed for ${label.name}. No further label was created.`);
    }
    created.push(label.name);
  }
  return created;
}

export function executePreflight({ report = null, apply = false, ghRun } = {}) {
  const source = report ?? discoverTracker({ ghRun });
  const plan = planPreflight({ ...source, apply });
  const created = apply ? createMissingLabels(plan.creates, { ghRun }) : [];
  return { ...plan, created };
}

function parseArgs(argv) {
  const apply = argv.includes("--apply");
  const positional = argv.filter((arg) => arg !== "--apply");
  if (positional.length > 1) throw new Error("Use one report file, or no file.");
  return { apply, file: positional[0] };
}

async function main() {
  const { apply, file } = parseArgs(process.argv.slice(2));
  const report = file ? JSON.parse(await readFile(file, "utf8")) : null;
  const plan = executePreflight({ report, apply });
  process.stdout.write(`${JSON.stringify(plan)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
