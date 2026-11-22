#!/usr/bin/env node
// Audit the settings of a GitHub repository against the list in
// skills/setup-repo-protection/SKILL.md. The script only reads. It sends GET
// requests with `gh api` and changes no setting.
// The owner runs it. A CI token cannot read the bypass list, so it is not a
// check:* script and the validate workflow does not run it.
// Usage: node scripts/audit-settings.mjs <owner/repo>
// Exit 0: each item passes. Exit 1: an item fails.
// Exit 2: a usage error, or an item is NOT RUN because a response is not readable.

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const SECURITY_PATHS = ["SECURITY.md", ".github/SECURITY.md", "docs/SECURITY.md"];
// GitHub uses the first CODEOWNERS file it finds, in this order.
export const CODEOWNERS_PATHS = [".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"];
const WORKFLOW_FILE = ".github/workflows/validate.yml";
const NO_DEFAULT_RULESET = "no active ruleset on the default branch";
const ADMIN_HINT = "The token needs admin rights on the repository";

// Each response is { status: 200, body } or { status, error }. Status 0 means
// that gh did not give an HTTP status.
const readable = (response) => response?.status === 200;
const unreadable = (response) =>
  response?.status ? `HTTP ${response.status}${response.error ? ` (${response.error})` : ""}` : response?.error ?? "no response";

function item(name, expected, pass, found) {
  return { name, status: pass ? "PASS" : "FAIL", expected, found };
}

function notRun(name, expected, found) {
  return { name, status: "NOT RUN", expected, found };
}

// Return true if a ruleset condition includes the default branch and does not exclude it.
function onDefaultBranch(ruleset, defaultBranch) {
  const refs = ruleset.conditions?.ref_name;
  if (!refs) return false;
  const names = new Set(["~DEFAULT_BRANCH"]);
  if (defaultBranch) names.add(`refs/heads/${defaultBranch}`);
  const included = (refs.include ?? []).some((ref) => ref === "~ALL" || names.has(ref));
  const excluded = (refs.exclude ?? []).some((ref) => names.has(ref));
  return included && !excluded;
}

function repoItems(repo) {
  const squash = "Squash merge only";
  const squashExpected = "squash on, merge commit off, rebase off";
  const del = "Delete branch on merge";
  if (!readable(repo)) {
    return [notRun(squash, squashExpected, unreadable(repo)), notRun(del, "on", unreadable(repo))];
  }
  const r = repo.body;
  const onOff = (value) => (value ? "on" : "off");
  const found = `squash ${onOff(r.allow_squash_merge)}, merge commit ${onOff(r.allow_merge_commit)}, rebase ${onOff(r.allow_rebase_merge)}`;
  return [
    item(squash, squashExpected, found === squashExpected, found),
    item(del, "on", r.delete_branch_on_merge === true, onOff(r.delete_branch_on_merge)),
  ];
}

const BRANCH_RULES = [
  ["Pull request required", "pull_request", "a pull_request rule"],
  ["Required status checks", "required_status_checks", "a required_status_checks rule with at least one check"],
  ["Required linear history", "required_linear_history", "a required_linear_history rule"],
  ["No force-push", "non_fast_forward", "a non_fast_forward rule"],
  ["No branch deletion", "deletion", "a deletion rule"],
];
const BYPASS = "No bypass for administrators";
const BYPASS_EXPECTED = "no bypass actor in a default branch ruleset";

function countsAsRule(rule) {
  if (rule.type !== "required_status_checks") return true;
  return (rule.parameters?.required_status_checks ?? []).length > 0;
}

