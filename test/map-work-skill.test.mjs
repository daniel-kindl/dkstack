import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = join(root, "skills", "map-work", "SKILL.md");

async function skillText() {
  return (await readFile(skillPath, "utf8")).replace(/\s+/g, " ");
}

test("triage sends one-PR work to plan-work and multi-PR work to map-work", async () => {
  const triage = (await readFile(join(root, "skills", "triage", "SKILL.md"), "utf8"))
    .replace(/\s+/g, " ");
  assert.match(triage, /one pull request.*plan-work/i);
  assert.match(triage, /more than one pull request.*map-work/i);
  assert.match(triage, /map-work\/SKILL\.md/);
});

test("map-work plans bounded children from an accepted parent", async () => {
  const skill = await skillText();
  assert.match(skill, /existing parent issue/);
  assert.match(skill, /preflight/);
  assert.match(skill, /duplicate issues/);
  assert.match(skill, /repository code/);
  assert.match(skill, /clarify-intent/);
  assert.match(skill, /apply-architecture/);
  assert.match(skill, /acceptance criteria/);
  assert.match(skill, /bounded/);
  assert.match(skill, /fits one pull request/);
});

test("map-work records native relationships and checks readiness", async () => {
  const skill = await skillText();
  assert.match(skill, /native parent\/sub-issue/);
  assert.match(skill, /native blocker link/);
  assert.match(skill, /milestone/);
  assert.match(skill, /type.*lifecycle state.*agent eligibility/);
  assert.match(skill, /reread.*relationships/i);
  assert.match(skill, /agent:ready.*only for unblocked children.*readiness checks pass/);
  assert.match(skill, /map summary.*parent issue/);
  assert.match(skill, /\.maps\//);
});

test("map-work fails closed on unsupported facts and unclear authority", async () => {
  const skill = await skillText();
  assert.match(skill, /missing.*unsupported.*unverified/);
  assert.match(skill, /write permission/);
  assert.match(skill, /stop.*native relationship/);
  assert.match(skill, /owner.*decision/);
  assert.match(skill, /do not.*comment.*source/i);
});

test("map-work ends the mapping session before child implementation", async () => {
  const skill = await skillText();
  assert.match(skill, /context-sharing subagent/);
  assert.match(skill, /must not implement.*same session/);
  assert.match(skill, /do not open an implementation pull request/i);
  assert.match(skill, /stop after publishing/i);
  assert.match(skill, /fresh independent session.*read.*tracker.*repository/);
  const index = await readFile(join(root, "skills", "index.md"), "utf8");
  assert.match(index, /\[map-work\]\(map-work\/SKILL\.md\)/);
});

test("mapping PR does not close the parent objective", async () => {
  const skill = await skillText();
  assert.match(skill, /mapping pull request.*independent review/);
  assert.match(skill, /without a closing keyword/);
  assert.match(skill, /parent.*lifecycle state/);
  assert.match(skill, /planning.*acceptance criteria.*prerequisite.*ready.*full readiness check/);
});

test("required blockers stop the whole map and child labels reflect eligibility", async () => {
  const skill = await skillText();
  assert.match(skill, /requires.*blocker link.*stop the entire map/i);
  assert.match(skill, /human-only/);
  assert.match(skill, /blocked.*planning/i);
});
