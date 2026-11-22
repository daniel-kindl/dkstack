import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkReview } from "../scripts/check-review.mjs";
import { makeTree, removeTree, readFile } from "./helpers.mjs";

// Rules for the review file that the code-review skill writes before it posts (#309).
// test/fixtures has real review files from this project.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-review.mjs");
const SHA = "97acdd5831126ff91e710fc1db616039a87d1c62";

function review(verdict, body = "", head = SHA) {
  return `# Review of PR #1\n\n**Verdict: ${verdict}**\n\nHead SHA: \`${head}\`\n\n${body}`;
}

test("a review with one verdict, a head SHA and no finding passes as APPROVE-RECOMMENDED", () => {
  assert.deepEqual(checkReview(review("APPROVE-RECOMMENDED")), []);
});

test("a plain verdict with no bold passes", () => {
  const text = `Verdict: CHANGES-REQUESTED\nHead: ${SHA}\n\n### L1. x\n\n- \`a.mjs:1\`\n`;
  assert.deepEqual(checkReview(text), []);
});

test("a missing verdict in the first 10 lines fails", () => {
  const text = `# Review\n\nHead: ${SHA}\n${"\n".repeat(10)}Verdict: APPROVE-RECOMMENDED\n`;
  const problems = checkReview(text);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /verdict/);
});

test("a verdict that is not one of the three fails", () => {
  assert.match(checkReview(review("LGTM")).join(), /verdict/);
});

test("two different verdicts in the head fail, and the same verdict twice passes", () => {
  assert.match(checkReview(`APPROVE-RECOMMENDED\nBLOCKED\nHead SHA: ${SHA}\n`).join(), /one verdict/);
  assert.deepEqual(checkReview(`Verdict: BLOCKED\nBLOCKED again\nHead SHA: ${SHA}\nQuestion: why?\n`), []);
});

test("a missing head SHA fails", () => {
  const problems = checkReview(review("APPROVE-RECOMMENDED", "", "97acdd5"));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /40-character/);
});

test("a SHA that is longer or not hex does not count", () => {
  assert.match(checkReview(review("APPROVE-RECOMMENDED", "", SHA + "a")).join(), /40-character/);
  assert.match(checkReview(review("APPROVE-RECOMMENDED", "", "z".repeat(40))).join(), /40-character/);
});

test("a SHA after line 10 does not count", () => {
  const text = `Verdict: APPROVE-RECOMMENDED\n${"\n".repeat(10)}Head SHA: ${SHA}\n`;
  assert.match(checkReview(text).join(), /40-character/);
});

test("a finding in a list item needs a file:line", () => {
  const problems = checkReview(review("CHANGES-REQUESTED", "- H1 The code is wrong.\n"));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /H1.*file:line/);
});

test("a finding in a list item with a file:line passes", () => {
  const text = review("CHANGES-REQUESTED", "- M1 `scripts/a.mjs:12-14` The code is wrong.\n");
  assert.deepEqual(checkReview(text), []);
});

test("a finding heading takes the file:line from its own lines only", () => {
  const body = "### L1. one\n\n- `a.mjs:3`\n\n### L2. two\n\nNo reference.\n";
  const problems = checkReview(review("CHANGES-REQUESTED", body));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /L2/);
});

test("a finding in a table cell needs a file:line", () => {
  const body = "| ID | Where |\n| --- | --- |\n| B1 | `x.mjs:5` |\n| H2 | none |\n";
  const problems = checkReview(review("BLOCKED", body));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /H2/);
});

test("a file:line in a nested bullet counts for its list item", () => {
  const body = "- B1. Problem\n  - `a/b.yml:9`\n- L1. Other\n";
  const problems = checkReview(review("BLOCKED", body));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /L1/);
});

test("a finding ID inside a sentence is not a finding", () => {
  const body = "- Standards: 1 finding. The worst is L1, a small point.\n";
  assert.deepEqual(checkReview(review("APPROVE-RECOMMENDED", body)), []);
});

