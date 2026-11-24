import { test } from "node:test";
import assert from "node:assert/strict";
import { makeTree, readFile, removeTree } from "./helpers.mjs";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// validate runs on all pull requests and on pushes to main. The Release
// workflow does not start it by hand: the release app opens the pull request,
// and the pull_request run gives the check "validate" that protect-main requires.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const validate = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");

test("validate starts for every pull request and for pushes to main, and keeps the job name", () => {
  const on = /^on:\n((?:  .*\n|    .*\n)+)/m.exec(validate)[1];
  assert.deepEqual(on.split("\n").filter((l) => /^  \S/.test(l)).map((l) => l.trim()), ["pull_request:", "push:"]);
  assert.match(validate, /^  pull_request:\n    types: \[opened, synchronize, reopened, edited\]\n  push:/m);
  assert.match(validate, /^  push:\n    branches: \[main\]/m);
  assert.match(validate, /^jobs:\n  validate:\n    name: validate\n/m);
});

test("validate checks the commit title of a push", () => {
  const step = validate.slice(validate.indexOf("- name: Check that the commit title"));
  assert.match(step.split("\n").slice(0, 3).join("\n"), /github\.event_name == 'push'/);
});

// FRG-14 in #154: a new push to a pull request cancels the old run. A push
// to main is never cancelled, so each commit on main gets a full run.
test("validate cancels an old run of the same pull request, but never a run on main", () => {
  assert.match(validate, /^concurrency:\n {2}group: validate-\$\{\{ github\.event\.pull_request\.number \|\| github\.sha \}\}\n {2}cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}$/m);
});

// SEN-11 in #154: actionlint with shellcheck finds syntax and shell faults in
// the workflows. The binary is fixed by version and SHA-256.
test("validate runs a pinned actionlint with shellcheck on the workflows", () => {
  const step = validate.slice(validate.indexOf("- name: Check the workflows with actionlint"));
  assert.ok(validate.includes("- name: Check the workflows with actionlint"), "an actionlint step");
  const body = step.split(/\n(?= {6}- name: )/)[0];
  assert.match(body, /ACTIONLINT_VERSION: 1\.\d+\.\d+/);
  assert.match(body, /ACTIONLINT_SHA256: [0-9a-f]{64}/);
  assert.match(body, /sha256sum --check --strict/);
  assert.match(body, /command -v shellcheck/);
  assert.match(body, /-shellcheck=shellcheck/);
  assert.match(body, /if: \$\{\{ !cancelled\(\) && steps\.node\.outcome == 'success' \}\}/);
});

test("the ADR workflow step compares the pull request target and the push range", { skip: process.platform === "win32" }, async (t) => {
  const root = await makeTree({ "base.txt": "base\n" });
  t.after(() => removeTree(root));
  const git = (...args) => execFileSync("git", [
    "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args,
  ], { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("add", ".");
  git("commit", "-qm", "base");
  const before = git("rev-parse", "HEAD");
  git("switch", "-qc", "target");
  await mkdir(join(root, "docs/adr"), { recursive: true });
  await writeFile(join(root, "docs/adr/0001-example.md"), "# Missing required fields\n");
  git("add", ".");
  git("commit", "-qm", "add ADR");
  const target = git("rev-parse", "HEAD");
  git("update-ref", "refs/remotes/origin/main", target);

  const step = validate.split(/\n(?= {6}- name: )/).find((part) => part.includes("npm run check:adrs"));
  assert.match(step, /BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \|\| github\.event\.before \}\}/);
  const command = step.split("run: |\n")[1].split("\n").map((line) => line.replace(/^ {10}/, "")).join("\n");
  await writeFile(join(root, "package.json"), JSON.stringify({
    scripts: { "check:adrs": `node "${join(repoRoot, "scripts/check-adrs.mjs")}"` },
  }));
  const run = (event, base) => spawnSync("bash", ["-e", "-c", command], {
    cwd: root, encoding: "utf8",
    env: { ...process.env, GITHUB_EVENT_NAME: event, BASE_SHA: base },
  });

  git("commit", "-qm", "finish the push", "--allow-empty");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  const push = run("push", before);
  assert.equal(push.status, 1);
  assert.match(push.stderr, /a new ADR must have a "Status:" line/);

  const missing = "0".repeat(40);
  git("switch", "-qc", "single-commit-push", target);
  const fallback = run("push", missing);
  assert.equal(fallback.status, 1);
  assert.match(fallback.stderr, /a new ADR must have a "Status:" line/);

  git("update-ref", "refs/remotes/origin/main", before);
  git("switch", "-qc", "work", target);
  git("commit", "-qm", "propose a change", "--allow-empty");
  const pr = run("pull_request", target);
  assert.equal(pr.status, 0, pr.stderr);
  assert.match(pr.stdout, /No new ADR/);
  const prWithoutBase = run("pull_request", missing);
  assert.equal(prWithoutBase.status, 2);
  assert.match(prWithoutBase.stderr, /cannot list the changed files/);
});