function branchItems(rulesets, defaultBranch) {
  if (!readable(rulesets)) {
    return [...BRANCH_RULES.map(([name, , expected]) => notRun(name, expected, unreadable(rulesets))),
      notRun(BYPASS, BYPASS_EXPECTED, unreadable(rulesets))];
  }
  const active = rulesets.body.filter((s) => s.target === "branch" && s.enforcement === "active"
    && onDefaultBranch(s, defaultBranch));
  if (active.length === 0) {
    return [...BRANCH_RULES.map(([name, , expected]) => item(name, expected, false, NO_DEFAULT_RULESET)),
      item(BYPASS, BYPASS_EXPECTED, false, NO_DEFAULT_RULESET)];
  }
  const items = BRANCH_RULES.map(([name, type, expected]) => {
    const found = [];
    for (const set of active) {
      for (const rule of set.rules ?? []) {
        if (rule.type !== type || !countsAsRule(rule)) continue;
        const checks = (rule.parameters?.required_status_checks ?? []).map((c) => c.context);
        found.push(checks.length > 0 ? `${set.name}: ${checks.join(", ")}` : set.name);
      }
    }
    return item(name, expected, found.length > 0, found.length > 0 ? found.join("; ") : "no rule");
  });
  const hidden = active.find((s) => !Array.isArray(s.bypass_actors));
  if (hidden) {
    items.push(notRun(BYPASS, BYPASS_EXPECTED,
      `bypass_actors of ${hidden.name} is not in the response. ${ADMIN_HINT}`));
    return items;
  }
  const actors = active.flatMap((s) => s.bypass_actors.map((a) =>
    `${s.name}: ${a.actor_type} ${a.actor_id ?? ""} (${a.bypass_mode})`.replace("  ", " ")));
  items.push(item(BYPASS, BYPASS_EXPECTED, actors.length === 0, actors.length > 0 ? actors.join("; ") : "none"));
  return items;
}

function tagItem(rulesets) {
  const name = "Release tags blocked from update and deletion";
  const expected = "an active tag ruleset with update and deletion rules";
  if (!readable(rulesets)) return notRun(name, expected, unreadable(rulesets));
  const tagSets = rulesets.body.filter((s) => s.target === "tag" && s.enforcement === "active");
  if (tagSets.length === 0) return item(name, expected, false, "no active tag ruleset");
  const good = tagSets.find((s) => {
    const types = (s.rules ?? []).map((r) => r.type);
    return types.includes("update") && types.includes("deletion");
  });
  const found = (good ? [good] : tagSets).map((s) => `${s.name}: ${(s.rules ?? []).map((r) => r.type).join(", ")}`);
  return item(name, expected, Boolean(good), found.join("; "));
}

function securityItems(repo, privateReporting) {
  const items = [];
  for (const [name, key] of [["Secret scanning", "secret_scanning"], ["Push protection", "secret_scanning_push_protection"]]) {
    if (!readable(repo)) {
      items.push(notRun(name, "enabled", unreadable(repo)));
      continue;
    }
    const status = repo.body.security_and_analysis?.[key]?.status;
    if (status === undefined) {
      items.push(notRun(name, "enabled", `security_and_analysis.${key} is not in the response. ${ADMIN_HINT}`));
      continue;
    }
    items.push(item(name, "enabled", status === "enabled", status));
  }
  const pvr = "Private vulnerability reporting";
  if (!readable(privateReporting)) items.push(notRun(pvr, "on", unreadable(privateReporting)));
  else items.push(item(pvr, "on", privateReporting.body?.enabled === true, privateReporting.body?.enabled ? "on" : "off"));
  return items;
}

// Return { path, text } of the first file that exists. If no file exists,
// return { error } when a response is not readable, or else { missing: true }.
function firstFile(files, paths) {
  let error;
  for (const path of paths) {
    const response = files[path];
    if (readable(response)) return { path, text: response.body };
    if (response?.status !== 404) error ??= `${path}: ${unreadable(response)}`;
  }
  return error ? { error } : { missing: true };
}

function joinPaths(paths) {
  return `${paths.slice(0, -1).join(", ")} or ${paths.at(-1)}`;
}

// A 404 for a file means a missing file only if the repository is readable.
function fileItems(files, repo) {
  const items = [];
  const secName = "SECURITY.md";
  const secExpected = `a file at ${joinPaths(SECURITY_PATHS)}`;
  const ownName = "CODEOWNERS covers .github/workflows/";
  const ownExpected = "a CODEOWNERS rule with an owner for .github/workflows/";
  if (!readable(repo)) {
    return [notRun(secName, secExpected, unreadable(repo)), notRun(ownName, ownExpected, unreadable(repo))];
  }
  const sec = firstFile(files, SECURITY_PATHS);
  if (sec.error) items.push(notRun(secName, secExpected, sec.error));
  else items.push(item(secName, secExpected, !sec.missing, sec.missing ? `no file at ${joinPaths(SECURITY_PATHS)}` : sec.path));

  const own = firstFile(files, CODEOWNERS_PATHS);
  if (own.error) {
    items.push(notRun(ownName, ownExpected, own.error));
  } else if (own.missing) {
    items.push(item(ownName, ownExpected, false, `no CODEOWNERS file at ${joinPaths(CODEOWNERS_PATHS)}`));
  } else {
    const rule = codeownersRule(own.text);
    items.push(item(ownName, ownExpected, rule !== undefined,
      rule !== undefined ? `${own.path}: ${rule}` : `${own.path}: no rule with an owner covers .github/workflows/`));
  }
  return items;
}

