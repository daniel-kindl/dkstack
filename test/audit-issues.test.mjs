import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, chmodSync, mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  typeFindings, headingFindings, textRelations, relationFindings, missingLabels, audit,
} from "../scripts/audit-issues.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "audit-issues.mjs");
const src = join(repoRoot, "test", "fixtures", "audit-issues");
const fixture = (name) => JSON.parse(readFileSync(join(src, `${name}.json`), "utf8"));
const issues = fixture("issues");
const issue = (n) => issues.find((i) => i.number === n);

test("an issue needs exactly one type label", () => {
  assert.deepEqual(typeFindings(issue(1)), []);
  assert.deepEqual(typeFindings(issue(2)), ["#2 has no type: label"]);
  assert.deepEqual(typeFindings(issue(3)), ["#3 has 2 type: labels (type:bug, type:chore)"]);
  // needs:decision does not skip an issue.
  assert.deepEqual(typeFindings({ number: 9, labels: [{ name: "needs:decision" }] }), ["#9 has no type: label"]);
});

test("an issue needs a Goal and an Acceptance criteria heading of level 2 or 3", () => {
  assert.deepEqual(headingFindings(issue(1)), []);
  assert.deepEqual(headingFindings(issue(3)), []);
  assert.deepEqual(headingFindings(issue(4)), ["#4 has no Goal heading", "#4 has no Acceptance criteria heading"]);
  assert.deepEqual(headingFindings({ number: 7, body: "#### Goal\n\n## Acceptance criteria\n" }), ["#7 has no Goal heading"]);
  assert.deepEqual(headingFindings({ number: 8, body: null }), ["#8 has no Goal heading", "#8 has no Acceptance criteria heading"]);
});

test("textRelations finds the relations that the body writes in text", () => {
  assert.deepEqual(textRelations(issue(1).body), { parent: null, blockedBy: [], planItem: false, orderAfter: false });
  assert.deepEqual(textRelations(issue(5).body), { parent: 200, blockedBy: [1], planItem: false, orderAfter: true });
  assert.deepEqual(textRelations(issue(6).body), { parent: 200, blockedBy: [1], planItem: true, orderAfter: false });
  assert.deepEqual(textRelations("Blocked by: #1, #2\n").blockedBy, [1, 2]);
  assert.deepEqual(textRelations("Parent: docs/issues/0001.md\n").parent, null);
  assert.deepEqual(textRelations(null).blockedBy, []);
});

test("a text relation needs a matching relation in the tracker", () => {
  const none = fixture("relations-5");
  const set = fixture("relations-6");
  assert.deepEqual(relationFindings(issue(5), none), [
    "#5 writes Parent: #200 in text, and the tracker has no parent",
    "#5 writes Blocked by: #1 in text, and the tracker has no blocker #1",
    "#5 writes Order: after in text, and the tracker has no blocker",
  ]);
  assert.deepEqual(relationFindings(issue(6), none), [
    "#6 writes Parent: #200 in text, and the tracker has no parent",
    "#6 writes Blocked by: #1 in text, and the tracker has no blocker #1",
    "#6 writes Plan item P in text, and the tracker has no parent",
  ]);
  assert.deepEqual(relationFindings(issue(6), set), []);
  assert.deepEqual(relationFindings(issue(5), set), []);
  const other = { parent: { number: 7 }, blockedBy: { nodes: [{ number: 2 }] } };
  assert.deepEqual(relationFindings(issue(5), other), [
    "#5 writes Parent: #200 in text, and the tracker parent is #7",
    "#5 writes Blocked by: #1 in text, and the tracker has no blocker #1",
  ]);
});

test("missingLabels lists each type and priority label that the repository lacks", () => {
  assert.deepEqual(missingLabels(fixture("labels").map((l) => l.name)), [
    "type:refactor", "type:research", "priority:p2", "priority:p3",
  ]);
  assert.equal(missingLabels(["type:bug", "type:feature", "type:chore", "type:refactor", "type:docs",
    "type:research", "priority:p0", "priority:p1", "priority:p2", "priority:p3"]).length, 0);
});

function fakeGh(responses) {
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    const key = args.join(" ");
    for (const [match, value] of Object.entries(responses)) {
      if (key.startsWith(match)) {
        if (value instanceof Error) throw value;
        return value;
      }
    }
    throw new Error(`no response for ${key}`);
  };
  return { gh, calls };
}

test("audit reads the tracker only for an issue that has a text relation", () => {
  const { gh, calls } = fakeGh({
    "issue list": JSON.stringify(issues),
    "label list": JSON.stringify(fixture("labels")),
    "issue view 5": JSON.stringify(fixture("relations-5")),
    "issue view 6": JSON.stringify(fixture("relations-6")),
  });
  const items = audit("o/r", gh);
  assert.deepEqual(items.map((i) => [i.name, i.status]), [
    ["type labels", "FAIL"], ["headings", "FAIL"], ["relations", "FAIL"], ["labels", "FAIL"],
  ]);
  assert.deepEqual(calls.map((c) => c.slice(0, 2).join(" ")).sort(), [
    "issue list", "issue view", "issue view", "label list",
  ]);
});

