#!/usr/bin/env node
// Audit the settings of a GitHub repository against the list in
// skills/setup-repo-protection/SKILL.md. The script only reads. It sends GET
// requests with `gh api` and changes no setting.
// It reads the rulesets and the classic branch protection of the default
// branch. A branch rule is met if one of the two sources has it.
// It needs Node.js, gh signed in, and a token with admin read rights.
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
// A file name that no real CODEOWNERS rule names. Only a rule for the folder,
// or for a parent folder, matches it (L1 on #322).
const FOLDER_PROBE = ".github/workflows/\u0001";
// A tag ruleset protects the release tags only if it covers refs/tags/v*.
const RELEASE_TAG_REFS = ["~ALL", "refs/tags/*", "refs/tags/**", "refs/tags/v*"];
const NO_PROTECTION = "no active ruleset and no classic protection on the default branch";
const CLASSIC = "classic branch protection";
const ADMIN_HINT = "The token needs admin rights on the repository";

// Each response is { status: 200, body } or { status, error }. Status 0 means
// that gh did not give an HTTP status.
const readable = (response) => response?.status === 200;
const unreadable = (response) =>
  response?.status ? `HTTP ${response.status}${response.error ? ` (${response.error})` : ""}` : response?.error ?? "no response";
const missingField = (field) => `${field} is not in the response. ${ADMIN_HINT}`;

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

// GitHub leaves out the merge fields when the token has no admin rights (H1 on #322).
function repoItems(repo) {
  const squash = "Squash merge only";
  const squashExpected = "squash on, merge commit off, rebase off";
  const del = "Delete branch on merge";
  if (!readable(repo)) {
    return [notRun(squash, squashExpected, unreadable(repo)), notRun(del, "on", unreadable(repo))];
  }
  const r = repo.body;
  const onOff = (value) => (value ? "on" : "off");
  const fields = ["allow_squash_merge", "allow_merge_commit", "allow_rebase_merge"];
  const absent = fields.find((f) => typeof r[f] !== "boolean");
  const found = `squash ${onOff(r.allow_squash_merge)}, merge commit ${onOff(r.allow_merge_commit)}, rebase ${onOff(r.allow_rebase_merge)}`;
  return [
    absent ? notRun(squash, squashExpected, missingField(absent)) : item(squash, squashExpected, found === squashExpected, found),
    typeof r.delete_branch_on_merge !== "boolean"
      ? notRun(del, "on", missingField("delete_branch_on_merge"))
      : item(del, "on", r.delete_branch_on_merge, onOff(r.delete_branch_on_merge)),
  ];
}

const classicChecks = (c) => [...new Set([...(c.required_status_checks?.contexts ?? []),
  ...(c.required_status_checks?.checks ?? []).map((k) => k.context)])];

// Each branch rule: [name, expected, ruleset rule test, classic protection test].
// A test returns a found text when the rule is met, or undefined.
const BRANCH_RULES = [
  ["Pull request required", "a pull_request rule",
    (r) => r.type === "pull_request" ? "" : undefined,
    (c) => c.required_pull_request_reviews ? "" : undefined],
  ["Required status checks", "a required status check",
    (r) => {
      const checks = r.type === "required_status_checks" ? (r.parameters?.required_status_checks ?? []) : [];
      return checks.length > 0 ? `: ${checks.map((k) => k.context).join(", ")}` : undefined;
    },
    (c) => classicChecks(c).length > 0 ? `: ${classicChecks(c).join(", ")}` : undefined],
  ["Required linear history", "a required_linear_history rule",
    (r) => r.type === "required_linear_history" ? "" : undefined,
    (c) => c.required_linear_history?.enabled === true ? "" : undefined],
  ["No force-push", "a non_fast_forward rule",
    (r) => r.type === "non_fast_forward" ? "" : undefined,
    (c) => c.allow_force_pushes?.enabled === false ? "" : undefined],
  ["No branch deletion", "a deletion rule",
    (r) => r.type === "deletion" ? "" : undefined,
    (c) => c.allow_deletions?.enabled === false ? "" : undefined],
];
const CODE_OWNER_RULE = ["Code owner review required", "code owner review required on the default branch",
  (r) => r.type === "pull_request" && r.parameters?.require_code_owner_review === true ? "" : undefined,
  (c) => c.required_pull_request_reviews?.require_code_owner_reviews === true ? "" : undefined];
const BYPASS = "No bypass for administrators";
const BYPASS_EXPECTED = "no bypass actor in a default branch ruleset, and enforce_admins on in classic protection";

