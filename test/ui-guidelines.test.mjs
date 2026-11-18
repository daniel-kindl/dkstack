import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function document(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("UI standards and skills are linked from the entry points", async () => {
  const [agents, readme, index, triage] = await Promise.all([
    document("AGENTS.md"),
    document("README.md"),
    document("skills/index.md"),
    document("skills/triage/SKILL.md"),
  ]);

  assert.match(agents, /ui\/index\.md/);
  assert.match(readme, /ui\/index\.md/);
  assert.match(index, /ui-design\/SKILL\.md/);
  assert.match(index, /ui-review\/SKILL\.md/);
  assert.match(triage, /ui-design\/SKILL\.md/);
  assert.match(triage, /ui-review\/SKILL\.md/);
  assert.match(triage, /backend-only/);
});

test("UI skills enforce their role boundaries", async () => {
  const [design, review, standards] = await Promise.all([
    document("skills/ui-design/SKILL.md"),
    document("skills/ui-review/SKILL.md"),
    document("ui/design-systems.md"),
  ]);

  assert.match(design, /tdd-loop/);
  assert.match(design, /visual-verification\.md/);
  assert.match(review, /Read-only by default/);
  assert.match(review, /code-review/);
  assert.match(standards, /no visual direction exists/);
});

test("Rendered verification has explicit evidence and fallback states", async () => {
  const verification = await document("ui/visual-verification.md");
  for (const status of ["PASS", "FAIL", "NOT RUN", "NOT APPLICABLE"]) {
    assert.ok(verification.includes(status), `Missing ${status} result`);
  }
  assert.match(verification, /not invent screenshots/);
});

test("UI planning and code review are conditional", async () => {
  const [plan, tdd, review] = await Promise.all([
    document("skills/plan-work/SKILL.md"),
    document("skills/tdd-loop/SKILL.md"),
    document("skills/code-review/SKILL.md"),
  ]);
  assert.match(tdd, /backend-only/);
  assert.match(review, /ui-review\/SKILL\.md/);
});
