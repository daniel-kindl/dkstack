#!/usr/bin/env node
// Plan a tracker preflight. This command prints a plan. It does not change the tracker.

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

export function planPreflight(input = {}) {
  const capabilities = input.capabilities ?? {};
  if (capabilities === null || typeof capabilities !== "object" || Array.isArray(capabilities)) {
    throw new Error("capabilities must be an object");
  }
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

async function main() {
  const file = process.argv[2];
  const input = file ? JSON.parse(await readFile(file, "utf8")) : {};
  process.stdout.write(`${JSON.stringify(planPreflight(input))}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
