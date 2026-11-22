import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { makeTree, removeTree, readFile } from "./helpers.mjs";
import { checkPrBody } from "../scripts/check-pr-body.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-pr-body.mjs");

const good = [
  "Closes #12",
  "",
  "## Summary",
  "",
  "A change.",
  "",
  "## Evidence",
  "",
  "- Verified: npm run check passes.",
  "- Observability: none, docs only",
].join("\n");

const withLines = (...lines) => good + "\n" + lines.join("\n");
const replaceLine = (from, to) => good.replace(from, to);
const ISSUE_ERROR = "the body must link an issue with a number, for example \"Closes #12\"";

test("a complete body passes", () => {
  assert.deepEqual(checkPrBody(good), []);
});

test("the template body fails with each problem", async () => {
  const template = await readFile(join(repoRoot, ".github", "pull_request_template.md"), "utf8");
  const errors = checkPrBody(template);
  assert.ok(errors.includes(ISSUE_ERROR), errors.join("\n"));
  assert.ok(errors.some((e) => e.startsWith("the \"Observability:\" line")), errors.join("\n"));
  assert.ok(!errors.some((e) => e.includes("Evidence")), "the template has an Evidence section");
});

test("an issue link needs a number", () => {
  for (const link of ["Closes #12", "Fixes #3", "Resolves #400", "closes #1",
    "Closes https://github.com/daniel-kindl/dkstack/issues/301"]) {
    assert.deepEqual(checkPrBody(replaceLine("Closes #12", link)), [], link);
  }
  for (const link of ["Closes #", "Closes", "See #12", ""]) {
    assert.deepEqual(checkPrBody(replaceLine("Closes #12", link)), [ISSUE_ERROR], JSON.stringify(link));
  }
});

test("every GitHub closing keyword and link form counts", () => {
  for (const link of ["Close #1", "Closed #1", "Fix #1", "Fixed #1", "Resolve #1", "Resolved #1",
    "Closes: #12", "FIXES #12", "Closes daniel-kindl/dkstack#12", "Fixes: octo/repo#3"]) {
    assert.deepEqual(checkPrBody(replaceLine("Closes #12", link)), [], link);
  }
  assert.deepEqual(checkPrBody(replaceLine("Closes #12", "Closes owner/repo#")), [ISSUE_ERROR]);
});

test("lines inside fenced code blocks are ignored", () => {
  const fence = (mark, ...lines) => [mark, ...lines, mark].join("\n");
  for (const mark of ["```", "~~~"]) {
    assert.deepEqual(checkPrBody(withLines(fence(mark, "Observability: x", "Visual verification: bad"))), [], mark);
    assert.deepEqual(checkPrBody(replaceLine("Closes #12", fence(mark, "Closes #12"))), [ISSUE_ERROR], mark);
  }
  assert.deepEqual(checkPrBody(withLines("```js", "Observability: x", "```")), []);
});

test("the Evidence heading must be an exact level 2 heading", () => {
  const error = ["the body must have an \"## Evidence\" section"];
  for (const heading of ["### Evidence", "## Evidence notes", "# Evidence", "Evidence", "x ## Evidence"]) {
    assert.deepEqual(checkPrBody(replaceLine("## Evidence", heading)), error, heading);
  }
});

test("an issue link inside an HTML comment does not count", () => {
  assert.deepEqual(checkPrBody(replaceLine("Closes #12", "<!-- Closes #12 -->")), [ISSUE_ERROR]);
});

test("the body needs an Evidence section", () => {
  const errors = checkPrBody(replaceLine("## Evidence", "## Proof"));
  assert.deepEqual(errors, ["the body must have an \"## Evidence\" section"]);
});

test("the body needs exactly one Observability line", () => {
  const none = good.replace("- Observability: none, docs only", "");
  assert.deepEqual(checkPrBody(none), ["the body must have one \"Observability:\" line, and it has 0"]);
  assert.deepEqual(checkPrBody(withLines("- Observability: logs added")), [
    "the body must have one \"Observability:\" line, and it has 2",
  ]);
});

