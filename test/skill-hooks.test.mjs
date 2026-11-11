import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function skill(name) {
  return (await readFile(join(repoRoot, "skills", name, "SKILL.md"), "utf8")).replace(/\s+/g, " ");
}

test("the guidance skills do not link the workflow process pages", async () => {
  for (const name of ["tdd-loop", "bootstrap", "apply-architecture", "clarify-intent", "code-review"]) {
    const text = await skill(name);
    for (const page of [/workflow\/feature-plans\.md/, /workflow\/claims\.md/, /workflow\/work\.md/,
      /workflow\/preflight\.md/]) {
      assert.doesNotMatch(text, page, `${name} links ${page}`);
    }
  }
});

test("tdd-loop has no plan item, claim or mapped issue rule", async () => {
  const text = await skill("tdd-loop");
  assert.doesNotMatch(text, /If the feature has an active plan/);
  assert.doesNotMatch(text, /verified claim/i);
  assert.doesNotMatch(text, /mapped issue/i);
});

test("bootstrap has no tracker preflight step", async () => {
  const text = await skill("bootstrap");
  assert.doesNotMatch(text, /preflight/i);
  assert.doesNotMatch(text, /catalog labels/);
});

test("apply-architecture and clarify-intent have no plan paragraph", async () => {
  for (const name of ["apply-architecture", "clarify-intent"]) {
    assert.doesNotMatch(await skill(name), /If the feature has a plan/, name);
  }
});

test("code-review has no plan paragraph and no escalation", async () => {
  const text = await skill("code-review");
  assert.doesNotMatch(text, /A feature plan is optional/);
  assert.doesNotMatch(text, /escalate as that page says/);
});