test("APPROVE-RECOMMENDED with an open finding fails", () => {
  const body = "- L1 `a.mjs:1` A small point.\n- M2 `b.mjs:2` Another point.\n";
  const problems = checkReview(review("APPROVE-RECOMMENDED", body));
  assert.equal(problems.length, 2);
  assert.match(problems[0], /L1.*not marked fixed/);
});

test("APPROVE-RECOMMENDED with findings that are marked fixed passes", () => {
  const body = "- L1 (`a.mjs:1`): fixed.\n- M2 (`b.mjs:2`): Fixed in `abc`.\n";
  assert.deepEqual(checkReview(review("APPROVE-RECOMMENDED", body)), []);
});

test("not fixed does not count as fixed", () => {
  const body = "- L1 (`a.mjs:1`): not fixed.\n";
  assert.equal(checkReview(review("APPROVE-RECOMMENDED", body)).length, 1);
});

test("CHANGES-REQUESTED with no finding fails", () => {
  const problems = checkReview(review("CHANGES-REQUESTED"));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /CHANGES-REQUESTED needs at least one finding/);
});

test("BLOCKED with a Blocking finding passes", () => {
  assert.deepEqual(checkReview(review("BLOCKED", "- B1 `a.mjs:1` Data loss.\n")), []);
});

test("BLOCKED with a stated question passes", () => {
  assert.deepEqual(checkReview(review("BLOCKED", "Question: the owner decides the scope.\n")), []);
  assert.deepEqual(checkReview(review("BLOCKED", "- **Question:** which scope does the owner want?\n")), []);
});

test("BLOCKED with no Blocking finding and no question fails", () => {
  const problems = checkReview(review("BLOCKED", "- H1 `a.mjs:1` Wrong.\n"));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /BLOCKED needs/);
});

test("CRLF line endings pass", () => {
  const text = review("CHANGES-REQUESTED", "- M1 `a.mjs:1` x\n").replace(/\n/g, "\r\n");
  assert.deepEqual(checkReview(text), []);
});

test("the real review files of #318 and #319 pass", async () => {
  for (const name of ["review-318", "review-318-r2", "review-319"]) {
    const text = await readFile(join(repoRoot, "test", "fixtures", `${name}.txt`), "utf8");
    assert.deepEqual(checkReview(text), [], name);
  }
});

function run(...args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

test("the CLI exits 0 for a good file and prints a summary", async () => {
  const root = await makeTree({ "r.txt": review("APPROVE-RECOMMENDED") });
  try {
    const result = run(join(root, "r.txt"));
    assert.equal(result.status, 0);
    assert.match(result.stdout, /review file is valid/);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 1 and prints each problem", async () => {
  const root = await makeTree({ "r.txt": "nothing here\n" });
  try {
    const result = run(join(root, "r.txt"));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /verdict/);
    assert.match(result.stderr, /40-character/);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 2 with no argument or an unreadable file", () => {
  assert.equal(run().status, 2);
  assert.match(run().stderr, /Usage/);
  const result = run(join(repoRoot, "no-such-review.txt"));
  assert.equal(result.status, 2);
  assert.match(result.stderr, /cannot read/);
});

test("code-review tells the reviewer to run the check before it posts", async () => {
  const text = await readFile(join(repoRoot, "skills", "code-review", "SKILL.md"), "utf8");
  assert.match(
    text,
    /\[check-review\]\(https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/scripts\/check-review\.mjs\)/,
  );
  assert.match(text, /node scripts\/check-review\.mjs <file>/);
  assert.match(text, /If the repository has a copy of \[check-review\]\([^)]*\), run it on the file/);
  assert.match(text, /write NOT RUN for this step in the verification item/);
});

test("the merge rule names the head-commit match", async () => {
  const text = await readFile(join(repoRoot, "workflow", "review-and-merge.md"), "utf8");
  assert.match(text, /gh pr merge --squash --match-head-commit <sha>/);
});

test("a later item with the same ID is a reference and needs no file:line", () => {
  const body = "### M1. Problem\n\n- `a.mjs:1`\n\n## Blast radius\n\n- M1. A later change fails.\n";
  assert.deepEqual(checkReview(review("CHANGES-REQUESTED", body)), []);
});

test("the first item with an ID defines the finding", () => {
  const body = "- M1. No reference here.\n- M1. `a.mjs:1` A later item.\n";
  const problems = checkReview(review("CHANGES-REQUESTED", body));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /M1.*file:line/);
});

