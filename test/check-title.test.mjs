import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkTitle } from "../scripts/check-title.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-title.mjs");

test("conventional commit titles pass", () => {
  for (const title of [
    "feat: add user login",
    "fix(skills): use the SKILL.md folder layout",
    "fix(skills): use the SKILL.md folder layout (#18)",
    "docs(security): extend the secrets rule to chat",
    "ci: add the validate workflow",
    "feat(api)!: remove the v0 endpoints",
    "refactor!: drop Node 18",
    "chore(deps-dev): update a tool",
    "build: pin Node",
    "perf: cache the parse result",
    "revert: feat: add user login",
    "style: format the scripts",
    "test: cover the 64 character name",
  ]) {
    assert.deepEqual(checkTitle(title), [], title);
  }
});

test("titles that are not conventional commits fail with the reason", () => {
  const cases = {
    "update stuff": "the title must start with a type, as in \"fix: ...\"",
    wip: "the title must start with a type, as in \"fix: ...\"",
    "Fix: crash on empty input": "the title must start with a type, as in \"fix: ...\"",
    "feature: add login": "the type \"feature\" is not allowed. Use one of: feat, fix, docs, refactor, test, chore, build, ci, perf, style, revert",
    "fix crash": "the title must start with a type, as in \"fix: ...\"",
    "fix:crash": "put one space after the colon, then a description",
    "fix: ": "put one space after the colon, then a description",
    "fix:  crash": "put one space after the colon, then a description",
    "fix(): crash": "the scope must use only a-z, 0-9 and single hyphens",
    "fix(Skills): crash": "the scope must use only a-z, 0-9 and single hyphens",
    "fix(a b): crash": "the scope must use only a-z, 0-9 and single hyphens",
    "": "the title is empty",
    "   ": "the title is empty",
  };
  for (const [title, reason] of Object.entries(cases)) {
    assert.deepEqual(checkTitle(title), [reason], JSON.stringify(title));
  }
});

test("a title with a line break or trailing space fails", () => {
  assert.deepEqual(checkTitle("fix: a\nb"), ["the title must be one line"]);
  assert.deepEqual(checkTitle("fix: crash "), ["the title must not end with a space"]);
});

test("the CLI exits 1 for a bad title and 0 for a good title", () => {
  const failRun = spawnSync(process.execPath, [script, "update stuff"], { encoding: "utf8" });
  assert.equal(failRun.status, 1);
  assert.equal(
    failRun.stderr,
    'title "update stuff" is not a conventional commit: the title must start with a type, as in "fix: ..."\n',
  );
  const passRun = spawnSync(process.execPath, [script, "ci: add the validate workflow"], {
    encoding: "utf8",
  });
  assert.equal(passRun.stderr, "");
  assert.equal(passRun.status, 0);
  assert.equal(passRun.stdout, 'title "ci: add the validate workflow" is a conventional commit.\n');
});

test("the CLI fails when no title is given", () => {
  const run = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(run.status, 1);
  assert.equal(run.stderr, 'title "" is not a conventional commit: the title is empty\n');
});

// Each title below has exactly the given number of code points.
const title50 = "fix: " + "a".repeat(45);
const title51 = "fix: " + "a".repeat(46);

test("a title of 50 characters passes and a title of 51 fails", () => {
  assert.equal([...title50].length, 50);
  assert.deepEqual(checkTitle(title50), []);
  assert.deepEqual(checkTitle(title51), [
    "the title has 51 characters. Use 50 or fewer, without the (#NN) suffix",
  ]);
});

test("the limit counts characters, not bytes or UTF-16 units", () => {
  const emoji = "fix: " + "a".repeat(44) + "\u{1F600}";
  const accent = "fix: " + "a".repeat(44) + "\u00e9";
  assert.equal([...emoji].length, 50);
  assert.ok(emoji.length > 50 && Buffer.byteLength(emoji) > 50);
  assert.ok(Buffer.byteLength(accent) > 50);
  assert.deepEqual(checkTitle(emoji), []);
  assert.deepEqual(checkTitle(accent), []);
});

test("the (#NN) squash suffix does not count toward the limit", () => {
  assert.deepEqual(checkTitle(title50 + " (#123)"), []);
  assert.deepEqual(checkTitle(title51 + " (#123)"), [
    "the title has 51 characters. Use 50 or fewer, without the (#NN) suffix",
  ]);
});

test("a double ! fails and a single ! passes", () => {
  const reason = 'the title must start with a type, as in "fix: ..."';
  assert.deepEqual(checkTitle("feat!!: add login"), [reason]);
  assert.deepEqual(checkTitle("feat(x)!!: add login"), [reason]);
  assert.deepEqual(checkTitle("feat!: add login"), []);
  assert.deepEqual(checkTitle("feat(x)!: add login"), []);
});

test("a title with only the (#NN) suffix as description fails", () => {
  const reason = "put one space after the colon, then a description";
  for (const title of ["fix: (#12)", "fix:  (#12)", "feat(x)!: (#3)"]) {
    assert.deepEqual(checkTitle(title), [reason], title);
  }
  assert.deepEqual(checkTitle("fix: a (#12)"), []);
});
