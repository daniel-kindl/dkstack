import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkWorkflows } from "../scripts/check-workflows.mjs";
import { makeTree, readFile, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-workflows.mjs");
const SHA = "3d3c42e5aac5ba805825da76410c181273ba90b1";

async function workflowsFor(files) {
  const root = await makeTree(files);
  try {
    return await checkWorkflows(root);
  } finally {
    await removeTree(root);
  }
}

// Some tests check one rule with short jobs. The timeout rule is tested below.
const withoutTimeouts = (errors) => errors.filter((e) => !e.includes('"timeout-minutes"'));

const good = [
  "name: validate",
  "on: [pull_request]",
  "permissions:",
  "  contents: read",
  "jobs:",
  "  validate:",
  "    runs-on: ubuntu-latest",
  "    timeout-minutes: 10",
  "    steps:",
  `      - uses: actions/checkout@${SHA} # v7.0.1`,
  "        with:",
  "          persist-credentials: false",
  `      - name: Set up Node`,
  `        uses: "actions/setup-node@${SHA}" # v7.1.0`,
  "      - uses: ./.github/actions/local",
  "      - run: npm test",
  "",
].join("\n");

test("every workflow in the repository passes", async () => {
  const result = await checkWorkflows(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.ok(result.checked > 0, "the check must find workflows in the repository");
});

test("a workflow with SHA pins, version comments and permissions passes", async () => {
  const result = await workflowsFor({ ".github/workflows/a.yml": good });
  assert.deepEqual(result, { checked: 1, errors: [] });
});

test("a tag, a branch or a short SHA fails, and a SHA with no version comment fails", async () => {
  const result = await workflowsFor({
    ".github/workflows/a.yaml": [
      "permissions: {}",
      "jobs:",
      "  a:",
      "    steps:",
      "      - uses: actions/checkout@v7",
      "      - uses: actions/checkout@main # v7",
      "      - uses: actions/checkout@3d3c42e # v7",
      `      - uses: actions/checkout@${SHA.toUpperCase()} # v7`,
      `      - uses: actions/checkout@${SHA}`,
      `      - uses: actions/checkout@${SHA} # main`,
      "      - uses: docker://alpine:3",
      "      - uses: 'actions/checkout@v7'",
      "",
    ].join("\n"),
  });
  // This test checks the pins. The missing persist-credentials lines are tested below.
  const pinErrors = withoutTimeouts(result.errors).filter((e) => !e.includes("persist-credentials"));
  assert.deepEqual(pinErrors, [
    '.github/workflows/a.yaml:5: pin "actions/checkout@v7" to a full 40-character commit SHA',
    '.github/workflows/a.yaml:6: pin "actions/checkout@main" to a full 40-character commit SHA',
    '.github/workflows/a.yaml:7: pin "actions/checkout@3d3c42e" to a full 40-character commit SHA',
    `.github/workflows/a.yaml:8: pin "actions/checkout@${SHA.toUpperCase()}" to a full 40-character commit SHA`,
    '.github/workflows/a.yaml:9: add the version after the SHA, as in "# v1.2.3"',
    '.github/workflows/a.yaml:10: add the version after the SHA, as in "# v1.2.3"',
    '.github/workflows/a.yaml:11: pin "docker://alpine:3" to a full 40-character commit SHA',
    '.github/workflows/a.yaml:12: pin "actions/checkout@v7" to a full 40-character commit SHA',
  ]);
});

test("a workflow with no top-level permissions fails", async () => {
  const result = await workflowsFor({
    ".github/workflows/a.yml": good.replace("permissions:\n  contents: read\n", ""),
    ".github/workflows/b.yml": good.replace("permissions:\n  contents: read\n", "jobs2:\n  permissions:\n    contents: read\n"),
  });
  assert.deepEqual(result.errors, [
    ".github/workflows/a.yml: set top-level permissions, as in \"permissions: contents: read\"",
    ".github/workflows/b.yml: set top-level permissions, as in \"permissions: contents: read\"",
  ]);
});

test("a workflow that uses secrets fails", async () => {
  const result = await workflowsFor({
    ".github/workflows/a.yml": good + "        env:\n          T: ${{ secrets.NPM_TOKEN }}\n          G: ${{secrets['X']}}\n",
  });
  assert.deepEqual(result.errors, [
    ".github/workflows/a.yml:18: do not use secrets in a workflow",
    ".github/workflows/a.yml:19: do not use secrets in a workflow",
  ]);
});

// Daniel decided on 2026-11-11 at 19:06 (Prague) that dkstack releases use
// a GitHub App. Its two secrets are in the release environment. Only the
// release job of release.yml may pass them, and only to the token action.
const appJob = (environment, appId, key, action = "actions/create-github-app-token") => [
  "permissions:",
  "  contents: read",
  "jobs:",
  "  release:",
  ...(environment ? [`    environment: ${environment}`] : []),
  "    runs-on: ubuntu-latest",
  "    steps:",
  `      - uses: ${action}@${SHA} # v3.3.0`,
  "        with:",
  `          app-id: ${appId}`,
  `          private-key: ${key}`,
  "",
].join("\n");
const ID = "${{ secrets.RELEASE_APP_ID }}";
// The settings file that allows the two app secrets, as dkstack has it.
const SETTINGS = JSON.stringify({
  allowedSecrets: [
    {
      file: "release.yml",
      environment: "release",
      action: "actions/create-github-app-token",
      with: { "app-id": "RELEASE_APP_ID", "private-key": "RELEASE_APP_PRIVATE_KEY" },
    },
  ],
});
// These tests check the secret rule only. The release rules are tested below.
const secretErrors = (result) => result.errors.filter((e) => e.endsWith("do not use secrets in a workflow"));
const withSettings = (files) => workflowsFor({ ".github/check-workflows.json": SETTINGS, ...files });
const KEY = "${{ secrets.RELEASE_APP_PRIVATE_KEY }}";

test("the release job may pass the two app secrets to the token action", async () => {
  const result = await withSettings({ ".github/workflows/release.yml": appJob("release", ID, KEY) });
  assert.deepEqual(secretErrors(result), []);
});

test("the app secrets fail in another file, another job or another place", async () => {
  const other = await withSettings({ ".github/workflows/other.yml": appJob("release", ID, KEY) });
  assert.deepEqual(secretErrors(other), [
    ".github/workflows/other.yml:10: do not use secrets in a workflow",
    ".github/workflows/other.yml:11: do not use secrets in a workflow",
  ]);
  const noEnv = await withSettings({ ".github/workflows/release.yml": appJob(null, ID, KEY) });
  assert.deepEqual(secretErrors(noEnv), [
    ".github/workflows/release.yml:9: do not use secrets in a workflow",
    ".github/workflows/release.yml:10: do not use secrets in a workflow",
  ]);
  const prod = await withSettings({ ".github/workflows/release.yml": appJob("production", ID, KEY) });
  assert.equal(secretErrors(prod).length, 2);
  const otherAction = await withSettings({
    ".github/workflows/release.yml": appJob("release", ID, KEY, "someone/token-action"),
  });
  assert.equal(secretErrors(otherAction).length, 2);
  const swapped = await withSettings({ ".github/workflows/release.yml": appJob("release", KEY, ID) });
  assert.equal(secretErrors(swapped).length, 2);
  const otherName = await withSettings({
    ".github/workflows/release.yml": appJob("release", "${{ secrets.NPM_TOKEN }}", KEY),
  });
  assert.deepEqual(secretErrors(otherName), [".github/workflows/release.yml:10: do not use secrets in a workflow"]);
  const inEnv = await withSettings({
    ".github/workflows/release.yml": appJob("release", ID, KEY) + "        env:\n          K: " + KEY + "\n",
  });
  assert.deepEqual(secretErrors(inEnv), [".github/workflows/release.yml:13: do not use secrets in a workflow"]);
  const twoJobs = await withSettings({
    ".github/workflows/release.yml": appJob("release", ID, KEY) + appJob(null, ID, KEY).split("\n").slice(3).join("\n"),
  });
  assert.deepEqual(secretErrors(twoJobs), [
    ".github/workflows/release.yml:17: do not use secrets in a workflow",
    ".github/workflows/release.yml:18: do not use secrets in a workflow",
  ]);
});

// Sentinel's M1 on #143: the exception is for the "with:" block of the app
// token step only. A later step must not get the key in "env:".
const header = ["permissions:", "  contents: read", "jobs:", "  release:", "    environment: release", "    runs-on: ubuntu-latest", "    steps:"];
const appStep = [
  `      - uses: actions/create-github-app-token@${SHA} # v3.3.0`,
  "        id: app",
  "        with:",
  `          app-id: ${ID}`,
  `          private-key: ${KEY}`,
  "          repositories: dkstack",
];
// Return the line numbers with errors for a release.yml of these lines.
const badLines = async (lines, file = "release.yml") => {
  const result = await withSettings({ [`.github/workflows/${file}`]: [...lines, ""].join("\n") });
  return secretErrors(result).map((e) => Number(/:(\d+): do not use secrets in a workflow$/.exec(e)[1]));
};

test("the app secrets pass in the with block of the app step, with other inputs and steps", async () => {
  assert.deepEqual(await badLines([...header, "      - run: npm ci", ...appStep, "          owner: x", "      - run: git push"]), []);
});

test("the app secrets fail in the env of a later run step", async () => {
  const lines = [...header, ...appStep, "      - name: Later", "        env:", `          app-id: ${ID}`, `          private-key: ${KEY}`, "        run: echo hi"];
  assert.deepEqual(await badLines(lines), [16, 17]);
  const noName = [...header, ...appStep, "      - run: echo hi", "        env:", `          private-key: ${KEY}`];
  assert.deepEqual(await badLines(noName), [16]);
});

test("the app secrets fail in the with block of a later step of another action", async () => {
  const lines = [...header, ...appStep, `      - uses: actions/checkout@${SHA} # v7.0.1`, "        with:", `          private-key: ${KEY}`];
  assert.deepEqual(await badLines(lines), [16]);
  const run = [...header, ...appStep, "      - run: echo hi", "        with:", `          app-id: ${ID}`];
  assert.deepEqual(await badLines(run), [16]);
});

test("the app secrets fail in the env of the app step", async () => {
  const lines = [...header, ...appStep, "        env:", `          app-id: ${ID}`, `          private-key: ${KEY}`];
  assert.deepEqual(await badLines(lines), [15, 16]);
});

test("the app secrets fail under another key or as each other", async () => {
  const lines = [...header, ...appStep.slice(0, 3), `          client-id: ${ID}`, `          token: ${KEY}`, `          app-id: ${KEY}`];
  assert.deepEqual(await badLines(lines), [11, 12, 13]);
});

test("the app secrets fail in a step before the app step", async () => {
  const lines = [...header, "      - run: echo hi", "        env:", `          app-id: ${ID}`, ...appStep];
  assert.deepEqual(await badLines(lines), [10]);
});

test("the app secrets fail in another job and in another file", async () => {
  const plan = ["  plan:", "    runs-on: ubuntu-latest", "    steps:", ...appStep];
  assert.deepEqual(await badLines([...header, ...appStep, ...plan]), [20, 21]);
  assert.deepEqual(await badLines([...header, ...appStep], "other.yml"), [11, 12]);
});

test("the app secrets fail in a multi-line or a flow-style form", async () => {
  const folded = [...header, ...appStep.slice(0, 3), "          private-key: >-", `            ${KEY}`];
  assert.deepEqual(await badLines(folded), [12]);
  const flow = [...header, appStep[0], `        with: { app-id: ${ID}, private-key: ${KEY} }`];
  assert.deepEqual(await badLines(flow), [9]);
  const sameLine = [...header, `      - uses: actions/create-github-app-token@${SHA} # v3.3.0`, `        with: {app-id: ${ID}}`];
  assert.deepEqual(await badLines(sameLine), [9]);
});

test("the app secrets fail on a near match, in a nested map or in a later job", async () => {
  const near = [...header, ...appStep.slice(0, 3), `          not-app-id: ${ID}`, `          app-id: ${ID} \${{ secrets.NPM_TOKEN }}`];
  assert.deepEqual(await badLines(near), [11, 12]);
  const nested = [...header, ...appStep.slice(0, 3), "          extra:", `            app-id: ${ID}`];
  assert.deepEqual(await badLines(nested), [12]);
  const laterJob = [...header, ...appStep, "  other:", "    environment: release", "    with:", `      app-id: ${ID}`];
  assert.deepEqual(await badLines(laterJob), [17]);
});

test("only .yml and .yaml files in .github/workflows are checked", async () => {
  const result = await workflowsFor({
    ".github/workflows/notes.md": "uses: actions/checkout@v7\n",
    ".github/other.yml": "uses: actions/checkout@v7\n",
    ".github/workflows/a.yml": good,
  });
  assert.deepEqual(result, { checked: 1, errors: [] });
});

test("the CLI exits 1 for a bad workflow and 0 for a clean tree", async () => {
  const bad = await makeTree({ ".github/workflows/a.yml": good.replace(`@${SHA} # v7.0.1`, "@v7") });
  const clean = await makeTree({ ".github/workflows/a.yml": good });
  try {
    const failRun = spawnSync(process.execPath, [script, bad], { encoding: "utf8" });
    assert.equal(failRun.status, 1);
    assert.equal(
      failRun.stderr,
      '.github/workflows/a.yml:10: pin "actions/checkout@v7" to a full 40-character commit SHA\n',
    );
    const passRun = spawnSync(process.execPath, [script, clean], { encoding: "utf8" });
    assert.equal(passRun.stderr, "");
    assert.equal(passRun.status, 0);
    assert.equal(passRun.stdout, "1 workflow(s) pass the CI workflow rules. Only the steps that .github/check-workflows.json allows use secrets.\n");
  } finally {
    await removeTree(bad);
    await removeTree(clean);
  }
});

test("the CLI fails when the repository has no workflows folder", async () => {
  const root = await makeTree({ "README.md": "x\n" });
  try {
    const run = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    assert.equal(run.status, 1);
    assert.equal(run.stderr, ".github/workflows: the folder does not exist.\n");
  } finally {
    await removeTree(root);
  }
});

test("permissions: write-all fails at the top level and in a job", async () => {
  const result = await workflowsFor({
    ".github/workflows/a.yml": [
      "permissions: write-all",
      "jobs:",
      "  a:",
      "    permissions: write-all",
      "    steps:",
      "      - run: echo",
      "",
    ].join("\n"),
  });
  assert.deepEqual(withoutTimeouts(result.errors), [
    '.github/workflows/a.yml:1: do not use "permissions: write-all"',
    '.github/workflows/a.yml:4: do not use "permissions: write-all"',
  ]);
});

test("a top-level write permission fails, and a job-level write permission passes", async () => {
  const result = await workflowsFor({
    ".github/workflows/a.yml": [
      "permissions:",
      "  contents: read",
      "  pull-requests: write",
      "jobs:",
      "  a:",
      "    permissions:",
      "      issues: write",
      "    steps:",
      "      - run: echo",
      "",
    ].join("\n"),
  });
  assert.deepEqual(withoutTimeouts(result.errors), [
    '.github/workflows/a.yml:3: do not give "write" at the top level; give it to one job',
  ]);
});

test("a top-level flow map with a write permission fails", async () => {
  const result = await workflowsFor({
    ".github/workflows/a.yml": "permissions: { contents: write }\njobs: {}\n",
  });
  assert.deepEqual(result.errors, [
    '.github/workflows/a.yml:1: do not give "write" at the top level; give it to one job',
  ]);
});

// FRG-1 and SEN-5 (#154): a secret can leak without "secrets." or "secrets[".
test("secrets: inherit and the whole secrets context fail", async () => {
  const lines = [
    "permissions:",
    "  contents: read",
    "jobs:",
    "  call:",
    `    uses: someone/repo/.github/workflows/a.yml@${SHA} # v1.0.0`,
    "    secrets: inherit",
    "  a:",
    "    runs-on: ubuntu-latest",
    "    env:",
    "      ALL: ${{ toJSON(secrets) }}",
    "    steps:",
    "      - run: echo '${{ toJson( secrets ) }}'",
    "      - run: echo ok",
    "",
  ];
  const result = await workflowsFor({ ".github/workflows/a.yml": lines.join("\n") });
  assert.deepEqual(withoutTimeouts(result.errors), [
    '.github/workflows/a.yml:6: do not use "secrets: inherit". Pass only the secret that the job needs',
    ".github/workflows/a.yml:10: do not use the whole secrets context. Name one secret",
    ".github/workflows/a.yml:12: do not use the whole secrets context. Name one secret",
  ]);
});

test("the pull_request_target and workflow_run triggers fail", async () => {
  const block = good.replace("on: [pull_request]", "on:\n  pull_request_target:\n  workflow_run:\n    workflows: [a]");
  const list = good.replace("on: [pull_request]", "on: [push, pull_request_target, workflow_run]");
  const result = await workflowsFor({ ".github/workflows/a.yml": block, ".github/workflows/b.yml": list });
  assert.deepEqual(result.errors, [
    '.github/workflows/a.yml:3: do not use the "pull_request_target" trigger',
    '.github/workflows/a.yml:4: do not use the "workflow_run" trigger',
    '.github/workflows/b.yml:2: do not use the "pull_request_target" trigger',
    '.github/workflows/b.yml:2: do not use the "workflow_run" trigger',
  ]);
});

test("a trigger name in a comment or a quoted string passes", async () => {
  const text = good.replace(
    "      - run: npm test",
    "      # Do not use pull_request_target.\n      - if: github.event_name != 'workflow_run'\n        run: npm test",
  );
  const result = await workflowsFor({ ".github/workflows/a.yml": text });
  assert.deepEqual(result.errors, []);
});

const RUN_MESSAGE = 'do not put "${{ github.event.* }}" or "${{ inputs.* }}" in "run:". Pass the value through "env:"';

test("github.event and inputs expressions in a run block fail", async () => {
  const text = good.replace(
    "      - run: npm test",
    [
      '      - run: echo "${{ github.event.pull_request.title }}"',
      "      - run: |",
      "          echo start",
      "          ./x --bump ${{inputs.bump}}",
      "      - run: >-",
      "          echo ${{ github.event.inputs.bump }}",
      "      - name: Safe",
      "        env:",
      "          TITLE: ${{ github.event.pull_request.title }}",
      "          BUMP: ${{ inputs.bump }}",
      '        run: echo "$TITLE $BUMP ${{ github.sha }} ${{ github.event_name }}"',
    ].join("\n"),
  );
  const result = await workflowsFor({ ".github/workflows/a.yml": text });
  assert.deepEqual(result.errors, [
    `.github/workflows/a.yml:16: ${RUN_MESSAGE}`,
    `.github/workflows/a.yml:19: ${RUN_MESSAGE}`,
    `.github/workflows/a.yml:21: ${RUN_MESSAGE}`,
  ]);
});

test("a checkout step without persist-credentials: false fails", async () => {
  const lines = [
    "permissions:",
    "  contents: read",
    "jobs:",
    "  a:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    `      - uses: actions/checkout@${SHA} # v7.0.1`,
    `      - uses: actions/checkout@${SHA} # v7.0.1`,
    "        with:",
    "          persist-credentials: true",
    "      - name: Checkout",
    `        uses: actions/checkout@${SHA} # v7.0.1`,
    "        with:",
    "          fetch-depth: 0",
    "      - run: echo persist-credentials: false",
    "  b:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Checkout",
    "        with:",
    "          persist-credentials: false",
    `        uses: actions/checkout@${SHA} # v7.0.1`,
    `      - uses: actions/checkout@${SHA} # v7.0.1`,
    "",
  ];
  const result = await workflowsFor({ ".github/workflows/a.yml": lines.join("\n") });
  const message = 'set "persist-credentials: false" in the "with:" block of the checkout step';
  assert.deepEqual(withoutTimeouts(result.errors), [
    `.github/workflows/a.yml:7: ${message}`,
    `.github/workflows/a.yml:8: ${message}`,
    `.github/workflows/a.yml:12: ${message}`,
    `.github/workflows/a.yml:23: ${message}`,
  ]);
});

// #303: each job sets timeout-minutes. A job that calls a reusable workflow
// with "uses:" cannot set it, so the rule skips that job.
test("a job without timeout-minutes fails, and a reusable workflow call passes", async () => {
  const lines = [
    "permissions:",
    "  contents: read",
    "jobs:",
    "  a:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - run: echo timeout-minutes: 5",
    "  b:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 5",
    "    steps:",
    "      - run: echo",
    "  call:",
    `    uses: someone/repo/.github/workflows/a.yml@${SHA} # v1.0.0`,
    "  c:",
    "    runs-on: ubuntu-latest",
    "",
  ];
  const result = await workflowsFor({ ".github/workflows/a.yml": lines.join("\n") });
  assert.deepEqual(result.errors, [
    '.github/workflows/a.yml:4: set "timeout-minutes" on the job "a"',
    '.github/workflows/a.yml:15: set "timeout-minutes" on the job "c"',
  ]);
});

// #303: the release and deploy rules in coding/security.md.
const releaseWorkflow = (on, job, { concurrency = true, refCheck = true } = {}) => [
  ...on,
  "permissions:",
  "  contents: read",
  ...(concurrency ? ["concurrency:", "  group: release"] : []),
  "jobs:",
  "  plan:",
  "    runs-on: ubuntu-latest",
  "    timeout-minutes: 5",
  "    steps:",
  ...(refCheck ? ['      - run: test "$GITHUB_REF" = "refs/heads/main"'] : ["      - run: echo"]),
  ...job,
  "",
].join("\n");
const publishJob = (environment, run) => [
  "  publish:",
  ...(environment ? [`    environment: ${environment}`] : []),
  "    runs-on: ubuntu-latest",
  "    timeout-minutes: 5",
  "    steps:",
  `      - run: ${run}`,
];
const dispatch = ["on:", "  workflow_dispatch:", "    inputs:", "      bump:", "        type: string"];
const RELEASE = {
  on: '.github/workflows/a.yml: start a release or deploy workflow only by "workflow_dispatch"',
  concurrency: '.github/workflows/a.yml: set "concurrency" in a release or deploy workflow, so that two runs do not overlap',
  ref: '.github/workflows/a.yml: check that the ref is "refs/heads/main" in a release or deploy workflow, and stop on a different ref',
};
const errorsOf = async (text) => (await workflowsFor({ ".github/workflows/a.yml": text })).errors;

test("a release workflow with dispatch, an environment, concurrency and a ref check passes", async () => {
  for (const run of ['gh release create "v$V"', "npm publish", 'git push origin "refs/tags/v$V"', "git push --tags"]) {
    assert.deepEqual(await errorsOf(releaseWorkflow(dispatch, publishJob("release", run))), [], run);
  }
  assert.deepEqual(await errorsOf(releaseWorkflow(["on: [workflow_dispatch]"], publishJob("production", "echo deploy"))), []);
  const ifRef = [...publishJob("release", "npm publish"), "        if: github.ref == 'refs/heads/main'"];
  assert.deepEqual(await errorsOf(releaseWorkflow(["on: workflow_dispatch # by hand"], ifRef, { refCheck: false })), []);
});

test("a release workflow with another trigger fails", async () => {
  const triggers = [
    ["on: [push, workflow_dispatch]"],
    ["on:", "  workflow_dispatch:", "  push:", "    tags: ['v*']"],
    ["on:", "  schedule:", "    - cron: '0 0 * * *'"],
    ["on: pull_request"],
    ["on:", "  - workflow_dispatch", "  - push"],
    [],
  ];
  for (const on of triggers) {
    assert.deepEqual(await errorsOf(releaseWorkflow(on, publishJob("release", "npm publish"))), [RELEASE.on], on.join(" "));
  }
});

test("a job that releases, publishes or pushes a tag needs an environment", async () => {
  for (const run of ["gh release upload v1 x", "npm publish --access public", "git push origin refs/tags/v1"]) {
    assert.deepEqual(await errorsOf(releaseWorkflow(dispatch, publishJob(null, run))), [
      '.github/workflows/a.yml:16: give the release or deploy job "publish" an "environment:"',
    ]);
  }
});

test("a release workflow without concurrency or a ref check fails", async () => {
  const noConcurrency = releaseWorkflow(dispatch, publishJob("release", "npm publish"), { concurrency: false });
  assert.deepEqual(await errorsOf(noConcurrency), [RELEASE.concurrency]);
  const jobConcurrency = noConcurrency.replace("    environment: release", "    environment: release\n    concurrency: release");
  assert.deepEqual(await errorsOf(jobConcurrency), []);
  const noRef = releaseWorkflow(dispatch, publishJob("release", "npm publish"), { refCheck: false });
  assert.deepEqual(await errorsOf(noRef), [RELEASE.ref]);
  const refName = noRef.replace("      - run: echo", '      - run: test "$GITHUB_REF_NAME" = main\n      # GITHUB_REF must be refs/heads/main');
  assert.deepEqual(await errorsOf(refName), [RELEASE.ref]);
  const all = releaseWorkflow(["on: push"], publishJob("release", "echo"), { concurrency: false, refCheck: false });
  assert.deepEqual(await errorsOf(all), [RELEASE.on, RELEASE.concurrency, RELEASE.ref]);
});

test("a workflow that does not release needs no dispatch, concurrency or ref check", async () => {
  const lines = releaseWorkflow(["on: [push]"], publishJob(null, "gh release view v1"), { concurrency: false, refCheck: false });
  const text = lines.replace("      - run: echo", "      # npm publish\n      - run: git push origin HEAD\n      - run: gh release list");
  assert.deepEqual(await errorsOf(text), []);
});

// #303: the secret exception comes from .github/check-workflows.json. With
// no settings file, no secret is allowed.
test("the app secrets fail when the settings file does not allow them", async () => {
  const result = await workflowsFor({ ".github/workflows/release.yml": appJob("release", ID, KEY) });
  assert.deepEqual(secretErrors(result), [
    ".github/workflows/release.yml:10: do not use secrets in a workflow",
    ".github/workflows/release.yml:11: do not use secrets in a workflow",
  ]);
  const otherKey = JSON.parse(SETTINGS);
  otherKey.allowedSecrets[0].with = { "app-id": "RELEASE_APP_ID" };
  const one = await workflowsFor({
    ".github/workflows/release.yml": appJob("release", ID, KEY),
    ".github/check-workflows.json": JSON.stringify(otherKey),
  });
  assert.deepEqual(secretErrors(one), [".github/workflows/release.yml:11: do not use secrets in a workflow"]);
});

test("a settings file that is not valid fails", async () => {
  const bad = [
    "{",
    "[]",
    '{"allowedSecrets": {}}',
    '{"allowedSecrets": [null]}',
    '{"allowedSecrets": [{"file": "release.yml", "environment": "release", "action": "a/b"}]}',
    '{"allowedSecrets": [{"file": "release.yml", "environment": "release", "action": "a/b", "with": {"k": 1}}]}',
    '{"allowedSecrets": [{"file": 1, "environment": "release", "action": "a/b", "with": {}}]}',
  ];
  for (const text of bad) {
    const result = await workflowsFor({ ".github/workflows/a.yml": good, ".github/check-workflows.json": text });
    assert.equal(result.errors.length, 1, text);
    assert.match(result.errors[0], /^\.github\/check-workflows\.json: /, text);
  }
  const empty = await workflowsFor({ ".github/workflows/a.yml": good, ".github/check-workflows.json": "{}" });
  assert.deepEqual(empty.errors, []);
});

test("the dkstack settings file keeps the release app exception of #135", async () => {
  const text = await readFile(join(repoRoot, ".github", "check-workflows.json"), "utf8");
  assert.deepEqual(JSON.parse(text).allowedSecrets.map(({ decision, ...rest }) => rest), JSON.parse(SETTINGS).allowedSecrets);
  assert.match(JSON.parse(text).allowedSecrets[0].decision, /2026-11-11.*#135/);
});
