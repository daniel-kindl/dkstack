import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The Release workflow starts validate by workflow_dispatch on the release
// branch, because a pull request made with GITHUB_TOKEN starts no workflow.
// The check must keep the name "validate", which protect-main requires.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const validate = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");

test("validate can start on a branch by workflow_dispatch and keeps the job name", () => {
  assert.match(validate, /^on:\n(?:  .*\n)*  workflow_dispatch:/m);
  assert.match(validate, /^  pull_request:\n    branches: \[main\]/m);
  assert.match(validate, /^jobs:\n  validate:\n    name: validate\n/m);
});

test("validate checks the commit title on every event except pull_request", () => {
  const step = validate.slice(validate.indexOf("- name: Check that the commit title"));
  assert.match(step.split("\n").slice(0, 3).join("\n"), /github\.event_name != 'pull_request'/);
});
