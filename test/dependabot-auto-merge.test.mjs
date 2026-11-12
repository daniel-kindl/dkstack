import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readFile as read } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { makeTree, removeTree } from "./helpers.mjs";

// These tests keep the safety rules of the Dependabot auto-merge workflow. They
// read the workflow text for the trigger, the conditions and the permissions,
// because GitHub evaluates those. They run each "run: |" block with bash and a
// stub gh on PATH, so they prove what the shell does. Other repositories copy
// this file, so it is also the template that coding/dependencies.md points to.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(repoRoot, ".github", "workflows", "dependabot-auto-merge.yml");
const workflow = await readFile(file, "utf8");
const lines = workflow.split("\n");

// Return the text of one job under "jobs:".
function job(name) {
  const start = lines.indexOf(`  ${name}:`);
  assert.notEqual(start, -1, `missing job ${name}`);
  let end = lines.findIndex((l, i) => i > start && /^ {0,2}\S/.test(l));
  if (end === -1) end = lines.length;
  return lines.slice(start, end).join("\n");
}

// Return the text of the step in the job whose "- name:" starts with the prefix.
function step(jobName, prefix) {
  const jobLines = job(jobName).split("\n");
  const start = jobLines.findIndex((l) => l.startsWith(`      - name: ${prefix}`));
  assert.notEqual(start, -1, `missing step "${prefix}" in ${jobName}`);
  let end = jobLines.findIndex((l, i) => i > start && /^ {0,6}\S/.test(l));
  if (end === -1) end = jobLines.length;
  return jobLines.slice(start, end).join("\n");
}

// Return the "run: |" block of a step, without its indent.
function runBlock(stepText) {
  const stepLines = stepText.split("\n");
  const start = stepLines.findIndex((l) => /^ {8}run: \|$/.test(l));
  assert.notEqual(start, -1, "the step must have a run: | block");
  const body = [];
  for (const l of stepLines.slice(start + 1)) {
    if (l.trim() !== "" && !l.startsWith(" ".repeat(10))) break;
    body.push(l.slice(10));
  }
  return body.join("\n");
}

// Return the env: names of a step.
function envNames(stepText) {
  const env = /\n {8}env:\n((?: {10}.*\n?)+)/.exec(stepText);
  assert.ok(env, "the step must have env:");
  return env[1].trimEnd().split("\n").map((l) => l.trim().split(":")[0]);
}

