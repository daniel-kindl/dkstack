import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
// The numbered steps of a skill, keyed by number.
const steps = (text) => Object.fromEntries([...text.matchAll(/^(\d+)\. (.+)$/gm)].map((m) => [Number(m[1]), m[2]]));

test("incident analysis names each owner-only mitigation and stops the agent", async () => {
  const page = await read("coding/incident-analysis.md");
  const flat = page.replace(/\s+/g, " ");
  assert.ok(flat.includes(
    "Some mitigations are owner-only: a production deploy, redeploy or deploy rollback, a release, and " +
    "a change to production settings or infrastructure. Do not start one. " +
    "Stop and ask the owner, and give the evidence. See [safety](../workflow/safety.md#rules).",
  ));
  assert.ok(flat.includes(
    "A production migration follows [production migrations](data-integrity.md#production-migrations).",
  ));
  assert.ok(flat.includes("An incident does not give permission to deploy or to change infrastructure."));
});

test("incident analysis keeps evidence, a mitigation and a fix apart", async () => {
  const flat = (await read("coding/incident-analysis.md")).replace(/\s+/g, " ");
  for (const sentence of [
    "Preserve the relevant logs and timestamps. Do not collect credentials or personal data.",
    "Diagnose with read-only actions first.",
    "Keep a mitigation that reduces the impact apart from a verified fix of the root cause.",
    "Build a timeline from confirmed events and source references.",
    "Never invent a timeline. Never say that a mitigation ran when it did not.",
  ]) assert.ok(flat.includes(sentence), sentence);
});

test("debugging needs falsifiable hypotheses and the bug-fix cycle", async () => {
  const flat = (await read("coding/debugging.md")).replace(/\s+/g, " ");
  for (const sentence of [
    "When the cause is not certain, test two or more explanations.",
    "Give each hypothesis a falsifiable prediction.",
    "Change one variable at a time.",
    "Verify the fix with the [bug-fix cycle](../tdd/regression-testing.md#bug-fix-cycle).",
    "follow [boundaries and evidence](../tdd/index.md#boundaries-and-evidence).",
    "For a repeatable procedure use [investigate-bug](../skills/investigate-bug/SKILL.md).",
  ]) assert.ok(flat.includes(sentence), sentence);
});

test("investigate-bug tests hypotheses, then hands the fix to tdd-loop", async () => {
  const skill = await read("skills/investigate-bug/SKILL.md");
  const step = steps(skill);
  assert.equal(step[5], "Write at least two competing hypotheses when the cause is uncertain.");
  assert.equal(step[6], "For each hypothesis, name a result that would falsify it.");
  assert.equal(step[9], `Use [tdd-loop](${RAW}skills/tdd-loop/SKILL.md) for the actual fix.`);
  assert.equal(step[10], "Re-run the reproduction, regression test, and affected existing checks.");
});

test("investigate-bug claims no cause or fix without a reproduction", async () => {
  const skill = await read("skills/investigate-bug/SKILL.md");
  const section = skill.split("## When reproduction is unavailable")[1].split("\n## ")[0];
  const flat = section.replace(/\s+/g, " ");
  assert.ok(flat.includes("- Do not claim a confirmed root cause or a verified fix."));
  assert.ok(flat.includes("Report each check that did not run as NOT RUN"));
  assert.ok(skill.includes("- Do not apply speculative patches until a hypothesis has supporting evidence."));
});

test("triage routes a bug and an outage to their owners", async () => {
  const triage = await read("skills/triage/SKILL.md");
  const lines = triage.split("\n");
  assert.ok(lines.includes(`- Bug, flaky test, regression, or unexpected behavior: [investigate-bug](${RAW}skills/investigate-bug/SKILL.md)`));
  assert.ok(lines.includes(`- Incident or service outage: [incident analysis](${RAW}coding/incident-analysis.md)`));
  const bugFix = lines.find((line) => line.startsWith("- Bug fix: "));
  const order = ["skills/investigate-bug/", "skills/tdd-loop/", "skills/code-review/"].map((path) => bugFix.indexOf(path));
  assert.ok(order.every((at) => at > 0), bugFix);
  assert.deepEqual([...order].sort((a, b) => a - b), order, "investigate-bug, then tdd-loop, then code-review");
  assert.ok(!triage.includes("Bug or unexpected behavior: [coding/debugging.md]"), "the old route is gone");
});

test("the bisect tip sorts each exit code into one group", async () => {
  const tips = await read("tips/index.md");
  assert.ok(tips.includes("git bisect run <test-command>   # exit 0: good, 125: skip, any other code from 1 to 127: bad, 128 or more: bisect stops"));
  assert.ok(tips.includes("- [Isolate a regression with git bisect](#isolate-a-regression-with-git-bisect)"));
});

// The eval suite of one skill, from evals/skill-cases.json.
async function evalSuite(skill) {
  const suite = JSON.parse(await read("evals/skill-cases.json"));
  const entry = suite.skills.find((item) => item.skill === skill);
  assert.ok(entry, `${skill} has an eval suite`);
  const positives = entry.queries.filter((q) => q.should_trigger);
  const negatives = entry.queries.filter((q) => !q.should_trigger);
  assert.ok(positives.length >= 2 && negatives.length >= 2, `${skill}: two positive and two negative cases`);
  return { positives, negatives };
}

// The positive case whose assertions match each pattern. Each path needs its own case.
function caseFor(positives, ...patterns) {
  const found = positives.find((q) => patterns.every((p) => p.test(q.assertions.join("\n"))));
  assert.ok(found, `a positive case asserts ${patterns.join(" and ")}`);
  return found.id;
}

test("investigate-bug eval cases cover hypotheses, bisect, no reproduction and an outage", async () => {
  const { positives } = await evalSuite("investigate-bug");
  const ids = [
    caseFor(positives, /two competing hypotheses and names a result that would falsify/, /Applies no fix before a hypothesis has supporting evidence/),
    caseFor(positives, /git bisect/, /Hands the fix to tdd-loop with a regression test that fails before the fix/),
    caseFor(positives, /Does not claim a confirmed root cause or a verified fix/, /NOT RUN/),
    caseFor(positives, /read-only actions first/, /Does not deploy, roll back, release or change production settings, and asks the owner/),
  ];
  assert.equal(new Set(ids).size, 4, "each path has its own case");
});
