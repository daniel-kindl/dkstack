import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// These tests read the workflow text. They do not parse YAML, as
// scripts/check-workflows.mjs does not. They keep the safety rules of
// issue #135 in the file: the approval gate, the token scope, the order of
// the steps and no force. They do not run the workflow.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const release = await readFile(join(repoRoot, ".github/workflows/release.yml"), "utf8");

// Return the text of one job under "jobs:".
function job(name) {
  const lines = release.split("\n");
  const start = lines.indexOf(`  ${name}:`);
  assert.notEqual(start, -1, `missing job ${name}`);
  let end = lines.findIndex((l, i) => i > start && /^ {2}\S/.test(l));
  if (end === -1) end = lines.length;
  return lines.slice(start, end).join("\n");
}

// Return the steps of a job as { text, env, commands }.
function steps(jobText) {
  const parts = jobText.split(/\n(?= {6}- )/).slice(1);
  return parts.map((text) => ({ text, env: /\n {8}env:\n((?: {10}.*\n?)+)/.exec(text)?.[1] ?? "", commands: commands(text) }));
}

// Return the lines of the shell commands (the "run:" blocks), without comments.
function commands(text) {
  const out = [];
  let indent = null;
  for (const line of text.split("\n")) {
    const run = /^(\s*)(?:- )?run:\s*(\|)?(.*)$/.exec(line);
    if (run) {
      if (run[2]) indent = run[1].length;
      else out.push(run[3]);
      continue;
    }
    if (indent !== null) {
      if (line.trim() !== "" && line.search(/\S/) <= indent) indent = null;
      else if (!/^\s*#/.test(line)) out.push(line.trim());
    }
  }
  return out.filter((l) => l !== "");
}

// Return the sorted scopes of the "permissions:" block of a job.
function scopes(jobText) {
  const block = /^ {4}permissions:\n((?: {6}.*\n)+)/m.exec(`${jobText}\n`);
  assert.ok(block, "the job sets permissions");
  return block[1].split("\n").filter(Boolean).map((l) => l.replace(/#.*/, "").trim()).sort();
}

const plan = job("plan");
const write = job("release");
const writeLines = commands(write);

test("release starts only by hand, on main, with the bump input", () => {
  assert.match(release, /^on:\n  workflow_dispatch:\n    inputs:\n      bump:\n/m);
  assert.doesNotMatch(release, /^  (push|pull_request|pull_request_target|schedule|workflow_run):/m);
  assert.match(release, /options: \[auto, patch, minor\]/);
  assert.ok(commands(plan).some((l) => /"\$GITHUB_REF" != "refs\/heads\/main"/.test(l)), "plan stops unless on main");
});

test("the plan job is read-only, has no environment and writes nothing", () => {
  assert.match(release, /^permissions:\n  contents: read\n/m);
  assert.deepEqual(scopes(plan), ["contents: read"]);
  assert.doesNotMatch(plan, /^ {4}environment:/m);
  for (const line of commands(plan)) {
    assert.doesNotMatch(line, /git push|git tag|git commit|gh pr |gh release |gh workflow run|gh api .*-X|--method/, line);
  }
});

test("the plan job runs the guard, works out the version and checks the release environment", () => {
  const lines = commands(plan);
  const at = (p) => { const i = lines.findIndex((l) => p.test(l)); assert.notEqual(i, -1, `missing ${p}`); return i; };
  const order = [
    at(/node scripts\/release\.mjs guard --v1 origin\/v1/),
    at(/node scripts\/release\.mjs plan --bump "\$BUMP"/),
    at(/gh api "repos\/\$GITHUB_REPOSITORY\/environments\/release" > /),
    at(/gh api "repos\/\$GITHUB_REPOSITORY\/environments\/release\/deployment-branch-policies" > /),
    at(/node scripts\/release\.mjs environment .* --reviewer daniel-kindl/),
  ];
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.match(plan, /^ {4}outputs:\n {6}version: \$\{\{ steps\.plan\.outputs\.version \}\}$/m);
});

test("the write job needs the plan, runs in the release environment and uses the planned version", () => {
  assert.match(write, /^ {4}needs: plan$/m);
  assert.match(write, /^ {4}environment: release$/m);
  assert.deepEqual(scopes(write), ["actions: write", "contents: write", "pull-requests: write"]);
  const prepare = steps(write).find((s) => s.commands.some((l) => /release\.mjs prepare/.test(l)));
  assert.ok(prepare, "the write job runs prepare");
  assert.match(prepare.env, /VERSION: \$\{\{ needs\.plan\.outputs\.version \}\}/);
  assert.ok(prepare.commands.some((l) => /prepare --bump "\$BUMP" .*--expect "\$VERSION"/.test(l)), "prepare --expect");
});

test("no checkout keeps the token, and only steps with no repository code get it", () => {
  const checkouts = release.split("\n").filter((l) => /uses: actions\/checkout@/.test(l)).length;
  assert.equal(checkouts, 2);
  assert.equal((release.match(/persist-credentials: false/g) ?? []).length, checkouts);
  assert.doesNotMatch(release, /persist-credentials: true/);
  assert.doesNotMatch(release, /^ {4}env:\n(?: {6}.*\n)*? {6}GH_TOKEN:/m, "GH_TOKEN only at step level");
  for (const s of [...steps(plan), ...steps(write)]) {
    if (!/GH_TOKEN:/.test(s.env)) continue;
    for (const line of s.commands) assert.doesNotMatch(line, /\b(node|npm|npx)\b/, `a step with GH_TOKEN runs ${line}`);
  }
  const setup = writeLines.findIndex((l) => /^gh auth setup-git$/.test(l));
  const push = writeLines.findIndex((l) => /git push/.test(l));
  assert.ok(setup !== -1 && setup < push, "gh auth setup-git before the first push");
  for (const s of steps(write)) {
    if (s.commands.some((l) => /git push|gh auth setup-git/.test(l))) assert.match(s.env, /GH_TOKEN:/);
  }
});

test("release never forces a push or a ref", () => {
  for (const line of commands(release)) {
    assert.doesNotMatch(line, /--force|--force-with-lease|\bpush\b.*\s-f\b|\bpush\b.*\s\+\S|"force"|force=true/, line);
    assert.doesNotMatch(line, /--admin|--no-verify|git tag -f|git tag -d|--delete/, line);
  }
});

test("release validates, merges, tags, publishes and moves v1 in this order", () => {
  const at = (pattern) => {
    const i = writeLines.findIndex((l) => pattern.test(l));
    assert.notEqual(i, -1, `missing ${pattern}`);
    return i;
  };
  const order = [
    at(/node scripts\/release\.mjs guard --v1 origin\/v1/),
    at(/node scripts\/release\.mjs prepare --bump "\$BUMP"/),
    at(/^gh auth setup-git$/),
    at(/git push origin "HEAD:refs\/heads\/\$BRANCH"/),
    at(/gh pr create /),
    at(/gh workflow run validate\.yml --ref "\$BRANCH"/),
    at(/gh run watch "\$RUN_ID" --exit-status/),
    at(/gh pr merge "\$PR" --squash --match-head-commit "\$HEAD_SHA"/),
    at(/git tag -a "v\$VERSION" "\$MERGE_SHA"/),
    at(/git push origin "refs\/tags\/v\$VERSION"/),
    at(/gh release create "v\$VERSION" --verify-tag/),
    at(/git push origin "\$MERGE_SHA:refs\/heads\/v1"/),
  ];
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("release checks that main did not move before it merges and before it tags", () => {
  const merge = writeLines.findIndex((l) => /gh pr merge/.test(l));
  const tag = writeLines.findIndex((l) => /git tag -a/.test(l));
  const before = writeLines.slice(0, merge).filter((l) => /git ls-remote .*refs\/heads\/main/.test(l)).length;
  assert.ok(before >= 1, "check main before the merge");
  const parent = writeLines.findIndex((l) => /"\$\(git rev-parse "\$MERGE_SHA\^"\)" != "\$START_SHA"/.test(l));
  const tree = writeLines.findIndex((l) => /"\$\(git rev-parse "\$MERGE_SHA\^\{tree\}"\)" != "\$\(git rev-parse "\$HEAD_SHA\^\{tree\}"\)"/.test(l));
  assert.ok(parent > merge && parent < tag, "check the merge parent before the tag");
  assert.ok(tree > merge && tree < tag, "check the merged tree before the tag");
  assert.ok(writeLines.some((l) => /git merge-base --is-ancestor origin\/v1 "\$MERGE_SHA"/.test(l)), "check fast-forward");
});