test("the Observability value is a description or none with a reason", () => {
  for (const value of ["none, docs only", "none, no runtime code", "login events added", "None, docs only"]) {
    assert.deepEqual(checkPrBody(replaceLine("none, docs only", value)), [], value);
  }
  const bad = ["", "none", "none,", "<events added or changed>",
    "<events added or changed>, or none, <reason>", "none, <reason>"];
  for (const value of bad) {
    const errors = checkPrBody(replaceLine("none, docs only", value));
    assert.equal(errors.length, 1, JSON.stringify(value));
    assert.match(errors[0], /^the "Observability:" line /);
  }
});

test("a Visual verification line starts with PASS, FAIL or NOT RUN", () => {
  for (const value of ["PASS, screenshots in docs/a.png", "FAIL, the menu clips", "NOT RUN, no browser"]) {
    assert.deepEqual(checkPrBody(withLines(`- Visual verification: ${value}`)), [], value);
  }
  const reason = "the \"Visual verification:\" line must start with PASS, FAIL or NOT RUN";
  assert.deepEqual(checkPrBody(withLines("- Visual verification: looks fine")), [reason]);
  assert.deepEqual(checkPrBody(withLines("- Visual verification:")), [reason]);
  assert.deepEqual(
    checkPrBody(withLines("- Visual verification: <PASS, FAIL or NOT RUN>, <evidence>. Only for a rendered UI change.")),
    [reason],
  );
});

test("a bot author is skipped", () => {
  assert.deepEqual(checkPrBody("", "dependabot[bot]"), []);
  assert.ok(checkPrBody("", "daniel-kindl").length > 0);
  assert.ok(checkPrBody("", "bot-lover").length > 0);
});

test("every problem is reported", () => {
  assert.equal(checkPrBody("").length, 3);
});

function run(args, env) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: { PATH: process.env.PATH, ...env },
  });
}

test("the CLI reads BODY, exits 0 for a good body and 1 for a bad body", () => {
  const pass = run([], { BODY: good, AUTHOR: "daniel-kindl" });
  assert.equal(pass.status, 0, pass.stderr);
  assert.equal(pass.stdout, "PR body is valid.\n");
  const fail = run([], { BODY: "", AUTHOR: "daniel-kindl" });
  assert.equal(fail.status, 1);
  assert.match(fail.stderr, /issue/);
  assert.match(fail.stderr, /Evidence/);
  assert.match(fail.stderr, /Observability/);
});

test("the CLI skips a bot author", () => {
  const result = run([], { BODY: "", AUTHOR: "dependabot[bot]" });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "PR body check skipped: the author dependabot[bot] is a bot.\n");
});

test("the CLI reads a file argument", async () => {
  const root = await makeTree({ "body.md": good });
  try {
    const result = run([join(root, "body.md")], {});
    assert.equal(result.status, 0, result.stderr);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 2 with no input or an unreadable file", () => {
  const none = run([], {});
  assert.equal(none.status, 2);
  assert.match(none.stderr, /^usage: /);
  const missing = run(["/no/such/body.md"], {});
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /cannot read/);
});

test("the validate workflow checks the body on pull_request with env", async () => {
  const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");
  const step = workflow.split(/\n(?= {6}- name: )/).find((s) => s.includes("check-pr-body"));
  assert.ok(step, "a PR body step");
  assert.match(step, /if: \$\{\{ !cancelled\(\) && steps\.node\.outcome == 'success' && github\.event_name == 'pull_request' \}\}/);
  assert.match(step, /BODY: \$\{\{ github\.event\.pull_request\.body \}\}/);
  assert.match(step, /AUTHOR: \$\{\{ github\.event\.pull_request\.user\.login \}\}/);
  assert.match(step, /run: node scripts\/check-pr-body\.mjs\s*$/m);
  assert.doesNotMatch(step.split("run:")[1], /\$\{\{/);
});
