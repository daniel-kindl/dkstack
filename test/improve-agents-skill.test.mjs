import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, sectionText } from "./helpers.mjs";
import { parseFrontmatter } from "../scripts/check-skills.mjs";

// Issue #198: a user-invoked skill that improves the agents' environment
// after a session.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const read = (path) => readFile(join(root, path), "utf8");
const skill = await read("skills/improve-agents/SKILL.md");

test("improve-agents is user-only in both clients", async () => {
  assert.equal(parseFrontmatter(skill)["disable-model-invocation"], true);
  const policy = await read("skills/improve-agents/agents/openai.yaml");
  assert.match(policy, /allow_implicit_invocation: false/);
});

test("improve-agents names its input and its categories", () => {
  const input = sectionText(skill, "## Input");
  for (const part of ["current session", "pull request", "issue"]) {
    assert.ok(input.includes(part), `input: missing ${part}`);
  }
  const categories = sectionText(skill, "## Categories");
  for (const part of ["Navigation", "Automated checks", "No effect", "Steering size",
    "Tool cost", "Information access", "mechanical", "judgement"]) {
    assert.ok(categories.includes(part), `categories: missing ${part}`);
  }
});

test("improve-agents keeps facts apart from guesses", () => {
  const evidence = sectionText(skill, "## Evidence");
  assert.ok(evidence.includes(`${RAW}skills/verify-claim/SKILL.md`));
  assert.ok(evidence.includes("hypothesis"));
  assert.ok(evidence.includes("no proposal"));
});

test("improve-agents reports to the owner and does not edit dkstack", () => {
  const output = sectionText(skill, "## Output");
  for (const part of ["owner's OK", "draft issue", "daniel-kindl/dkstack",
    `${RAW}AGENTS.md#changes`, "Do not edit dkstack"]) {
    assert.ok(output.includes(part), `output: missing ${part}`);
  }
});

test("improve-agents has a good and a bad example and credits the source", () => {
  for (const heading of ["## Good example", "## Bad example", "## Subagents", "## Credit"]) {
    assert.match(skill, new RegExp(`^${heading}$`, "m"), heading);
  }
  assert.ok(sectionText(skill, "## Credit").includes("mattpocock/skills"));
});

test("the skills index and triage list improve-agents as a user skill", async () => {
  const index = await read("skills/index.md");
  assert.ok(index.includes("- [improve-agents](improve-agents/SKILL.md) (user):"));
  const triage = await read("skills/triage/SKILL.md");
  assert.ok(triage.includes(`[improve-agents](${RAW}skills/improve-agents/SKILL.md)`));
});
