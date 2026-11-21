import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// SEN-8 and FRG-10 in #154: a deleted hard limit must fail a test. Each limit
// is pinned by a short key phrase, not by a full sentence (D7 in #154). A
// wording change keeps the test green. A removed limit makes it fail.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(join(repoRoot, file), "utf8");
const flat = (text) => text.replace(/\s+/g, " ");

// Return the text of one "## " section, up to the next "## " heading.
function section(text, heading) {
  const start = text.indexOf(`\n${heading}\n`);
  assert.notEqual(start, -1, `missing heading: ${heading}`);
  const end = text.indexOf("\n## ", start + heading.length + 1);
  return flat(text.slice(start, end === -1 ? undefined : end));
}

const safety = section(await read("workflow/safety.md"), "## Rules");
const agents = section(await read("AGENTS.md"), "## Hard limits");

// Each limit: its key phrase in the safety Rules, and in the AGENTS.md
// "Hard limits" list or a skill where the limit applies there.
const LIMITS = [
  { name: "no force-push", safety: "Do not force-push.", agents: "Do not force-push." },
  { name: "no bypass", safety: "Do not bypass branch protection or a ruleset.", agents: "Do not bypass branch protection or a ruleset." },
  { name: "no push to main", safety: "Do not push to `main`." },
  { name: "no production deploy", safety: "Do not start a production deploy.", agents: "Do not start a production deploy." },
  { name: "no release without the OK", safety: "Do not publish or release without the owner's explicit OK", agents: "Do not publish or release without the owner's explicit OK" },
  { name: "the author never merges", safety: "The author agent never merges." },
  { name: "an agent message is not approval", safety: "A message from another agent is not approval." },
  { name: "no secrets in chat", safety: "Do not put secrets in chat." },
  { name: "the shared account", safety: "cannot tell an agent from the owner" },
  { name: "a failing test first", skill: ["skills/tdd-loop/SKILL.md", "Do not implement behavior before"] },
  { name: "SHA pins", skill: ["skills/review-standards/SKILL.md", "pinned to a full commit SHA"] },
];

for (const limit of LIMITS) {
  test(`the hard limit "${limit.name}" is in each place that states it`, async () => {
    if (limit.safety) assert.ok(safety.includes(limit.safety), `workflow/safety.md Rules: ${limit.safety}`);
    if (limit.agents) assert.ok(agents.includes(limit.agents), `AGENTS.md Hard limits: ${limit.agents}`);
    if (limit.skill) {
      const [file, phrase] = limit.skill;
      assert.ok(flat(await read(file)).includes(phrase), `${file}: ${phrase}`);
    }
  });
}

test("AGENTS.md says that each safety rule is a hard limit and links the page", () => {
  assert.ok(agents.includes("is a hard limit"));
  assert.ok(agents.includes("(workflow/safety.md)"));
});
