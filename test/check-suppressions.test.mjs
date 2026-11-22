import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFile } from "node:fs/promises";
import { checkDiff, checkFiles, parseDiff } from "../scripts/check-suppressions.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-suppressions.mjs");
const run = (args, cwd) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd });

// Return a unified diff for one file. Each line starts with "+", "-" or " ".
// The hunk starts at new line `start`.
function diff(path, lines, start = 1) {
  const oldCount = lines.filter((l) => l[0] !== "+").length;
  const newCount = lines.filter((l) => l[0] !== "-").length;
  return [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -${start},${oldCount} +${start},${newCount} @@`,
    ...lines,
    "",
  ].join("\n");
}

// Return the findings for added lines in one file, with no file on disk.
const added = (path, ...lines) => checkDiff(diff(path, lines.map((l) => `+${l}`)), null);

test("parseDiff reads the path, the hunks and the new line numbers", () => {
  const files = parseDiff(`${diff("src/a.js", [" one", "-two", "+three", "+four"], 5)}${diff("src/b.py", ["+x"])}`);
  assert.deepEqual(files.map((f) => f.path), ["src/a.js", "src/b.py"]);
  const lines = files[0].hunks[0];
  assert.deepEqual(lines.map((l) => [l.kind, l.text, l.n]), [
    [" ", "one", 5], ["-", "two", null], ["+", "three", 6], ["+", "four", 7],
  ]);
});

test("parseDiff skips a deleted file, a binary file and the no-newline marker", () => {
  const text = [
    "diff --git a/old.js b/old.js", "deleted file mode 100644", "--- a/old.js", "+++ /dev/null",
    "@@ -1 +0,0 @@", "-// eslint-disable", "\\ No newline at end of file",
    "diff --git a/img.png b/img.png", "Binary files a/img.png and b/img.png differ", "",
  ].join("\n");
  assert.deepEqual(parseDiff(text).map((f) => f.path), []);
});

test("an ESLint directive with no rule is a blanket suppression", () => {
  for (const line of ["// eslint-disable", "/* eslint-disable */", "x(); // eslint-disable-line",
    "// eslint-disable-next-line -- reason"]) {
    assert.deepEqual(added("src/a.js", "// note", line), [`src/a.js:2: blanket suppression "eslint-disable". Name the rule ID`], line);
  }
});

test("an ESLint directive with a rule and a reason passes", () => {
  assert.deepEqual(added("src/a.js", "x(); // eslint-disable-line no-console -- the CLI prints"), []);
  assert.deepEqual(added("src/a.js", "/* eslint-disable no-console, no-undef -- generated code */"), []);
  assert.deepEqual(added("src/a.js", "// The API names this field.", "// eslint-disable-next-line camelcase"), []);
  assert.deepEqual(added("src/a.js", "// eslint-enable", "const eslintDisabled = true;"), []);
});

test("a suppression with a rule ID but no reason is a finding", () => {
  const message = (n, name) => `src/a.js:${n}: suppression "${name}" has no reason. Add it on the same line or the line above`;
  assert.deepEqual(added("src/a.js", "x();", "// eslint-disable-next-line no-console"), [message(2, "eslint-disable")]);
  assert.deepEqual(added("src/a.js", "/* eslint-disable no-console */"), [message(1, "eslint-disable")]);
  // A suppression on the line above is not a reason.
  assert.deepEqual(added("src/a.js", "// eslint-disable-next-line no-undef -- generated",
    "// eslint-disable-next-line no-console"), [message(2, "eslint-disable")]);
});

test("Python: a bare noqa, a type ignore with no code and pylint disable=all are blanket", () => {
  assert.deepEqual(added("a.py", "import os  # noqa"), [`a.py:1: blanket suppression "noqa". Name the rule ID`]);
  assert.deepEqual(added("a.py", "x = f()  # type: ignore"), [`a.py:1: blanket suppression "type: ignore". Name the rule ID`]);
  assert.deepEqual(added("a.py", "# pylint: disable=all"), [`a.py:1: blanket suppression "pylint: disable". Name the rule ID`]);
  assert.deepEqual(added("a.py", "# pylint: disable=unused-import, all"), [`a.py:1: blanket suppression "pylint: disable". Name the rule ID`]);
});

test("Python: a suppression with a code and a reason passes, and one without a reason fails", () => {
  assert.deepEqual(added("a.py", "import os  # noqa: F401 re-exported for the API"), []);
  assert.deepEqual(added("a.py", "x = f()  # type: ignore[attr-defined]  # stub is wrong"), []);
  assert.deepEqual(added("a.py", "# The generator writes these names.", "# pylint: disable=invalid-name"), []);
  assert.deepEqual(added("a.py", "import os  # noqa: F401,E402"),
    [`a.py:1: suppression "noqa" has no reason. Add it on the same line or the line above`]);
  assert.deepEqual(added("a.py", "x = f()  # type: ignore[attr-defined]"),
    [`a.py:1: suppression "type: ignore" has no reason. Add it on the same line or the line above`]);
  assert.deepEqual(added("a.py", "def noqa_helper(): pass", "kind = 'type: ignore'"), []);
});

test("TypeScript: ts-ignore and ts-nocheck are always blanket", () => {
  assert.deepEqual(added("a.ts", "// The type is wrong.", "// @ts-ignore"), [`a.ts:2: blanket suppression "@ts-ignore". Name the rule ID`]);
  assert.deepEqual(added("a.ts", "/* @ts-nocheck */"), [`a.ts:1: blanket suppression "@ts-nocheck". Name the rule ID`]);
  assert.deepEqual(added("a.ts", "// @ts-expect-error the stub has no overload", "const tsIgnore = 1;"), []);
});

test(".NET: NoWarn in a project file and a pragma with no ID are blanket", () => {
  for (const path of ["src/App.csproj", "Directory.Build.props", "build/x.targets"]) {
    assert.deepEqual(added(path, "<NoWarn>$(NoWarn);CS1591</NoWarn>"), [`${path}:1: blanket suppression "NoWarn". Name the rule ID`]);
  }
  assert.deepEqual(added("src/notes.cs", "// <NoWarn> is not used here."), []);
  assert.deepEqual(added("src/A.cs", "#pragma warning disable"), [`src/A.cs:1: blanket suppression "#pragma warning disable". Name the rule ID`]);
  assert.deepEqual(added("src/A.cs", "#pragma warning disable CS0618 // the platform API is obsolete"), []);
  assert.deepEqual(added("src/A.cs", "#pragma warning disable CS0618, IDE0051"),
    [`src/A.cs:1: suppression "#pragma warning disable" has no reason. Add it on the same line or the line above`]);
  assert.deepEqual(added("src/A.cs", "#pragma warning restore"), []);
});

test("a lowered coverage or threshold number in the same hunk is a finding", () => {
  const text = diff("package.json", [
    '-    "test": "node --test --test-coverage-lines=95 --test-coverage-branches=90"',
    '+    "test": "node --test --test-coverage-lines=80 --test-coverage-branches=90"',
  ]);
  assert.deepEqual(checkDiff(text, null), [`package.json:1: "--test-coverage-lines" is lowered from 95 to 80`]);
  const jest = diff("jest.config.js", ["-  coverageThreshold: 90,", "+  coverageThreshold: 85.5,"]);
  assert.deepEqual(checkDiff(jest, null), [`jest.config.js:1: "coverageThreshold" is lowered from 90 to 85.5`]);
});

test("a raised max-warnings number weakens the gate and is a finding", () => {
  const text = diff("package.json", ['-  "lint": "eslint --max-warnings 0 ."', '+  "lint": "eslint --max-warnings=10 ."']);
  assert.deepEqual(checkDiff(text, null), [`package.json:1: "--max-warnings" is raised from 0 to 10`]);
  const lower = diff("package.json", ['-  "lint": "eslint --max-warnings 10 ."', '+  "lint": "eslint --max-warnings 0 ."']);
  assert.deepEqual(checkDiff(lower, null), []);
});

test("a raised threshold, a new threshold or a change in another hunk is not a finding", () => {
  assert.deepEqual(checkDiff(diff("a.json", ['-  "coverage": 80', '+  "coverage": 90']), null), []);
  assert.deepEqual(checkDiff(diff("a.json", ['+  "coverage": 10']), null), []);
  const twoHunks = `${diff("a.json", ['-  "coverage": 90'])}${diff("a.json", ['+  "coverage": 10'], 9).split("\n").slice(3).join("\n")}`;
  assert.deepEqual(checkDiff(twoHunks, null), []);
});

test("the checker skips its own files and Markdown", () => {
  for (const path of ["scripts/check-suppressions.mjs", "test/check-suppressions.test.mjs", "docs/x.md"]) {
    assert.deepEqual(added(path, "// eslint-disable"), [], path);
  }
});

test("the line above comes from a context line or from the file on disk", async () => {
  const withContext = diff("src/a.js", [" // The API names this field.", "+// eslint-disable-next-line camelcase"]);
  assert.deepEqual(checkDiff(withContext, null), []);
  const root = await makeTree({ "src/a.js": "// The API names this field.\n// eslint-disable-next-line camelcase\n" });
  try {
    const noContext = diff("src/a.js", ["+// eslint-disable-next-line camelcase"], 2);
    assert.deepEqual(checkDiff(noContext, root), []);
    const missing = diff("src/gone.js", ["+// eslint-disable-next-line camelcase"], 2);
    assert.equal(checkDiff(missing, root).length, 1);
  } finally {
    await removeTree(root);
  }
});

test("checkFiles checks each line of whole files", async () => {
  const root = await makeTree({ "a.py": "import os  # noqa\n", "b.py": "x = 1\n" });
  try {
    assert.deepEqual(checkFiles(root, ["a.py", "b.py", "missing.py"]), [`a.py:1: blanket suppression "noqa". Name the rule ID`]);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 0 with no finding, 1 for findings and 2 for a usage or read error", async () => {
  const root = await makeTree({
    "good.diff": diff("a.py", ["+x = 1"]),
    "bad.diff": diff("a.py", ["+import os  # noqa"]),
    "a.py": "import os  # noqa\n",
  });
  try {
    const pass = run(["--diff", join(root, "good.diff"), root]);
    assert.equal(pass.stderr, "");
    assert.equal(pass.status, 0);
    assert.equal(pass.stdout, "No blanket suppression, suppression without a reason or weakened gate.\n");
    const fail = run(["--diff", join(root, "bad.diff"), root]);
    assert.equal(fail.status, 1);
    assert.equal(fail.stderr, `a.py:1: blanket suppression "noqa". Name the rule ID\n`);
    const files = run([root, "--", "a.py"]);
    assert.equal(files.status, 1);
    assert.equal(run(["--bad-flag"]).status, 2);
    assert.match(run(["--bad-flag"]).stderr, /^usage: /);
    const unread = run(["--diff", join(root, "no-such.diff"), root]);
    assert.equal(unread.status, 2);
    assert.match(unread.stderr, /^cannot read the diff: /);
  } finally {
    await removeTree(root);
  }
});

test("with no diff file, the CLI checks the diff since the base ref and untracked files", async () => {
  const root = await makeTree({ "src/a.js": "x();\n" });
  const git = (...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args],
    { cwd: root, encoding: "utf8" });
  try {
    git("init", "-q", "-b", "main");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("switch", "-q", "-c", "work");
    await writeFile(join(root, "src/a.js"), "x(); // eslint-disable-line\n");
    git("commit", "-q", "-am", "add a suppression");
    await writeFile(join(root, "src/new.py"), "import os  # noqa\n");
    const fail = run(["--base", "main", root]);
    assert.equal(fail.status, 1);
    assert.equal(fail.stderr, [
      `src/a.js:1: blanket suppression "eslint-disable". Name the rule ID`,
      `src/new.py:1: blanket suppression "noqa". Name the rule ID`,
      "",
    ].join("\n"));
    const badRef = run(["--base", "no-such-ref", root]);
    assert.equal(badRef.status, 2);
    assert.match(badRef.stderr, /^cannot read the diff: /);
  } finally {
    await removeTree(root);
  }
});
