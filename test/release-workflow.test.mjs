import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// These tests read the workflow text. They do not parse YAML, as
// scripts/check-workflows.mjs does not. They keep the safety rules of
// issue #135 in the files: the gates, the order of the steps and no force.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(repoRoot, path), "utf8");
const release = await read(".github/workflows/release.yml");

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

test("release starts only by hand, on main, with the bump input", () => {
  assert.match(release, /^on:\n  workflow_dispatch:\n    inputs:\n      bump:\n/m);
  assert.doesNotMatch(release, /^  (push|pull_request|pull_request_target|schedule|workflow_run):/m);
  assert.match(release, /options: \[auto, patch, minor\]/);
  assert.ok(commands(release).some((l) => /"\$GITHUB_REF" != "refs\/heads\/main"/.test(l)), "fail unless on main");
});

test("release has read-only top permissions and three write scopes in its job", () => {
  assert.match(release, /^permissions:\n  contents: read\n/m);
  const job = /^    permissions:\n((?:      .*\n)+)/m.exec(release);
  assert.ok(job, "the job sets permissions");
  const scopes = job[1].split("\n").filter(Boolean).map((l) => l.replace(/#.*/, "").trim()).sort();
  assert.deepEqual(scopes, ["actions: write", "contents: write", "pull-requests: write"]);
});

test("release never forces a push or a ref", () => {
  for (const line of commands(release)) {
    assert.doesNotMatch(line, /--force|--force-with-lease|\bpush\b.*\s-f\b|\bpush\b.*\s\+\S|"force"|force=true/, line);
    assert.doesNotMatch(line, /--admin|--no-verify|git tag -f|git tag -d|--delete/, line);
  }
});

test("release validates, merges, tags, publishes and moves v1 in this order", () => {
  const lines = commands(release);
  const at = (pattern) => {
    const i = lines.findIndex((l) => pattern.test(l));
    assert.notEqual(i, -1, `missing ${pattern}`);
    return i;
  };
  const order = [
    at(/node scripts\/release\.mjs guard --v1 origin\/v1/),
    at(/node scripts\/release\.mjs prepare --bump "\$BUMP"/),
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
  const lines = commands(release);
  const merge = lines.findIndex((l) => /gh pr merge/.test(l));
  const tag = lines.findIndex((l) => /git tag -a/.test(l));
  const before = (end) => lines.slice(0, end).filter((l) => /git ls-remote .*refs\/heads\/main/.test(l)).length;
  assert.ok(before(merge) >= 1, "check main before the merge");
  const parent = lines.findIndex((l) => /"\$\(git rev-parse "\$MERGE_SHA\^"\)" != "\$START_SHA"/.test(l));
  const tree = lines.findIndex((l) => /"\$\(git rev-parse "\$MERGE_SHA\^\{tree\}"\)" != "\$\(git rev-parse "\$HEAD_SHA\^\{tree\}"\)"/.test(l));
  assert.ok(parent > merge && parent < tag, "check the merge parent before the tag");
  assert.ok(tree > merge && tree < tag, "check the merged tree before the tag");
  assert.ok(lines.some((l) => /git merge-base --is-ancestor origin\/v1 "\$MERGE_SHA"/.test(l)), "check fast-forward");
});