// A stub gh. It logs each call. "gh api .../rules/branches/..." prints the
// RULES JSON through the --jq filter, and "gh pr view" prints the PR JSON
// through the --jq filter, as gh does. Other calls only log.
const STUB = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$GH_LOG"
jqf=""
args=("$@")
for ((i = 0; i < \${#args[@]}; i++)); do
  if [ "\${args[$i]}" = "--jq" ]; then jqf="\${args[$((i + 1))]}"; fi
done
if [ "$1" = api ]; then
  case "$2" in
    */rules/branches/*) printf '%s' "$STUB_RULES" | jq -r "$jqf"; exit 0 ;;
  esac
fi
if [ "$1" = pr ] && [ "$2" = view ]; then printf '%s' "$STUB_PR" | jq -r "$jqf"; exit 0; fi
exit 0
`;

const PR_URL = "https://github.com/daniel-kindl/example/pull/7";
const HEAD = "0123456789abcdef0123456789abcdef01234567";
const RULES = JSON.stringify([
  { type: "pull_request", parameters: {} },
  { type: "required_status_checks", parameters: { required_status_checks: [{ context: "validate" }] } },
]);

// Run one run: block with the stub gh. Return { status, calls }.
async function run(script, env) {
  const root = await makeTree({ "bin/gh": STUB, "gh.log": "" });
  try {
    spawnSync("chmod", ["+x", join(root, "bin", "gh")]);
    const result = spawnSync("bash", ["-e", "-o", "pipefail", "-c", script], {
      encoding: "utf8",
      env: {
        PATH: `${join(root, "bin")}:${process.env.PATH}`,
        GH_LOG: join(root, "gh.log"),
        GH_TOKEN: "stub",
        PR_URL,
        REPO: "daniel-kindl/example",
        BASE: "main",
        HEAD_SHA: HEAD,
        ...env,
      },
    });
    const log = await read(join(root, "gh.log"), "utf8");
    return { status: result.status, calls: log.split("\n").filter(Boolean), stderr: result.stderr };
  } finally {
    await removeTree(root);
  }
}

const mergeScript = () => runBlock(step("auto-merge", "Turn on auto-merge"));
const disableScript = () => runBlock(step("disable-auto-merge", "Turn off auto-merge"));
const updates = (...types) => JSON.stringify(types.map((t, i) => ({ dependencyName: `d${i}`, updateType: t })));
const PATCH = "version-update:semver-patch";
const MINOR = "version-update:semver-minor";
const MAJOR = "version-update:semver-major";
const MERGE = `pr merge --auto --squash --match-head-commit ${HEAD} ${PR_URL}`;

test("the workflow starts only on pull_request opened, synchronize and reopened", () => {
  const on = /^on:\n((?: {2,}.*\n)+)/m.exec(workflow);
  assert.ok(on, "the workflow must have an on: block");
  const events = on[1].split("\n").filter((l) => /^ {2}\S/.test(l)).map((l) => l.trim());
  assert.deepEqual(events, ["pull_request:"]);
  assert.match(on[1], /^ {4}types: \[opened, synchronize, reopened\]$/m);
  assert.doesNotMatch(workflow, /pull_request_target|workflow_run/);
});

test("the token reads nothing by default and each job writes only what gh pr merge needs", () => {
  assert.match(workflow, /^permissions: \{\}$/m);
  for (const name of ["auto-merge", "disable-auto-merge"]) {
    const perms = /\n {4}permissions:\n((?: {6}.*\n)+)/.exec(job(name) + "\n");
    assert.ok(perms, `${name} must set its own permissions`);
    assert.deepEqual(perms[1].trimEnd().split("\n").map((l) => l.trim()), [
      "contents: write",
      "pull-requests: write",
    ]);
  }
  assert.doesNotMatch(workflow, /secrets\s*[.[]/);
  assert.doesNotMatch(workflow, /actions\/checkout@/);
});

test("auto-merge runs only for Dependabot, and the disable job only for another actor", () => {
  const cond = (name) => {
    const m = /\n {4}if: (.*)/.exec(job(name));
    assert.ok(m, `${name} must have an if: condition`);
    return m[1].split("&&").map((p) => p.trim()).sort();
  };
  assert.deepEqual(cond("auto-merge"), [
    "github.actor == 'dependabot[bot]'",
    "github.event.pull_request.user.login == 'dependabot[bot]'",
  ]);
  assert.deepEqual(cond("disable-auto-merge"), [
    "github.actor != 'dependabot[bot]'",
    "github.event.pull_request.user.login == 'dependabot[bot]'",
  ]);
});

test("the metadata comes from dependabot/fetch-metadata pinned to a SHA", () => {
  assert.match(step("auto-merge", "Read the Dependabot metadata"),
    /\n {8}id: metadata\n {8}uses: dependabot\/fetch-metadata@[0-9a-f]{40} # v\d+\.\d+\.\d+$/m);
});

test("the merge step starts only for a patch or a minor update and gets its data from env", () => {
  const merge = step("auto-merge", "Turn on auto-merge");
  const condition = /\n {8}if: (.*)/.exec(merge);
  assert.ok(condition, "the merge step must have an if: condition");
  const types = [...condition[1].matchAll(/steps\.metadata\.outputs\.update-type == '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(types.sort(), [MINOR, PATCH]);
  assert.equal(condition[1].split("||").length, 2);
  assert.doesNotMatch(condition[1], /&&|!=|major|contains|startsWith/);
  assert.deepEqual(envNames(merge).sort(), ["BASE", "GH_TOKEN", "HEAD_SHA", "PR_URL", "REPO", "UPDATES"]);
  assert.match(merge, /\n {10}UPDATES: \$\{\{ steps\.metadata\.outputs\.updated-dependencies-json \}\}/);
  assert.match(merge, /\n {10}HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(merge, /\n {10}BASE: \$\{\{ github\.event\.pull_request\.base\.ref \}\}/);
  assert.doesNotMatch(runBlock(merge), /\$\{\{/);
});

for (const state of ["BLOCKED", "BEHIND", "CLEAN", "UNSTABLE"]) {
  test(`with a required checks rule, the job turns on auto-merge in state ${state}`, async () => {
    const r = await run(mergeScript(), {
      STUB_RULES: RULES,
      STUB_PR: JSON.stringify({ mergeStateStatus: state }),
      UPDATES: updates(PATCH, MINOR),
    });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.calls.filter((c) => c.startsWith("pr merge")), [MERGE]);
    assert.ok(r.calls.some((c) => c.startsWith("api repos/daniel-kindl/example/rules/branches/main")));
  });
}

for (const [label, rules] of [
  ["no rule", "[]"],
  ["only a pull request rule", JSON.stringify([{ type: "pull_request", parameters: {} }])],
  ["a required checks rule with no check", JSON.stringify([{ type: "required_status_checks", parameters: { required_status_checks: [] } }])],
]) {
  test(`with ${label} on the base branch, the job fails and does not merge`, async () => {
    const r = await run(mergeScript(), { STUB_RULES: rules, STUB_PR: "{}", UPDATES: updates(PATCH) });
    assert.equal(r.status, 1);
    assert.deepEqual(r.calls.filter((c) => c.startsWith("pr merge")), []);
  });
}

for (const [label, list] of [
  ["a patch and a major update", updates(PATCH, MAJOR)],
  ["a minor update and an update of no type", updates(MINOR, "")],
  ["no update", "[]"],
  ["data that is not a list", "not json"],
]) {
  test(`a group with ${label} does not get auto-merge`, async () => {
    const r = await run(mergeScript(), { STUB_RULES: RULES, STUB_PR: "{}", UPDATES: list });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(r.calls.filter((c) => c.startsWith("pr merge")), []);
  });
}

test("the disable job turns off auto-merge that is on", async () => {
  const r = await run(disableScript(), { STUB_PR: JSON.stringify({ autoMergeRequest: { enabledAt: "x" } }) });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.calls.filter((c) => c.startsWith("pr merge")), [`pr merge --disable-auto ${PR_URL}`]);
});

test("the disable job passes and does nothing when auto-merge is off", async () => {
  const r = await run(disableScript(), { STUB_PR: JSON.stringify({ autoMergeRequest: null }) });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.calls.filter((c) => c.startsWith("pr merge")), []);
  assert.deepEqual(envNames(step("disable-auto-merge", "Turn off auto-merge")).sort(), ["GH_TOKEN", "PR_URL"]);
  // The step has no condition of its own, so the job condition alone decides.
  assert.doesNotMatch(step("disable-auto-merge", "Turn off auto-merge"), /\n {8}if:/);
});

test("the dependencies page tells a new repository to copy this workflow", async () => {
  const page = await readFile(join(repoRoot, "coding", "dependencies.md"), "utf8");
  const section = page.slice(page.indexOf("## Dependabot auto-merge"));
  assert.notEqual(page.indexOf("## Dependabot auto-merge"), -1, "missing section");
  assert.match(section, /\(\.\.\/\.github\/workflows\/dependabot-auto-merge\.yml\)/);
  assert.match(section, /Allow auto-merge/);
});

test("the dependencies page says to allow fetch-metadata when only selected actions run", async () => {
  const page = await readFile(join(repoRoot, "coding", "dependencies.md"), "utf8");
  const section = page.slice(page.indexOf("## Dependabot auto-merge")).replace(/\s+/g, " ");
  assert.match(section, /allows only selected actions/);
  assert.match(section, /`dependabot\/fetch-metadata@\*`/);
});

test("the dependencies page asks for a ruleset and says that a push by another actor turns auto-merge off", async () => {
  const page = await readFile(join(repoRoot, "coding", "dependencies.md"), "utf8");
  const section = page.slice(page.indexOf("## Dependabot auto-merge")).replace(/\s+/g, " ");
  assert.match(section, /Use a ruleset, not a classic branch protection rule/);
  assert.match(section, /turns auto-merge off/);
});