// Convert a CODEOWNERS pattern (gitignore syntax) to a regular expression.
function patternRegex(pattern) {
  const anchored = pattern.startsWith("/") || pattern.slice(0, -1).includes("/");
  let p = pattern.replace(/^\//, "");
  const dir = p.endsWith("/");
  if (dir) p = p.slice(0, -1);
  let re = "";
  for (let i = 0; i < p.length; i += 1) {
    if (p[i] === "*" && p[i + 1] === "*") {
      re += ".*";
      i += 1;
    } else if (p[i] === "*") re += "[^/]*";
    else if (p[i] === "?") re += "[^/]";
    else re += p[i].replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${anchored ? "^" : "(^|/)"}${re}${dir ? "/" : "(/|$)"}`);
}

// Return the last CODEOWNERS line that matches the file, if it names an owner.
// In CODEOWNERS the last match wins, and a match with no owner removes the owner.
export function codeownersRule(text, file = WORKFLOW_FILE) {
  let last;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    if (patternRegex(pattern).test(file)) last = owners.length > 0 ? line : undefined;
  }
  return last;
}

// Compare the API responses with the list in setup-repo-protection. Return one
// item for each setting: { name, status: PASS | FAIL | NOT RUN, expected, found }.
export function auditSettings({ repo, rulesets, privateReporting, files }) {
  const defaultBranch = readable(repo) ? repo.body.default_branch : undefined;
  return [
    ...repoItems(repo),
    ...branchItems(rulesets, defaultBranch),
    tagItem(rulesets),
    ...securityItems(repo, privateReporting),
    ...fileItems(files, repo),
  ];
}

export function formatReport(items) {
  const lines = [];
  for (const i of items) {
    lines.push(`${i.status.padEnd(9)}${i.name}`);
    if (i.status !== "PASS") lines.push(`         expected: ${i.expected}`, `         found: ${i.found}`);
  }
  const count = (status) => items.filter((i) => i.status === status).length;
  lines.push("", `${count("PASS")} pass, ${count("FAIL")} fail, ${count("NOT RUN")} not run.`);
  return `${lines.join("\n")}\n`;
}

// Send one GET request with gh. Return { status: 200, body } or { status, error }.
export function ghGet(path) {
  const run = spawnSync("gh", ["api", "--method", "GET", path], { encoding: "utf8" });
  if (run.error) return { status: 0, error: `gh failed: ${run.error.message}` };
  if (run.status !== 0) {
    const match = /HTTP (\d{3})/.exec(run.stderr);
    return { status: match ? Number(match[1]) : 0, error: run.stderr.trim() };
  }
  try {
    return { status: 200, body: JSON.parse(run.stdout) };
  } catch {
    return { status: 0, error: "gh gave a response that is not JSON" };
  }
}

// Read all responses that auditSettings needs. get(path) sends one GET request.
export function fetchSettings(repoName, get = ghGet) {
  const base = `repos/${repoName}`;
  const repo = get(base);
  let rulesets = get(`${base}/rulesets?per_page=100`);
  if (readable(rulesets)) {
    const details = rulesets.body.map((s) => get(`${base}/rulesets/${s.id}`));
    rulesets = details.find((d) => !readable(d)) ?? { status: 200, body: details.map((d) => d.body) };
  }
  const privateReporting = get(`${base}/private-vulnerability-reporting`);
  const files = {};
  for (const path of [...SECURITY_PATHS, ...CODEOWNERS_PATHS]) {
    const response = get(`${base}/contents/${path}`);
    files[path] = readable(response)
      ? { status: 200, body: Buffer.from(response.body?.content ?? "", "base64").toString("utf8") }
      : response;
  }
  return { repo, rulesets, privateReporting, files };
}

function main(args) {
  if (args.length !== 1 || !/^[\w.-]+\/[\w.-]+$/.test(args[0])) {
    console.error("usage: node scripts/audit-settings.mjs <owner/repo>");
    process.exitCode = 2;
    return;
  }
  const items = auditSettings(fetchSettings(args[0]));
  process.stdout.write(`Audit of ${args[0]}\n${formatReport(items)}`);
  if (items.some((i) => i.status === "FAIL")) process.exitCode = 1;
  else if (items.some((i) => i.status === "NOT RUN")) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
