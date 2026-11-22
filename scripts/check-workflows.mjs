#!/usr/bin/env node
// Check the GitHub Actions workflows in .github/workflows:
// - Each action is pinned to a full 40-character commit SHA, with the
//   version in a comment. A tag or a branch can move to other code.
// - The workflow sets top-level permissions, so the token has least privilege.
//   "write-all" is not permitted. A top-level permission cannot be "write".
//   Give a write permission to the one job that needs it.
// - The workflow does not use secrets. The settings file
//   .github/check-workflows.json can allow a secret. Each entry of its
//   "allowedSecrets" list names a workflow file, the environment of the job,
//   the action of the step and the "with:" keys with their secret names.
//   That step may pass "key: ${{ secrets.NAME }}" in its "with:" block only,
//   one key per line. With no settings file, no secret is allowed.
// - The workflow does not pass all secrets: no "secrets: inherit" and no
//   whole "secrets" context in an expression, as in "toJSON(secrets)".
// - The workflow does not use the pull_request_target or workflow_run
//   trigger. Both can run untrusted code with secrets or a write token.
// - A "run:" script has no "${{ github.event.* }}" or "${{ inputs.* }}". The
//   value goes through "env:", so it cannot inject shell code.
// - Each actions/checkout step sets "persist-credentials: false", so the
//   token is not left in .git/config for later steps.
// - Each job sets "timeout-minutes". A job that calls a reusable workflow
//   with "uses:" cannot set it, so the check skips that job.
// - A release or deploy job has an "environment:" key, or it runs
//   "gh release" (not view, list or download), "npm publish" or a tag push.
//   That job needs an "environment:". Its workflow starts only by
//   "workflow_dispatch" and sets "concurrency" at the top level or on each
//   such job. A line of the workflow compares "github.ref" or "GITHUB_REF"
//   with "refs/heads/main", as in a step that stops on a different ref.
// The check reads lines. It does not parse YAML.

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = ".github/workflows";
const SETTINGS = ".github/check-workflows.json";
const USES = /^\s*(?:-\s+)?uses\s*:\s*(["']?)([^"'\s#]+)\1(?:\s+#\s*(.*?))?\s*$/;
const PINNED = /^\S+@[0-9a-f]{40}$/;
const VERSION_COMMENT = /^v?[0-9]+(\.[0-9]+)*\b/;
const PERMISSIONS = /^permissions\s*:/m;
const WRITE_ALL = /^\s*permissions\s*:\s*(["']?)write-all\1\s*(#.*)?$/;
const WRITE = /:\s*(["']?)write\1\s*(?:[,}#]|$)/;
const SECRETS = /\bsecrets\s*[.[]/;
const SETTINGS_MESSAGE =
  'write "allowedSecrets" as a list of entries with the strings "file", "environment" and "action", and a "with" map of key to secret name';
const SECRETS_INHERIT = /^\s*secrets\s*:\s*(["']?)inherit\1\s*(#.*)?$/;
const EXPRESSION = /\$\{\{(.*?)\}\}/g;
const WHOLE_SECRETS = /\bsecrets\b(?!\s*[.[])/;
const TRIGGER = /(?:^|[\s[{,])(pull_request_target|workflow_run)\s*(?=[:,\]}]|$)/g;
const RUN_KEY = /^(\s*)(-\s+)?run\s*:\s*(.*)$/;
const UNSAFE_IN_RUN = /\$\{\{[^}]*\b(?:github\.event\.|inputs\.)/;
const RUN_MESSAGE =
  'do not put "${{ github.event.* }}" or "${{ inputs.* }}" in "run:". Pass the value through "env:"';
const CHECKOUT_ACTION = "actions/checkout@";
const PERSIST_FALSE = /^\s+persist-credentials\s*:\s*(["']?)false\1\s*(#.*)?$/;
const PERSIST_MESSAGE = 'set "persist-credentials: false" in the "with:" block of the checkout step';
const TOP_KEY = /^(["']?)([^"':\s]+)\1\s*:\s*(.*)$/;
const TRIGGER_ITEM = /^ {2}(?:-\s+)?([A-Za-z_]+)/;
const JOB = /^ {2}([^\s#:][^:]*?)\s*:/;
const JOB_KEY = /^ {4}(timeout-minutes|environment|uses|concurrency)\s*:\s*(["']?)([^"'\s#]*)\2/;
const RELEASE_COMMAND =
  /\bgh\s+release\s+(?!view\b|list\b|download\b)\S|\bnpm\s+publish\b|\bgit\s+push\b.*(?:--tags\b|--follow-tags\b|refs\/tags\/)/;
const REF = /\bgithub\.ref\b|\bGITHUB_REF\b/;
const MAIN_REF = /\brefs\/heads\/main\b/;

const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Return the allowed secrets of the settings file, as { allowed, error }.
// With no settings file, no secret is allowed. A file that is not valid
// allows no secret and gives an error.
async function readSettings(root) {
  let text;
  try {
    text = await readFile(join(root, SETTINGS), "utf8");
  } catch {
    return { allowed: [], error: null };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  const list = isMap(data) ? (data.allowedSecrets ?? []) : null;
  const valid =
    Array.isArray(list) &&
    list.every(
      (entry) =>
        isMap(entry) &&
        ["file", "environment", "action"].every((key) => typeof entry[key] === "string") &&
        isMap(entry.with) &&
        Object.values(entry.with).every((secret) => typeof secret === "string"),
    );
  if (!valid) return { allowed: [], error: `${SETTINGS}: ${SETTINGS_MESSAGE}` };
  const allowed = list.map((entry) => ({
    file: entry.file,
    environment: entry.environment,
    action: `${entry.action}@`,
    lines: Object.entries(entry.with).map(
      ([key, secret]) => new RegExp(`^\\s+${escape(key)}: \\$\\{\\{ secrets\\.${escape(secret)} \\}\\}$`),
    ),
  }));
  return { allowed, error: null };
}

// Return { checked, errors }, or null when the folder does not exist.
export async function checkWorkflows(root) {
  let names;
  try {
    names = await readdir(join(root, DIR));
  } catch {
    return null;
  }
  const files = names.filter((n) => /\.ya?ml$/.test(n)).sort();
  const errors = [];
  const settings = await readSettings(root);
  if (settings.error) errors.push(settings.error);
  for (const name of files) {
    const rel = `${DIR}/${name}`;
    const text = await readFile(join(root, DIR, name), "utf8");
    if (!PERMISSIONS.test(text)) {
      errors.push(`${rel}: set top-level permissions, as in "permissions: contents: read"`);
    }
    let inTopPermissions = false;
    // The current top-level key, the triggers and the jobs, for the
    // timeout and the release rules.
    let topKey = "";
    const triggers = [];
    let topConcurrency = false;
    let refCheck = false;
    const jobs = [];
    let job = null;
    // The environment name of the current job, for the allowed secrets.
    let jobEnvironment = "";
    // The state of the current step: its action and its "with:" block.
    let stepUses = "";
    let withIndent = -1;
    // The indent of the "run:" key of the current block script, or -1.
    let runIndent = -1;
    // The current "steps:" list and its current step, for the checkout rule.
    let stepsIndent = -1;
    let step = null;
    const checkWholeSecrets = (line, where) => {
      for (const m of line.matchAll(EXPRESSION)) {
        if (WHOLE_SECRETS.test(m[1])) {
          errors.push(`${where}: do not use the whole secrets context. Name one secret`);
        }
      }
    };
    const endStep = () => {
      if (step && step.uses.startsWith(CHECKOUT_ACTION) && !step.persistFalse) {
        errors.push(`${rel}:${step.usesLine}: ${PERSIST_MESSAGE}`);
      }
      step = null;
    };
    text.split(/\r?\n/).forEach((line, i) => {
      const where = `${rel}:${i + 1}`;
      const lineIndent = line.search(/\S/);
      if (!line.trimStart().startsWith("#")) {
        if (job && RELEASE_COMMAND.test(line)) job.releases = true;
        if (REF.test(line) && MAIN_REF.test(line)) refCheck = true;
      }
      // A line in a block script ("run: |" or "run: >") is shell code, not YAML.
      if (runIndent !== -1 && (lineIndent === -1 || lineIndent > runIndent)) {
        if (UNSAFE_IN_RUN.test(line)) errors.push(`${where}: ${RUN_MESSAGE}`);
        if (SECRETS.test(line)) errors.push(`${where}: do not use secrets in a workflow`);
        checkWholeSecrets(line, where);
        return;
      }
      runIndent = -1;
      const run = RUN_KEY.exec(line);
      if (run) {
        if (/^[|>]/.test(run[3])) runIndent = run[1].length + (run[2]?.length ?? 0);
        else if (UNSAFE_IN_RUN.test(run[3])) errors.push(`${where}: ${RUN_MESSAGE}`);
      }
      if (lineIndent !== -1 && !line.trimStart().startsWith("#")) {
        if (stepsIndent !== -1 && lineIndent <= stepsIndent) {
          endStep();
          stepsIndent = -1;
        }
        if (stepsIndent !== -1 && /^\s+- /.test(line) && (!step || lineIndent <= step.indent)) {
          endStep();
          step = { indent: lineIndent, uses: "", usesLine: 0, persistFalse: false };
        }
        if (/^\s+steps\s*:\s*$/.test(line)) {
          endStep();
          stepsIndent = lineIndent;
        }
        if (step && PERSIST_FALSE.test(line)) step.persistFalse = true;
        const code = line.replace(/(^|\s)#.*$/, "");
        for (const m of code.matchAll(TRIGGER)) {
          errors.push(`${where}: do not use the "${m[1]}" trigger`);
        }
      }
      if (SECRETS_INHERIT.test(line)) {
        errors.push(`${where}: do not use "secrets: inherit". Pass only the secret that the job needs`);
      }
      checkWholeSecrets(line, where);
      if (/^\S/.test(line) && !line.startsWith("#")) {
        inTopPermissions = /^permissions\s*:/.test(line);
        const top = TOP_KEY.exec(line);
        topKey = top?.[2] ?? "";
        job = null;
        jobEnvironment = "";
        if (topKey === "concurrency") topConcurrency = true;
        if (topKey === "on") {
          const value = top[3].replace(/(^|\s)#.*$/, "");
          for (const m of value.matchAll(/[A-Za-z_]+/g)) triggers.push(m[0]);
        }
      }
      const item = topKey === "on" ? TRIGGER_ITEM.exec(line) : null;
      if (item) triggers.push(item[1]);
      const jobStart = topKey === "jobs" ? JOB.exec(line) : null;
      if (jobStart) {
        job = { name: jobStart[1], line: i + 1, timeout: false, environment: false, calls: false };
        job.concurrency = job.releases = false;
        jobs.push(job);
        jobEnvironment = "";
      }
      const jobKey = job ? JOB_KEY.exec(line) : null;
      if (jobKey) {
        const key = { "timeout-minutes": "timeout", uses: "calls" }[jobKey[1]] ?? jobKey[1];
        job[key] = true;
        if (key === "environment") jobEnvironment = jobKey[3];
      }
      const indent = line.search(/\S/);
      if (/^  \S/.test(line)) stepUses = "";
      // A step starts at "- ". A line at the indent of "with:" or less ends
      // the "with:" block.
      if (/^\s+- /.test(line)) stepUses = "";
      if (withIndent !== -1 && indent !== -1 && indent <= withIndent) withIndent = -1;
      if (/^\s+with:\s*$/.test(line)) withIndent = indent;
      if (WRITE_ALL.test(line)) {
        errors.push(`${where}: do not use "permissions: write-all"`);
      } else if (inTopPermissions && WRITE.test(line)) {
        errors.push(`${where}: do not give "write" at the top level; give it to one job`);
      }
      const uses = USES.exec(line);
      if (uses) stepUses = uses[2];
      if (uses && step && !step.uses) {
        step.uses = uses[2];
        step.usesLine = i + 1;
      }
      if (uses && !uses[2].startsWith("./")) {
        if (!PINNED.test(uses[2])) {
          errors.push(`${where}: pin "${uses[2]}" to a full 40-character commit SHA`);
        } else if (!VERSION_COMMENT.test(uses[3] ?? "")) {
          errors.push(`${where}: add the version after the SHA, as in "# v1.2.3"`);
        }
      }
      const appSecret =
        withIndent !== -1 &&
        indent === withIndent + 2 &&
        settings.allowed.some(
          (allow) =>
            allow.file === name &&
            allow.environment === jobEnvironment &&
            stepUses.startsWith(allow.action) &&
            allow.lines.some((re) => re.test(line)),
        );
      if (SECRETS.test(line) && !appSecret) errors.push(`${where}: do not use secrets in a workflow`);
    });
    endStep();
    for (const j of jobs) {
      if (!j.timeout && !j.calls) errors.push(`${rel}:${j.line}: set "timeout-minutes" on the job "${j.name}"`);
    }
    const releaseJobs = jobs.filter((j) => j.environment || j.releases);
    for (const j of releaseJobs) {
      if (!j.environment) {
        errors.push(`${rel}:${j.line}: give the release or deploy job "${j.name}" an "environment:"`);
      }
    }
    if (releaseJobs.length > 0) {
      if (triggers.length === 0 || triggers.some((t) => t !== "workflow_dispatch")) {
        errors.push(`${rel}: start a release or deploy workflow only by "workflow_dispatch"`);
      }
      if (!topConcurrency && !releaseJobs.every((j) => j.concurrency)) {
        errors.push(`${rel}: set "concurrency" in a release or deploy workflow, so that two runs do not overlap`);
      }
      if (!refCheck) {
        errors.push(
          `${rel}: check that the ref is "refs/heads/main" in a release or deploy workflow, and stop on a different ref`,
        );
      }
    }
  }
  return { checked: files.length, errors };
}

async function main() {
  const root = resolve(process.argv[2] ?? ".");
  const result = await checkWorkflows(root);
  if (result === null) {
    console.error(`${DIR}: the folder does not exist.`);
    process.exitCode = 1;
    return;
  }
  if (result.errors.length > 0) {
    for (const message of result.errors) console.error(message);
    process.exitCode = 1;
    return;
  }
  console.log(
    `${result.checked} workflow(s) pass the CI workflow rules. ` +
      `Only the steps that ${SETTINGS} allows use secrets.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
