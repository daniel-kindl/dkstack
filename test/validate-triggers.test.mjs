import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// validate runs on pull requests to main and on pushes to main. The Release
// workflow does not start it by hand: the release app opens the pull request,
// and the pull_request run gives the check "validate" that protect-main requires.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const validate = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");

test("validate starts only for pull requests and pushes to main, and keeps the job name", () => {
  const on = /^on:\n((?:  .*\n|    .*\n)+)/m.exec(validate)[1];
  assert.deepEqual(on.split("\n").filter((l) => /^  \S/.test(l)).map((l) => l.trim()), ["pull_request:", "push:"]);
  assert.match(validate, /^  pull_request:\n    branches: \[main\]/m);
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
