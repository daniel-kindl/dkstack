#!/usr/bin/env node
// Audit the open issues and the labels of a GitHub repository against the issue rules.
// It reads with gh and never writes. It is not a check:* script, because the result depends
// on the live tracker and not on the files.
// It reports four findings. An issue has no type label or more than one. An issue has no Goal
// or Acceptance criteria heading. A relation is in the body text and the tracker does not have
// it. The repository lacks a type or priority label.
// It reads each page of the open issues and of the labels, so no list is cut off.
// The tool needs Node.js 24 or later and an authenticated gh (GitHub CLI).
// Usage: node scripts/audit-issues.mjs <owner/repo>
// Exit code: 0 no finding, 1 findings, 2 usage error or a response that gh could not give.

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// The labels that skills/setup-labels/SKILL.md names.
export const TYPE_LABELS = [
  "type:bug", "type:feature", "type:chore", "type:refactor", "type:docs", "type:research",
];
export const PRIORITY_LABELS = ["priority:p0", "priority:p1", "priority:p2", "priority:p3"];

const labelNames = (issue) => (issue.labels ?? []).map((l) => l.name);

export function typeFindings(issue) {
  const types = labelNames(issue).filter((n) => n.startsWith("type:"));
  const unknown = types.filter((n) => !TYPE_LABELS.includes(n));
  const known = types.filter((n) => TYPE_LABELS.includes(n));
  const findings = unknown.map((n) => `#${issue.number} has ${n}, which is not a dkstack type label`);
  if (known.length === 0) findings.push(`#${issue.number} has no type: label`);
  if (known.length > 1) {
    findings.push(`#${issue.number} has ${known.length} type: labels (${known.join(", ")})`);
  }
  return findings;
}

