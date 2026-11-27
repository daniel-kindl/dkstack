import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";

test("incident analysis separates observation and remediation", async () => {
  const page = await readFile(new URL("../coding/incident-analysis.md", import.meta.url), "utf8");
  assert.match(page, /preserve/i);
  assert.match(page, /confirmed events/);
  assert.match(page, /mitigation/);
  assert.match(page, /owner-only/);
});

test("debugging requires falsifiable hypotheses and regression evidence", async () => {
  const page = await readFile(new URL("../coding/debugging.md", import.meta.url), "utf8");
  const skill = await readFile(new URL("../skills/investigate-bug/SKILL.md", import.meta.url), "utf8");
  assert.match(page, /falsifiable prediction/);
  assert.match(skill, /competing hypotheses/);
  assert.match(skill, /NOT RUN/);
});
