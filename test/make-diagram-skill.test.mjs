import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, sectionText } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// #193: the make-diagram skill. These tests pin key phrases and links, not
// full sentences.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");
const flat = (text) => text.replaceAll(/\s+/g, " ");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/make-diagram/SKILL.md";
const skill = await read("skills/make-diagram/SKILL.md");

test("the make-diagram skill can be started by a person or an agent", () => {
  assert.match(skill, /^name: make-diagram$/m);
  assert.doesNotMatch(skill, /^(user-invocable|disable-model-invocation):/m);
  assert.match(skill, /^description: "Use when [^"]*Triggers: [^"]*diagram[^"]*"$/m);
});

test("the skill says when a diagram helps and when the text is sufficient", () => {
  const when = flat(sectionText(skill, "## When to use a diagram"));
  assert.match(when, /text is sufficient/);
  assert.match(when, /Do not add a diagram/);
});

test("the skill maps each need to a kind of diagram", () => {
  const kinds = flat(sectionText(skill, "## Kind of diagram"));
  for (const kind of ["Flow", "Sequence", "State", "Component or dependency", "Data model", "Before and after"]) {
    assert.ok(kinds.includes(`| ${kind} |`), `missing kind ${kind}`);
  }
});

test("the skill prefers Mermaid in Markdown, with a plain-text fallback", () => {
  const format = flat(sectionText(skill, "## Format"));
  assert.match(format, /Mermaid/);
  assert.match(format, /diff shows each change/);
  assert.match(format, /plain-text/);
  assert.match(format, /Do not commit a binary image/);
});

test("the skill names the place for each target", () => {
  const place = flat(sectionText(skill, "## Place"));
  for (const target of ["Pull request body", "Issue body", "Spec or plan", "ADR", "Docs page"]) {
    assert.ok(place.includes(`| ${target} |`), `missing target ${target}`);
  }
});

test("the skill checks the match, the render and the text alternative", () => {
  const check = flat(sectionText(skill, "## Check"));
  assert.match(check, /matches the code or the text/);
  assert.match(check, /renders/);
  assert.match(check, /text alternative/);
});

test("the skill has a good example and a bad example", () => {
  assert.match(sectionText(skill, "## Good example"), /```mermaid/);
  assert.ok(sectionText(skill, "## Bad example").trim().length > 0);
});

test("triage routes a request for a diagram or a visual to the skill", async () => {
  const triage = sectionText(await read("skills/triage/SKILL.md"), "## Skills");
  const line = triage.split("\n").find((l) => l.includes(RAW));
  assert.ok(line, "triage does not link make-diagram");
  assert.match(line, /diagram/);
  assert.match(line, /visual/);
});

test("skills/index.md lists the skill", async () => {
  assert.match(await read("skills/index.md"), /- \[make-diagram\]\(make-diagram\/SKILL\.md\) \(both\): /);
});

for (const name of ["write-pr", "write-adr", "plan-work"]) {
  test(`${name} links make-diagram`, async () => {
    assert.ok((await read(`skills/${name}/SKILL.md`)).includes(RAW), `${name} does not link make-diagram`);
  });
}

// A release moves the Unreleased notes to a version section, so look in the whole file (#296).
test("the changelog has an entry for #193", async () => {
  assert.match(await read("CHANGELOG.md"), /`skills\/make-diagram`[^\n]*\(#193\)/);
});