test("an ID can end with a dot, a colon or a bracket", () => {
  for (const id of ["M1.", "H1:", "L1)", "B1"]) {
    assert.deepEqual(checkReview(review("CHANGES-REQUESTED", `- ${id} \`a.mjs:1\` x\n`)), [], id);
  }
});

test("the real review file of #321 passes", async () => {
  const text = await readFile(join(repoRoot, "test", "fixtures", "review-321.txt"), "utf8");
  assert.deepEqual(checkReview(text), []);
});

test("a pull request text or commit location replaces file:line", () => {
  for (const where of [
    "Pull request title.",
    "pull request body, Evidence section.",
    "PR title",
    "PR BODY",
    "commit abcdef1",
    `Commit ${SHA}`,
  ]) {
    const body = `### L1. x\n\n- ${where}\n`;
    assert.deepEqual(checkReview(review("CHANGES-REQUESTED", body)), [], where);
  }
});

test("a vague location still fails", () => {
  for (const where of ["somewhere in the code", "commit abc12", "the PR text"]) {
    const body = `### L1. x\n\n- ${where}\n`;
    assert.match(checkReview(review("CHANGES-REQUESTED", body)).join(), /L1.*file:line/, where);
  }
});

test("the real review file of #322 passes", async () => {
  const text = await readFile(join(repoRoot, "test", "fixtures", "review-322.txt"), "utf8");
  assert.deepEqual(checkReview(text), []);
});

test("a status line of an earlier finding needs no file:line", () => {
  const body = "- H1, a title: **fixed**. The code changed.\n- L1, other: fixed.\n- L2 (`a.mjs:1`): Open. x\n";
  assert.deepEqual(checkReview(review("CHANGES-REQUESTED", body)), []);
});

test("an open status line is an open finding for APPROVE-RECOMMENDED", () => {
  const body = "- H1, a title: **fixed**. x\n- L3, a title: **open**. It is fixed in part.\n";
  const problems = checkReview(review("APPROVE-RECOMMENDED", body));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /L3.*not marked fixed/);
});

test("a status line with only fixed statuses passes APPROVE-RECOMMENDED", () => {
  const body = "- H1, a title: **fixed**. x\n- M1, a title: fixed. y\n";
  assert.deepEqual(checkReview(review("APPROVE-RECOMMENDED", body)), []);
});

test("a status word after the first sentence does not make a status line", () => {
  const body = "- H1, a problem. The old code was fixed once.\n";
  assert.match(checkReview(review("CHANGES-REQUESTED", body)).join(), /H1.*file:line/);
});

test("a table status row needs no file:line, and an open row is open", () => {
  const body = "| ID | Status | Note |\n| --- | --- | --- |\n| H1 | Fixed | x |\n| L1 | **open** | y |\n";
  assert.deepEqual(checkReview(review("CHANGES-REQUESTED", body)), []);
  const problems = checkReview(review("APPROVE-RECOMMENDED", body));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /L1.*not marked fixed/);
});

test("the real review file of #320 round 2 passes", async () => {
  const text = await readFile(join(repoRoot, "test", "fixtures", "review-320-r2.txt"), "utf8");
  assert.deepEqual(checkReview(text), []);
});

test("free text with the word fixed does not mark a finding as fixed", () => {
  for (const text of [
    "- L1 `a.mjs:1` Small point, to be fixed in a follow-up.",
    "- M1 `a.mjs:1` The fixed-width parser drops a byte.",
    "- H1 `a.mjs:1`: fixed-size buffer overflows.",
    "- M1 `a.mjs:1` The test is weak. It will be fixed in a later PR.",
  ]) {
    const problems = checkReview(review("APPROVE-RECOMMENDED", `${text}\n`));
    assert.equal(problems.length, 1, text);
    assert.match(problems[0], /not marked fixed/);
  }
});

