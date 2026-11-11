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
