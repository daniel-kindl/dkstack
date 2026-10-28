import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkWorkflows } from "../scripts/check-workflows.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

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

const good = [
  "name: validate",
  "on: [pull_request]",
  "permissions:",
  "  contents: read",
  "jobs:",
  "  validate:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  `      - uses: actions/checkout@${SHA} # v7.0.1`,
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
  assert.deepEqual(result.errors, [
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
    ".github/workflows/a.yml:15: do not use secrets in a workflow",
    ".github/workflows/a.yml:16: do not use secrets in a workflow",
  ]);
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
      '.github/workflows/a.yml:9: pin "actions/checkout@v7" to a full 40-character commit SHA\n',
    );
    const passRun = spawnSync(process.execPath, [script, clean], { encoding: "utf8" });
    assert.equal(passRun.stderr, "");
    assert.equal(passRun.status, 0);
    assert.equal(passRun.stdout, "1 workflow(s) pin actions to a SHA, set permissions and use no secrets.\n");
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
  assert.deepEqual(result.errors, [
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
  assert.deepEqual(result.errors, [
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
