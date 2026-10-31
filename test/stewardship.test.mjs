import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/stewardship.md";

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("the stewardship page states the levels, the signals and the scenarios", async () => {
  const page = await text("architecture/stewardship.md");
  for (const part of [
    "### Awareness",
    "### Analysis",
    "### Intervention",
    "new public interface",
    "module boundary",
    "workaround",
    "same knowledge",
    "principles conflict",
    "compatibility",
    "performance",
    "security",
    "### Typo fix",
    "### Normal feature",
    "### New dependency",
    "### Public API change",
    "### Unrelated architectural issue",
    "### Obsolete ADR",
    "### DRY and coupling",
    "no fixed rank",
    "workflow/safety.md",
    "workflow/work.md",
    "workflow/roles.md",
  ]) {
    assert.ok(page.includes(part), `missing ${part}`);
  }
  assert.match(page, /keep the current design/i);
  assert.match(page, /does not give permission/i);
  assert.match(page, /do not (?:add|write) (?:a|an) (?:phase|checklist|report)/i);
});

test("the index and the agent entry link the stewardship page", async () => {
  const index = await text("architecture/index.md");
  const agents = await text("AGENTS.md");
  assert.match(index, /\[stewardship\.md\]\(stewardship\.md\)/);
  assert.match(agents, /\[architecture\/stewardship\.md\]\(architecture\/stewardship\.md\)/);
});

test("triage reads stewardship only for a signal or a human request", async () => {
  const triage = await text("skills/triage/SKILL.md");
  assert.ok(triage.includes(raw));
  assert.match(triage, /Routine work does not read/);
  assert.match(triage, /human asks/);
  for (const signal of [
    "new public interface",
    "module boundary",
    "workaround",
    "same knowledge",
    "principles conflict",
    "compatibility",
  ]) {
    assert.ok(triage.includes(signal), `triage does not name ${signal}`);
  }
});

test("specialized skills point at stewardship and do not copy it", async () => {
  const skills = [
    "skills/apply-architecture/SKILL.md",
    "skills/plan-work/SKILL.md",
    "skills/tdd-loop/SKILL.md",
    "skills/code-review/SKILL.md",
  ];
  for (const skill of skills) {
    const body = await text(skill);
    assert.ok(body.includes(raw), `${skill} does not link stewardship`);
    assert.equal(body.includes("### Typo fix"), false, `${skill} copies a scenario`);
    assert.equal(body.includes("new public interface"), false, `${skill} copies a signal`);
  }
});
