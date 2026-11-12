import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// These tests read the text of the Dependabot auto-merge workflow. They do not
// parse YAML and they do not run the workflow. They keep its safety rules: only
// Dependabot starts it, the token has the smallest scope, only a patch or a
// minor update gets auto-merge, and the required checks of the base branch
// still gate the merge. Other repositories copy this file, so it is also the
// template that coding/dependencies.md points to.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(repoRoot, ".github", "workflows", "dependabot-auto-merge.yml");
const workflow = await readFile(file, "utf8");
const lines = workflow.split("\n");

// Return the text of the step whose "- name:" line starts with the prefix.
function step(prefix) {
  const start = lines.findIndex((l) => l.startsWith(`      - name: ${prefix}`));
  assert.notEqual(start, -1, `missing step "${prefix}"`);
  let end = lines.findIndex((l, i) => i > start && /^ {0,6}\S|^ {6}- /.test(l));
  if (end === -1) end = lines.length;
  return lines.slice(start, end).join("\n");
}

test("the workflow starts only on pull_request, not pull_request_target", () => {
  const on = /^on:\n((?: {2,}.*\n)+)/m.exec(workflow);
  assert.ok(on, "the workflow must have an on: block");
  const events = on[1].split("\n").filter((l) => /^ {2}\S/.test(l)).map((l) => l.trim());
  assert.deepEqual(events, ["pull_request:"]);
  assert.doesNotMatch(workflow, /pull_request_target|workflow_run/);
});

test("the token reads nothing by default and the job writes only what the merge needs", () => {
  assert.match(workflow, /^permissions: \{\}$/m);
  const perms = /^ {4}permissions:\n((?: {6}.*\n)+)/m.exec(workflow);
  assert.ok(perms, "the job must set its own permissions");
  assert.deepEqual(perms[1].trimEnd().split("\n").map((l) => l.trim()), [
    "contents: write",
    "pull-requests: write",
  ]);
  assert.doesNotMatch(workflow, /secrets\s*[.[]/);
  assert.doesNotMatch(workflow, /actions\/checkout@/);
});

test("the job runs only when Dependabot opened the pull request and sent the event", () => {
  const condition = /^ {4}if: (.*)$/m.exec(workflow);
  assert.ok(condition, "the job must have an if: condition");
  const parts = condition[1].split("&&").map((p) => p.trim());
  assert.deepEqual(parts.sort(), [
    "github.actor == 'dependabot[bot]'",
    "github.event.pull_request.user.login == 'dependabot[bot]'",
  ]);
});

test("the metadata comes from dependabot/fetch-metadata pinned to a SHA", () => {
  assert.match(step("Read the Dependabot metadata"),
    /\n {8}id: metadata\n {8}uses: dependabot\/fetch-metadata@[0-9a-f]{40} # v\d+\.\d+\.\d+$/m);
});

test("only a patch or a minor update gets auto-merge, so a major update waits", () => {
  const merge = step("Turn on auto-merge");
  const condition = /\n {8}if: (.*)/.exec(merge);
  assert.ok(condition, "the merge step must have an if: condition");
  const types = [...condition[1].matchAll(/steps\.metadata\.outputs\.update-type == '([^']+)'/g)]
    .map((m) => m[1]);
  assert.deepEqual(types.sort(), ["version-update:semver-minor", "version-update:semver-patch"]);
  assert.deepEqual(condition[1].split("||").length, 2);
  assert.doesNotMatch(condition[1], /&&|!=|major|contains|startsWith/);
});

test("the job turns on auto-merge only when a base branch rule blocks the merge", () => {
  const merge = step("Turn on auto-merge");
  const run = merge.slice(merge.indexOf("run: |"));
  // gh merges at once when nothing blocks the pull request. So the only gh pr
  // merge call is in the branch for BLOCKED and BEHIND, and each other state fails.
  const calls = run.split("\n").filter((l) => l.includes("gh pr merge"));
  assert.deepEqual(calls.map((l) => l.trim()), [
    'BLOCKED | BEHIND) gh pr merge --auto --squash "$PR_URL" ;;',
  ]);
  assert.match(run, /\n\s+\*\) .*exit 1 ;;/);
  assert.match(run, /gh pr view "\$PR_URL" --json mergeStateStatus/);
  assert.match(merge, /\n {10}PR_URL: \$\{\{ github\.event\.pull_request\.html_url \}\}/);
  assert.match(merge, /\n {10}GH_TOKEN: \$\{\{ github\.token \}\}/);
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
