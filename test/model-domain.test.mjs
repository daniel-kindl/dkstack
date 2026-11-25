import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = (path) => readFile(join(repoRoot, path), "utf8");
const read = async (path) => (await raw(path)).replace(/\s+/g, " ");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const SKILL = `${RAW}skills/model-domain/SKILL.md`;

// Issue #341: the model-domain skill applies architecture/domain-modeling.md.
test("the model-domain skill has the triggers and no invocation key", async () => {
  const text = await raw("skills/model-domain/SKILL.md");
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)[1];
  assert.match(front, /^name: model-domain$/m);
  assert.ok(front.includes("Triggers: domain model, ddd, bounded context, aggregate"));
  assert.doesNotMatch(front, /user-invocable|disable-model-invocation/);
});

test("step 1 is the gate and sends skipped work to domain-glossary", async () => {
  const text = await read("skills/model-domain/SKILL.md");
  const step1 = /1\. (.*?) 2\. /.exec(text)[1];
  assert.ok(step1.includes("Skip this skill for a CRUD change."));
  assert.ok(step1.includes("Skip this skill for a change that uses the model and does not change it."));
  assert.ok(step1.includes("Then only `domain-glossary` applies."));
  assert.ok(text.includes(`${RAW}architecture/domain-modeling.md`));
  assert.ok(text.includes(`${RAW}skills/domain-glossary/SKILL.md`));
});

test("the strategic steps come before the tactical steps", async () => {
  const text = await raw("skills/model-domain/SKILL.md");
  const at = (s) => text.search(s);
  assert.ok(at(/bounded context/i) !== -1);
  assert.ok(at(/^\d\. .*context map/im) < at(/^\d\. .*aggregate/im));
  assert.ok(at(/^\d\. .*aggregate/im) < at(/^\d\. .*value object/im));
  assert.ok(at(/^\d\. .*value object/im) < at(/^\d\. .*(domain )?event/im));
});

test("the output is a Domain model block with its four parts", async () => {
  const text = await read("skills/model-domain/SKILL.md");
  assert.ok(text.includes("## Domain model"));
  for (const part of ["Contexts:", "Aggregates:", "Value objects:", "Events:"]) {
    assert.ok(text.includes(part), `missing: ${part}`);
  }
  assert.ok(text.includes("Put the block in the issue."));
});

test("a hard to reverse boundary goes to write-adr", async () => {
  const text = await read("skills/model-domain/SKILL.md");
  assert.ok(text.includes("When a boundary is hard to reverse and meets the ADR test, use"));
  assert.ok(text.includes(`${RAW}skills/write-adr/SKILL.md`));
});

test("the Subagents section uses one code reader, tier medium and effort medium", async () => {
  const text = await read("skills/model-domain/SKILL.md");
  const sub = text.split("## Subagents")[1];
  assert.ok(sub.includes("one code reader"));
  assert.ok(sub.includes("tier medium, effort medium"));
  assert.ok(sub.includes("file and line"));
  assert.ok(sub.includes("The owner decides each boundary."));
  assert.ok(sub.includes("complete without your context"));
  assert.ok(sub.includes("word limit"));
  assert.ok(sub.includes('"Report to me only. Do not change files, commit, push, post, approve or merge."'));
  assert.ok(sub.includes("If you cannot start subagents, do the steps one at a time in the order of this skill."));
});

test("triage, the index, clarify-intent and plan-work link the skill", async () => {
  const triage = await read("skills/triage/SKILL.md");
  assert.ok(triage.includes(`(${SKILL})`));
  assert.match(triage, /Domain design, modeling or specification: \[model-domain\]/);
  assert.match(await read("skills/index.md"), /\[model-domain\]\(model-domain\/SKILL\.md\) \(both\)/);
  assert.ok((await read("skills/clarify-intent/SKILL.md")).includes(`(${SKILL})`));
  const plan = await read("skills/plan-work/SKILL.md");
  assert.ok(plan.includes(`(${SKILL})`));
  const step1 = /1\. (.*?) 2\. /.exec(plan)[1];
  assert.ok(step1.includes("If the issue has a Domain model block, take its invariants as acceptance criteria."));
});