test("the status forms mark a finding as fixed", () => {
  const body = "- H1 (`a.mjs:1`): **fixed**.\n- M1, title **fixed**. x\n- L1: Fixed\n| L2 | Fixed | x |\n";
  assert.deepEqual(checkReview(review("APPROVE-RECOMMENDED", body)), []);
});

test("a finding in another form is still a finding", () => {
  for (const text of [
    "M1. `a.mjs:1` The code is wrong.",
    "**M1** `a.mjs:1` The code is wrong.",
    "- [M1] `a.mjs:1` Wrong.",
    "- Medium M1 `a.mjs:1` Wrong.",
    "- **High H1** `a.mjs:1` Wrong.",
  ]) {
    const problems = checkReview(review("APPROVE-RECOMMENDED", `${text}\n`));
    assert.equal(problems.length, 1, text);
    assert.match(problems[0], /not marked fixed/);
    assert.match(checkReview(review("CHANGES-REQUESTED", `${text.replace("`a.mjs:1` ", "")}\n`)).join(), /file:line/, text);
  }
});

test("a paragraph line that is a finding needs the line to start a paragraph", () => {
  assert.equal(checkReview(review("APPROVE-RECOMMENDED", "Text\nM1. `a.mjs:1` x\n")).length, 0);
  assert.equal(checkReview(review("APPROVE-RECOMMENDED", "### Finding M1: wrong\n\n`a.mjs:1`\n")).length, 1);
});

test("only a head line gives the head SHA", () => {
  const other = "0d206c627eb93ec2a388d0c02ae9a8902244b59b";
  const text = `Verdict: APPROVE-RECOMMENDED\nMerge-base: ${other}\n`;
  assert.match(checkReview(text).join(), /40-character/);
  assert.match(checkReview(`${text}Earlier head: ${other}\n`).join(), /40-character/);
  assert.deepEqual(checkReview(`${text}Head SHA: ${SHA}\n`), []);
  assert.deepEqual(checkReview(`Verdict: APPROVE-RECOMMENDED ${SHA}\n`), []);
});

test("a question mark inside a finding does not make a BLOCKED question", () => {
  const problems = checkReview(review("BLOCKED", "- H1 `a.mjs:1` Is this right?\n"));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /BLOCKED needs/);
});

test("CHANGES-REQUESTED with only fixed findings fails", () => {
  const problems = checkReview(review("CHANGES-REQUESTED", "- H1, x: **fixed**.\n"));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /not marked fixed/);
});

test("a table status cell can have words after the status", () => {
  const body = "| M1 title | Fixed (round 2) | x |\n| L1 title | Fixed-size note | x |\n";
  const problems = checkReview(review("CHANGES-REQUESTED", body));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /L1.*file:line/);
});

test("a new finding can reuse the ID of a status line, and N IDs count", () => {
  const body = "| M1 | Fixed | x |\n\n### M1. New\n\n- `a.mjs:1`\n\n### N2. Other\n\n- `b.mjs:2`\n";
  assert.deepEqual(checkReview(review("CHANGES-REQUESTED", body)), []);
  assert.equal(checkReview(review("APPROVE-RECOMMENDED", body)).length, 2);
});

test("a list item after a status line with the same ID is a reference", () => {
  const body = "- L5, title: **fixed**. x\n- L5 mutation (no reset): 1 test failed.\n";
  assert.deepEqual(checkReview(review("APPROVE-RECOMMENDED", body)), []);
});

test("a bold word inside the problem text is not a status", () => {
  const problems = checkReview(review("APPROVE-RECOMMENDED", "- M1 `a.mjs:1` The **fixed** buffer overflows.\n"));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /M1.*not marked fixed/);
});

test("code-review defines the status form", async () => {
  const text = await readFile(join(repoRoot, "skills", "code-review", "SKILL.md"), "utf8");
  assert.match(text, /- <ID>, <short title>: \*\*fixed\*\*\./);
  assert.match(text, /table row with a Fixed or Open cell/);
});

test("check-review is not an npm check script", async () => {
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts["check:review"], undefined);
});