// Read the two sources of branch rules: rulesets and classic branch protection (M1 on #322).
function branchSources(rulesets, classic, defaultBranch) {
  const sets = readable(rulesets)
    ? rulesets.body.filter((s) => s.target === "branch" && s.enforcement === "active" && onDefaultBranch(s, defaultBranch))
    : [];
  let classicState = "unreadable";
  if (readable(classic)) classicState = "on";
  else if (classic?.status === 404 && /Branch not protected/.test(classic.error ?? "")) classicState = "none";
  const errors = [];
  if (!readable(rulesets)) errors.push(unreadable(rulesets));
  if (classicState === "unreadable") errors.push(`${CLASSIC}: ${unreadable(classic)}`);
  const none = readable(rulesets) && sets.length === 0 && classicState === "none";
  return { sets, classic: classicState === "on" ? classic.body : undefined, errors, none };
}

function branchItem(src, [name, expected, rulesetTest, classicTest]) {
  const found = [];
  for (const set of src.sets) {
    for (const rule of set.rules ?? []) {
      const text = rulesetTest(rule);
      if (text !== undefined) found.push(`${set.name}${text}`);
    }
  }
  const classicText = src.classic ? classicTest(src.classic) : undefined;
  if (classicText !== undefined) found.push(`${CLASSIC}${classicText}`);
  if (found.length > 0) return item(name, expected, true, found.join("; "));
  if (src.errors.length > 0) return notRun(name, expected, src.errors.join("; "));
  return item(name, expected, false, src.none ? NO_PROTECTION : "no rule");
}

function bypassItem(src) {
  const hidden = src.sets.find((s) => !Array.isArray(s.bypass_actors));
  const actors = src.sets.filter((s) => Array.isArray(s.bypass_actors)).flatMap((s) => s.bypass_actors.map((a) =>
    `${s.name}: ${a.actor_type} ${a.actor_id ?? ""} (${a.bypass_mode})`.replace("  ", " ")));
  const admins = src.classic?.enforce_admins?.enabled;
  if (admins === false) actors.push(`${CLASSIC}: enforce_admins off`);
  if (actors.length > 0) return item(BYPASS, BYPASS_EXPECTED, false, actors.join("; "));
  const errors = [...src.errors];
  if (hidden) errors.push(missingField(`bypass_actors of ${hidden.name}`));
  if (src.classic && admins !== true) errors.push(missingField(`${CLASSIC} enforce_admins`));
  if (errors.length > 0) return notRun(BYPASS, BYPASS_EXPECTED, errors.join("; "));
  return item(BYPASS, BYPASS_EXPECTED, !src.none, src.none ? NO_PROTECTION : "none");
}

const coversReleaseTags = (s) => {
  const refs = s.conditions?.ref_name ?? {};
  return (refs.include ?? []).some((r) => RELEASE_TAG_REFS.includes(r))
    && !(refs.exclude ?? []).some((r) => RELEASE_TAG_REFS.includes(r));
};

function tagItem(rulesets) {
  const name = "Release tags blocked from update and deletion";
  const expected = "an active tag ruleset on refs/tags/v* with update and deletion rules";
  if (!readable(rulesets)) return notRun(name, expected, unreadable(rulesets));
  const tagSets = rulesets.body.filter((s) => s.target === "tag" && s.enforcement === "active");
  if (tagSets.length === 0) return item(name, expected, false, "no active tag ruleset");
  const good = tagSets.find((s) => {
    const types = (s.rules ?? []).map((r) => r.type);
    return coversReleaseTags(s) && types.includes("update") && types.includes("deletion");
  });
  const found = (good ? [good] : tagSets).map((s) => {
    const refs = (s.conditions?.ref_name?.include ?? []).join(", ") || "no refs";
    return `${s.name}: ${refs}: ${(s.rules ?? []).map((r) => r.type).join(", ")}`;
  });
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
// The default file stands for each file in .github/workflows/.
// In CODEOWNERS the last match wins, and a match with no owner removes the owner.
export function codeownersRule(text, file = FOLDER_PROBE) {
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
export function auditSettings({ repo, rulesets, classic, privateReporting, files }) {
  const defaultBranch = readable(repo) ? repo.body.default_branch : undefined;
  const src = branchSources(rulesets, classic, defaultBranch);
  return [
    ...repoItems(repo),
    ...BRANCH_RULES.map((rule) => branchItem(src, rule)),
    bypassItem(src),
    tagItem(rulesets),
    ...securityItems(repo, privateReporting),
    ...fileItems(files, repo),
    branchItem(src, CODE_OWNER_RULE),
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
  const branch = readable(repo) ? repo.body?.default_branch : undefined;
  let classic = repo;
  if (branch) classic = get(`${base}/branches/${encodeURIComponent(branch)}/protection`);
  else if (readable(repo)) classic = { status: 0, error: "the repository has no default_branch" };
  const privateReporting = get(`${base}/private-vulnerability-reporting`);
  const files = {};
  for (const path of [...SECURITY_PATHS, ...CODEOWNERS_PATHS]) {
    const response = get(`${base}/contents/${path}`);
    files[path] = readable(response)
      ? { status: 200, body: Buffer.from(response.body?.content ?? "", "base64").toString("utf8") }
      : response;
  }
  return { repo, rulesets, classic, privateReporting, files };
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
