import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkMapText } from "../scripts/check-maps.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const raw = await readFile(join(repoRoot, "skills", "chart-route", "SKILL.md"), "utf8");
const flat = raw.replace(/\s+/g, " ");

// Return the text of the section with the given "## " heading, outside fenced code.
function section(heading) {
  const lines = raw.split("\n");
  const start = lines.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, `chart-route must have a "${heading}" section`);
  let fence = false;
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && /^## /.test(line)) break;
    out.push(line);
  }
  return out.join("\n");
}

// Return the content of the first fenced block in a section.
function fenced(heading) {
  const m = /```markdown\n([\s\S]*?)\n```/.exec(section(heading));
  assert.ok(m, `the "${heading}" section must have a fenced markdown block`);
  return `${m[1]}\n`;
}

test("chart-route plans and never builds", () => {
  assert.match(flat, /It plans and never builds\./);
  assert.match(flat, /Production code in a map pull request is a finding\./);
});

test("chart-route starts only for a large, unclear effort and stops early when one round is enough", () => {
  assert.match(flat, /the work needs more than one session and the route is not clear/);
  assert.match(flat, /If one `clarify-intent` round leaves no open question, stop and use \[plan-work\]/);
});

test("chart-route has the seven steps in order", () => {
  const steps = section("Steps").replace(/\s+/g, " ");
  const expected = [
    /1\. Name the destination with the owner\. Use the \[rounds\]/,
    /2\. Write the map from the \[template\]\(#map-template\) in `docs\/maps\/<slug>\.md`\. Run `check-maps`\. Open one docs-only pull request and stop\./,
    /3\. Take one open question: the question that `Next` names, or else the first frontier question\./,
    /4\. Resolve the question by its type:/,
    /5\. Record each answer once:/,
    /6\. Run `check-maps`, `check-context` and `check-adrs`\./,
    /7\. When Open questions and Not yet clear are empty, set `Status: done`\./,
  ];
  let last = -1;
  for (const pattern of expected) {
    const m = pattern.exec(steps);
    assert.ok(m, `missing step: ${pattern}`);
    assert.ok(m.index > last, `step out of order: ${pattern}`);
    last = m.index;
  }
  assert.doesNotMatch(steps, /\b8\. /);
});

test("each question type has its rule", () => {
  const steps = section("Steps").replace(/\s+/g, " ");
  assert.match(steps, /owner: use the `clarify-intent` rounds\. Record the owner's own words\. An agent that answers an owner question is a finding\./);
  assert.match(steps, /research: find the facts\. Cite a source for each fact in Notes\./);
  assert.match(steps, /prototype: try two or three different options on a throwaway branch `prototype\/<slug>-q<n>`\. The owner picks\./);
  assert.match(steps, /Tag the prototype commit `prototype\/<slug>-q<n>`/);
  assert.match(steps, /Screenshots stay on the prototype branch or its pull request\. They never go on `main`\./);
  assert.match(steps, /task: do only the small work that unblocks a decision, or leave it for a later issue\./);
});

test("each answer is recorded once, with the owner and the date", () => {
  const steps = section("Steps").replace(/\s+/g, " ");
  assert.ok(steps.includes(`${RAW}architecture/adrs.md#when-to-write-an-adr`));
  assert.ok(steps.includes(`${RAW}skills/domain-glossary/SKILL.md`));
  assert.match(steps, /`Decided by:` with the owner's name and the date/);
});

test("a session pull request touches only the map, the ADRs and CONTEXT.md", () => {
  const steps = section("Steps").replace(/\s+/g, " ");
  assert.match(steps, /Open one docs-only pull request for the session\. It changes only files in `docs\/maps\/`, `docs\/adr\/` and `CONTEXT\.md`\. Then stop\./);
  assert.match(steps, /The normal review and merge rules apply\./);
});

test("a done map hands off to plan-work and issues, and stays in docs/maps", () => {
  const steps = section("Steps").replace(/\s+/g, " ");
  assert.ok(steps.includes(`${RAW}skills/plan-work/SKILL.md`));
  assert.ok(steps.includes(`${RAW}skills/start-issue/SKILL.md`));
  assert.match(steps, /Open one issue for each map task/);
  assert.match(steps, /Link the plan and the issues under Hand-off\./);
  assert.match(steps, /The map stays in `docs\/maps\/`\. Never delete it\./);
});

test("chart-route has one question per session and owns the map", () => {
  const rules = section("Rules").replace(/\s+/g, " ");
  assert.match(rules, /One question per session\./);
  assert.match(rules, /`chart-route` owns the changes to a map\./);
  assert.match(rules, /A decided question keeps its Q id and moves to Decisions/);
  assert.match(rules, /Never merge a prototype branch\./);
});

test("the template has the check-maps headings in order", async () => {
  const errors = await checkMapText("docs/maps/template.md", fenced("Map template"), async () => true);
  assert.deepEqual(errors.filter((e) => /the heading|unknown heading|missing heading|first line/.test(e)), []);
});

test("the example map passes check-maps", async () => {
  assert.deepEqual(await checkMapText("docs/maps/example.md", fenced("Example"), async () => true), []);
});

test("chart-route has no lifecycle terms, labels or image links", () => {
  for (const term of [/map-work/, /\bclaims?\b/i, /readiness/i, /\blabels?:/i, /status:\w/i, /agent:/, /needs:/, /!\[/]) {
    assert.doesNotMatch(raw, term);
  }
});

test("chart-route names no tool or platform", () => {
  const text = raw.replace(/https:\/\/\S+/g, "");
  for (const name of [/github/i, /gitlab/i, /\bgh\b/, /\bnpm\b/, /sentinel/i, /claude/i, /codex/i]) {
    assert.doesNotMatch(text, name);
  }
});

test("chart-route credits its inspiration", () => {
  assert.match(flat, /Inspired by Matt Pocock's grill-me, grill-with-docs and wayfinder skills \(MIT\)/);
});

test("plan-work step 1 takes the map content and invents none of it", async () => {
  const text = (await readFile(join(repoRoot, "skills", "plan-work", "SKILL.md"), "utf8")).replace(/\s+/g, " ");
  const step1 = /## Steps 1\. (.*?) 2\. /.exec(text);
  assert.ok(step1);
  assert.match(step1[1], /If a map for the goal exists in `docs\/maps\/`, use the map\. Take the goal, the acceptance criteria, the dependencies and the decisions from it\. Invent none of them\./);
  assert.match(text, /7\. Before you report/);
  assert.doesNotMatch(text, / 8\. /);
});

test("chart-route is registered in the skills index and in triage", async () => {
  const index = await readFile(join(repoRoot, "skills", "index.md"), "utf8");
  assert.match(index, /^- \[chart-route\]\(chart-route\/SKILL\.md\) \(both\): /m);
  const triage = await readFile(join(repoRoot, "skills", "triage", "SKILL.md"), "utf8");
  assert.ok(triage.includes(`[chart-route](${RAW}skills/chart-route/SKILL.md)`));
});

// Issue #192: the map tasks become sub-issues of the plan issue, in order.
test("chart-route opens the map tasks as sub-issues in order", () => {
  const steps = section("Steps").replace(/\s+/g, " ");
  assert.match(steps, /Make each one a sub-issue of the plan issue\./);
  assert.match(steps, /Set the order of the tasks as "blocked by" relations\./);
});