// Remove HTML comments, fenced code blocks and inline code spans. Text in them is an example.
export function stripExamples(body) {
  return (body ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^[ \t]*\1[`~]*[ \t]*$|(?![\s\S]))/gm, "")
    .replace(/`[^`\n]*`/g, "");
}

// A heading has level 2 or 3. The match ignores the case.
const hasHeading = (body, title) =>
  new RegExp(`^#{2,3}[ \\t]+${title}[ \\t]*$`, "im").test(stripExamples(body));

export function headingFindings(issue) {
  const findings = [];
  if (!hasHeading(issue.body, "Goal")) findings.push(`#${issue.number} has no Goal heading`);
  if (!hasHeading(issue.body, "Acceptance criteria")) {
    findings.push(`#${issue.number} has no Acceptance criteria heading`);
  }
  return findings;
}

// Return the relations that a body writes in text.
export function textRelations(body) {
  const text = stripExamples(body);
  const parent = /Parent:[ \t]*#(\d+)/i.exec(text);
  const blocked = /Blocked by:([^\n]*)/i.exec(text);
  return {
    parent: parent ? Number(parent[1]) : null,
    blockedBy: blocked ? [...blocked[1].matchAll(/#(\d+)/g)].map((m) => Number(m[1])) : [],
    planItem: /Plan item P\d+/i.test(text),
    orderAfter: /Order:[ \t]*after/i.test(text),
  };
}

const hasText = (r) => r.parent !== null || r.blockedBy.length > 0 || r.planItem || r.orderAfter;

// Compare the text relations of an issue with the relations that the tracker has.
// `tracker` is the JSON of: gh issue view <n> --json blockedBy,parent
export function relationFindings(issue, tracker) {
  const text = textRelations(issue.body);
  const n = issue.number;
  const parent = tracker.parent?.number ?? null;
  const blockers = (tracker.blockedBy?.nodes ?? []).map((b) => b.number);
  const findings = [];
  if (text.parent !== null && parent !== text.parent) {
    findings.push(`#${n} writes Parent: #${text.parent} in text, and the tracker ${
      parent === null ? "has no parent" : `parent is #${parent}`}`);
  }
  for (const b of text.blockedBy) {
    if (!blockers.includes(b)) {
      findings.push(`#${n} writes Blocked by: #${b} in text, and the tracker has no blocker #${b}`);
    }
  }
  if (text.planItem && parent === null) {
    findings.push(`#${n} writes Plan item P in text, and the tracker has no parent`);
  }
  if (text.orderAfter && blockers.length === 0) {
    findings.push(`#${n} writes Order: after in text, and the tracker has no blocker`);
  }
  return findings;
}

export function missingLabels(names) {
  return [...TYPE_LABELS, ...PRIORITY_LABELS].filter((l) => !names.includes(l));
}

// The text is the output of gh api --paginate --slurp: a list of pages, each page a list.
// A pull request is also in the issues endpoint. Skip it.
function parsePages(text, valid) {
  const pages = JSON.parse(text);
  if (!Array.isArray(pages) || !pages.every(Array.isArray)) throw new Error("unexpected response shape");
  const items = pages.flat().filter((item) => !(isObject(item) && "pull_request" in item));
  if (!items.every(valid)) throw new Error("unexpected response shape");
  return items;
}

const isObject = (v) => typeof v === "object" && v !== null;
const isIssue = (v) => isObject(v) && Number.isInteger(v.number);
const isLabel = (v) => isObject(v) && typeof v.name === "string";

function result(name, findings, problems) {
  const status = problems.length > 0 ? "NOT RUN" : findings.length > 0 ? "FAIL" : "PASS";
  return { name, status, lines: [...findings, ...problems] };
}

// Run the audit with `gh`, a function that takes an argument list and returns the output text.
// Return one item for each audit: { name, status, lines }.
export function audit(repo, gh) {
  let issues = null;
  let issueError = null;
  try {
    issues = parsePages(
      gh(["api", "--paginate", "--slurp", `repos/${repo}/issues?state=open&per_page=100`]),
      isIssue,
    );
  } catch (error) {
    issueError = [`could not read the open issues: ${error.message}`];
  }
  const items = [];
  const need = issueError ?? [];
  items.push(result("type labels", issues?.flatMap(typeFindings) ?? [], need));
  items.push(result("headings", issues?.flatMap(headingFindings) ?? [], need));

  const relationFindingsAll = [];
  const relationProblems = [...need];
  for (const issue of issues ?? []) {
    if (!hasText(textRelations(issue.body))) continue;
    try {
      const tracker = JSON.parse(
        gh(["issue", "view", String(issue.number), "--repo", repo, "--json", "blockedBy,parent"]),
      );
      if (!isObject(tracker)) throw new Error("unexpected response shape");
      relationFindingsAll.push(...relationFindings(issue, tracker));
    } catch (error) {
      relationProblems.push(`could not read the relations of #${issue.number}: ${error.message}`);
    }
  }
  items.push(result("relations", relationFindingsAll, relationProblems));

  try {
    const labels = parsePages(
      gh(["api", "--paginate", "--slurp", `repos/${repo}/labels?per_page=100`]), isLabel,
    );
    const missing = missingLabels(labels.map((l) => l.name));
    items.push(result("labels", missing.map((l) => `the repository has no label ${l}`), []));
  } catch (error) {
    items.push(result("labels", [], [`could not read the labels: ${error.message}`]));
  }
  return items;
}

// The thin part: run the real gh. Each call is a GET, so gh writes nothing.
function realGh(args) {
  const out = spawnSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (out.error) throw out.error;
  if (out.status !== 0) throw new Error((out.stderr || `gh exited with ${out.status}`).trim());
  return out.stdout;
}

function main() {
  const repo = process.argv[2];
  if (process.argv.length !== 3 || !/^[\w.-]+\/[\w.-]+$/.test(repo ?? "")) {
    console.error("Usage: node scripts/audit-issues.mjs <owner/repo>");
    process.exitCode = 2;
    return;
  }
  const items = audit(repo, realGh);
  for (const item of items) {
    console.log(`${item.status} ${item.name}`);
    for (const line of item.lines) console.log(`  ${line}`);
  }
  if (items.some((i) => i.status === "NOT RUN")) process.exitCode = 2;
  else if (items.some((i) => i.status === "FAIL")) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
