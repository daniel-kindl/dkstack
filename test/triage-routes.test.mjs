import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// SCR-1, QIL-4, SEN-M8, SCR-22 and ATL-12 in #154: triage and the entry pages
// route learning work and CI work. These tests pin key phrases and links, not
// full sentences (D7 in #154).

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(join(repoRoot, file), "utf8");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const triage = await read("skills/triage/SKILL.md");
const section = (text, heading) => {
  const start = text.indexOf(`${heading}\n`);
  assert.notEqual(start, -1, `missing ${heading}`);
  const end = text.indexOf("\n## ", start + heading.length);
  return text.slice(start, end === -1 ? undefined : end);
};

test("triage names learning and UI work and routes them", () => {
  const steps = section(triage, "## Steps");
  assert.match(steps, /\blearning\b/);
  assert.match(steps, /\bUI\b/);
  assert.ok(section(triage, "## Skills").includes(`- Learn, practice, assess or review a topic: [learn](${RAW}skills/learn/SKILL.md)`));
  assert.ok(section(triage, "## Section map").includes(`(${RAW}learning/index.md)`));
});

test("triage routes a change to workflows, tokens, secrets or repository settings to the CI rules and safety", () => {
  const line = section(triage, "## Section map").split("\n").find((l) => l.includes(".github/workflows"));
  assert.ok(line, "a Section map line for .github/workflows");
  for (const word of ["tokens", "secrets", "repository settings"]) assert.match(line, new RegExp(word));
  assert.ok(line.includes(`(${RAW}coding/security.md#ci-workflows)`));
  assert.ok(line.includes(`(${RAW}workflow/safety.md)`));
});

test("triage has one writing row", () => {
  const rows = section(triage, "## Section map").split("\n").filter((l) => l.includes("writing/index.md"));
  assert.equal(rows.length, 1);
});

test("triage links AGENTS.md Precedence for a rule conflict and does not restate it", () => {
  const rules = section(triage, "## Rules");
  assert.ok(rules.includes(`(${RAW}AGENTS.md#precedence)`));
  assert.doesNotMatch(rules, /more specific rule/);
});

test("AGENTS.md lists the learning section and not the empty tips section", async () => {
  const sections = section(await read("AGENTS.md"), "## Sections");
  assert.match(sections, /\[learning\/index\.md\]\(learning\/index\.md\)/);
  assert.doesNotMatch(sections, /tips\/index\.md/);
  assert.doesNotMatch(await read("README.md"), /\(tips\/index\.md\)/);
});

test("skills/index.md links the learning section next to learn, and bootstrap matches its description", async () => {
  const index = await read("skills/index.md");
  const learn = index.split("\n").find((l) => l.startsWith("- [learn]"));
  assert.match(learn, /\]\(\.\.\/learning\/index\.md\)/);
  const bootstrap = index.split("\n").find((l) => l.startsWith("- [bootstrap]"));
  const description = /^description: "Use when [^.]*\. (Sets up [^"]*)\."$/m.exec(await read("skills/bootstrap/SKILL.md"))[1];
  assert.ok(bootstrap.includes(description.replace(/^Sets up/, "Set up")), bootstrap);
});

// The Low on #227: the description names the steps that #227 added.
test("the bootstrap description names repository protection and the README check", async () => {
  const description = /^description: "([^"]*)"$/m.exec(await read("skills/bootstrap/SKILL.md"))[1];
  assert.ok(description.includes("repository protection"), description);
  assert.ok(description.includes("a README check"), description);
});
