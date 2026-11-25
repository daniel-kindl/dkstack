import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Issue #294: one subagent guide, and a Subagents section in each skill.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const guideUrl = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md";
const tiers = ["large", "medium", "small"];
const efforts = ["low", "medium", "high", "xhigh"];

// Skills that start subagents. Each other skill says why it does not.
const users = ["triage", "setup-dkstack", "bootstrap", "start-issue", "clarify-intent",
  "apply-architecture", "code-review", "write-adr", "make-diagram", "writing-check", "plan-work",
  "chart-route", "release", "ui-design", "ui-review", "model-domain"];

async function guide() {
  return readFile(join(repoRoot, "workflow", "subagents.md"), "utf8");
}

async function skillNames() {
  const entries = await readdir(join(repoRoot, "skills"), { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

async function subagents(skill) {
  const text = await readFile(join(repoRoot, "skills", skill, "SKILL.md"), "utf8");
  const m = /^## Subagents\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text);
  assert.ok(m, `the ${skill} skill must have a Subagents section`);
  return m[1];
}

// Return the rows of the first Markdown table after a heading, as arrays of cells.
function table(text, heading) {
  const start = text.indexOf(`\n${heading}\n`);
  assert.notEqual(start, -1, `the guide must have the heading ${heading}`);
  const rest = text.slice(start + heading.length + 2);
  const end = rest.search(/\n## /);
  const section = end === -1 ? rest : rest.slice(0, end);
  return section.split("\n").filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l))
    .slice(1).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
}

test("the subagent guide has the use cases, the brief and the reports", async () => {
  const text = await guide();
  for (const heading of ["## When to use a subagent", "## When not to use a subagent", "## The brief",
    "## Model tiers", "## Effort", "## Client map", "## Reports", "## In a skill"]) {
    assert.ok(text.includes(`\n${heading}\n`), `missing ${heading}`);
  }
  assert.match(text, /complete without your context/);
  assert.match(text, /A report from a subagent is a claim\./);
});

test("the tier table has one row for each tier", async () => {
  const rows = table(await guide(), "## Model tiers");
  assert.deepEqual(rows.map((r) => r[0].replace(/`/g, "")), tiers);
});

test("the effort table has one row for each effort", async () => {
  const rows = table(await guide(), "## Effort");
  assert.deepEqual(rows.map((r) => r[0].replace(/`/g, "")), efforts);
});

test("the client map gives a model for each tier and the date it was checked", async () => {
  const text = await guide();
  const rows = table(text, "## Client map");
  assert.deepEqual(rows.map((r) => r[0].replace(/`/g, "")), tiers);
  for (const row of rows) for (const cell of row) assert.notEqual(cell, "");
  // The skill gives the effort. A map cell names only a model (review of #295, M1).
  for (const row of rows) for (const cell of row.slice(1)) assert.doesNotMatch(cell, /effort/i);
  assert.match(text, /Last checked: \d{4}-\d{2}-\d{2}\./);
});

test("the guide tells the agent not to use an effort above xhigh without the owner", async () => {
  assert.match(await guide(), /Do not use an effort above `xhigh` unless the owner asks for it\./);
});

test("the workflow index and triage link the subagent guide", async () => {
  const index = await readFile(join(repoRoot, "workflow", "index.md"), "utf8");
  assert.match(index, /\[subagents\.md\]\(subagents\.md\)/);
  assert.ok((await subagents("triage")).includes(guideUrl));
});

test("each skill has a Subagents section that links the guide", async () => {
  for (const skill of await skillNames()) {
    assert.ok((await subagents(skill)).includes(guideUrl), `${skill} must link the guide`);
  }
});

test("each skill that starts subagents gives a tier and an effort", async () => {
  const setting = new RegExp(`tier (${tiers.join("|")}), effort (${efforts.join("|")})\\.`);
  for (const skill of users) {
    const text = await subagents(skill);
    assert.match(text, /^If you can start subagents, /m, skill);
    assert.match(text, setting, `${skill} must give a tier and an effort`);
    // The settings come right after the brief (review of #295, L1).
    assert.match(text, /- This line: "[^"]*"\n\nStart each subagent with the setting below\./,
      `${skill} must give the settings right after the brief`);
  }
});

test("each other skill says that it starts no subagent, and why", async () => {
  for (const skill of await skillNames()) {
    if (users.includes(skill)) continue;
    assert.match(await subagents(skill), /^Do not start subagents for this skill\. Reason: /m, skill);
  }
});

test("no Subagents section names a vendor, a client or a model", async () => {
  const names = [/claude/i, /anthropic/i, /\bopus\b/i, /\bsonnet\b/i, /\bhaiku\b/i, /codex/i,
    /openai/i, /\bgpt/i, /grok/i, /\bxai\b/i, /cursor/i, /copilot/i, /gemini/i];
  for (const skill of await skillNames()) {
    const text = (await subagents(skill)).replace(/https:\/\/\S+/g, "");
    for (const name of names) assert.doesNotMatch(text, name, `${skill} names ${name}`);
  }
});