test("audit prints NOT RUN, never PASS, for a response it cannot read", () => {
  const bad = fakeGh({ "issue list": "not json", "label list": new Error("boom") });
  assert.deepEqual(audit("o/r", bad.gh).map((i) => i.status), ["NOT RUN", "NOT RUN", "NOT RUN", "NOT RUN"]);
  const ok = fakeGh({
    "issue list": JSON.stringify(issues),
    "label list": JSON.stringify([{ name: "type:bug" }]),
    "issue view 5": "{",
    "issue view 6": JSON.stringify(fixture("relations-6")),
  });
  const items = audit("o/r", ok.gh);
  assert.equal(items.find((i) => i.name === "relations").status, "NOT RUN");
  const shape = fakeGh({ "issue list": "{}", "label list": "[1]" });
  assert.equal(audit("o/r", shape.gh)[0].status, "NOT RUN");
  const clean = fakeGh({
    "issue list": JSON.stringify([issue(1)]),
    "label list": JSON.stringify(["type:bug", "type:feature", "type:chore", "type:refactor", "type:docs",
      "type:research", "priority:p0", "priority:p1", "priority:p2", "priority:p3"].map((name) => ({ name }))),
  });
  assert.deepEqual(audit("o/r", clean.gh).map((i) => i.status), ["PASS", "PASS", "PASS", "PASS"]);
});

// The script with a fake gh on PATH. No network.
function run(args, { fail = "" } = {}) {
  const bin = mkdtempSync(join(tmpdir(), "fake-gh-"));
  const log = join(bin, "calls.log");
  copyFileSync(join(src, "gh"), join(bin, "gh"));
  chmodSync(join(bin, "gh"), 0o755);
  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: {
      ...process.env, PATH: `${bin}:${process.env.PATH}`,
      FAKE_GH_SRC: src, FAKE_GH_LOG: log, FAKE_GH_FAIL: fail,
    },
  });
  const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [];
  rmSync(bin, { recursive: true, force: true });
  return { ...result, calls };
}

test("the tool lists the findings, exits 1 and sends only read commands", { skip: process.platform === "win32" }, () => {
  const result = run(["o/r"]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /FAIL type labels/);
  assert.match(result.stdout, /#2 has no type: label/);
  assert.match(result.stdout, /#4 has no Goal heading/);
  assert.match(result.stdout, /#5 writes Parent: #200 in text/);
  assert.match(result.stdout, /type:refactor/);
  assert.deepEqual(result.calls.map((c) => c.split(" ").slice(0, 2).join(" ")).sort(), [
    "issue list", "issue view", "issue view", "label list",
  ]);
  for (const call of result.calls) {
    assert.doesNotMatch(call, /\b(create|edit|close|reopen|delete|comment|transfer|pin|lock|develop|api)\b/);
    assert.match(call, /^(issue list|label list|issue view)\b/);
  }
});

test("the tool exits 2 and prints NOT RUN when gh fails", { skip: process.platform === "win32" }, () => {
  const result = run(["o/r"], { fail: "issues labels" });
  assert.equal(result.status, 2);
  assert.match(result.stdout, /NOT RUN type labels/);
  assert.match(result.stdout, /NOT RUN labels/);
  assert.doesNotMatch(result.stdout, /PASS/);
});

test("the tool exits 2 with a usage line for a missing or bad repository", () => {
  for (const args of [[], ["no-slash"], ["a/b", "c"]]) {
    const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage: node scripts\/audit-issues\.mjs <owner\/repo>/);
  }
});

// Text in code or in a comment is an example, not a relation and not a heading.
test("code spans, fenced blocks and comments do not count as text", () => {
  const none = { parent: null, blockedBy: [], planItem: false, orderAfter: false };
  for (const body of [
    "Use `Parent: #5` and `Order: after` here.\n",
    "```\nParent: #5\nBlocked by: #1\nPlan item P2\nOrder: after\n```\n",
    "~~~md\nParent: #5\nOrder: after\n~~~\n",
    "<!-- Parent: #5\nBlocked by: #1 -->\n",
  ]) {
    assert.deepEqual(textRelations(body), none, body);
  }
  assert.equal(textRelations("Use `x` then\nParent: #5\n").parent, 5);
  assert.equal(textRelations("```\nx\n```\nOrder: after\n").orderAfter, true);
  assert.equal(headingFindings({ number: 3, body: "```md\n## Goal\n\n## Acceptance criteria\n```\n" }).length, 2);
  assert.equal(headingFindings({ number: 3, body: "<!--\n## Goal\n-->\n## Acceptance criteria\n" }).length, 1);
});

test("npm has audit:issues, and it is not a check script or part of validate", async () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts["audit:issues"], "node scripts/audit-issues.mjs");
  assert.ok(!pkg.scripts.check.includes("audit:"));
  const workflow = readFileSync(join(repoRoot, ".github/workflows/validate.yml"), "utf8");
  assert.doesNotMatch(workflow, /audit:issues/);
});
