import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
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

test("no skill or entry page names the removed map-work skill", async () => {
  const skills = (await readdir(join(repoRoot, "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => join("skills", entry.name, "SKILL.md"));
  for (const file of ["skills/index.md", "AGENTS.md", "README.md", "CONTRIBUTING.md", "sample-AGENTS.md",
    "workflow/index.md", "workflow/roles.md", "workflow/safety.md", "workflow/review-and-merge.md",
    "tips/index.md", ".github/ISSUE_TEMPLATE/external-request.md", ...skills]) {
    const text = await readFile(join(repoRoot, file), "utf8");
    assert.doesNotMatch(text, /map-work/, `${file} names map-work`);
  }
});

test("the workflow index lists only the kept pages", async () => {
  const text = (await readFile(join(repoRoot, "workflow", "index.md"), "utf8")).replace(/\s+/g, " ");
  for (const page of ["roles.md", "review-and-merge.md", "safety.md"]) {
    assert.match(text, new RegExp(`\\[${page.replace(".", "\\.")}\\]\\(${page.replace(".", "\\.")}\\)`));
  }
  for (const page of ["work.md", "lifecycle.md", "claims.md", "preflight.md", "feature-plans.md"]) {
    assert.doesNotMatch(text, new RegExp(`\\(${page.replace(".", "\\.")}\\)`), `index links ${page}`);
  }
  assert.doesNotMatch(text, /mapped to one team/);
  assert.doesNotMatch(text, /escalat/i);
});
