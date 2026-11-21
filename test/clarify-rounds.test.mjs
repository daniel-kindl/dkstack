import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const text = await readFile(join(repoRoot, "skills", "clarify-intent", "SKILL.md"), "utf8");

// Return the text of the section with the given "## " heading, with whitespace collapsed.
function section(heading) {
  const m = new RegExp(`^## ${heading}\\r?\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(text);
  assert.ok(m, `clarify-intent must have a "${heading}" section`);
  return m[1].replace(/\s+/g, " ");
}

test("clarify-intent keeps steps 1 to 5 unchanged", () => {
  const steps = section("Steps");
  assert.match(steps, /1\. Restate the request in your own words\./);
  assert.match(steps, /2\. List open questions about behavior, edge cases, and constraints\./);
  assert.match(steps, /3\. Ask the questions\. Do not assume answers\./);
  assert.match(steps, /4\. Capture domain terms\./);
  assert.match(steps, /5\. Only after the intent is clear, proceed to design or implementation\./);
  assert.doesNotMatch(steps, /\b6\. /);
});

test("the Rounds section comes after the Subagents section and before the Rules", () => {
  const subagents = text.indexOf("\n## Subagents\n");
  const rounds = text.indexOf("\n## Rounds\n");
  const rules = text.indexOf("\n## Rules\n");
  assert.ok(subagents !== -1 && rounds !== -1 && rules !== -1);
  assert.ok(subagents < rounds && rounds < rules);
});

test("rounds start on each of the four triggers", () => {
  const rounds = section("Rounds");
  assert.match(rounds, /More than 3 questions are still open\./);
  assert.match(rounds, /One question depends on another question\./);
  assert.match(rounds, /The owner asks to be grilled\./);
  assert.match(rounds, /`chart-route` sends a question to this skill\./);
});

test("a round asks at most 3 frontier questions after a short summary", () => {
  const rounds = section("Rounds");
  assert.match(rounds, /"Settled so far"/);
  assert.match(rounds, /Ask at most 3 frontier questions/);
  assert.match(rounds, /the questions that unblock the most questions first/);
  assert.match(rounds, /how many questions are still waiting/);
});

test("each question has a title, a short text and one recommended answer", () => {
  const rounds = section("Rounds");
  assert.match(rounds, /a title, at most two lines of text and one recommended answer/);
  assert.match(rounds, /A reply of "yes" accepts the recommended answer\./);
});

test("the agent finds facts and never answers the owner's decisions", () => {
  const rounds = section("Rounds");
  assert.match(rounds, /Find the facts in the code, `CONTEXT\.md` and the ADRs/);
  assert.match(rounds, /Never answer a decision that is the owner's\./);
});

test("rounds record terms in CONTEXT.md and offer an ADR only on the ADR test", () => {
  const rounds = section("Rounds");
  assert.ok(rounds.includes(`${RAW}skills/domain-glossary/SKILL.md`));
  assert.ok(rounds.includes(`${RAW}skills/write-adr/SKILL.md`));
  assert.ok(rounds.includes(`${RAW}architecture/adrs.md`));
  assert.match(rounds, /Offer `write-adr` only when the decision meets the test in/);
});

test("rounds are done when no question is open and the owner confirms in their own words", () => {
  const rounds = section("Rounds");
  assert.match(rounds, /no open question is left and the owner confirms the summary in their own words/);
});
