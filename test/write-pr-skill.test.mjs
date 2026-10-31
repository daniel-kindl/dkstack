import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-pr/SKILL.md";

async function flat(path) {
  const text = await readFile(join(root, path), "utf8");
  return text.replaceAll(/\s+/g, " ");
}

function example(text, heading) {
  const start = text.indexOf(`### ${heading}`);
  assert.notEqual(start, -1, `missing example ${heading}`);
  const rest = text.slice(start + heading.length + 4);
  const next = rest.search(/\n### /);
  return next === -1 ? rest : rest.slice(0, next);
}

test("the write-pr skill describes the body and stays out of review", async () => {
  const skill = await flat("skills/write-pr/SKILL.md");
  assert.match(skill, /name: write-pr/);
  for (const section of ["## Summary", "## Evidence", "## Risk and rollback", "## References"]) {
    assert.ok(skill.includes(section), `missing ${section}`);
  }
  assert.match(skill, /Verified/);
  assert.match(skill, /Unverified/);
  assert.match(skill, /Known risk/);
  assert.match(skill, /NOT RUN/);
  assert.match(skill, /does not (give a verdict|review a pull request|merge)/i);
  assert.match(skill, /Do not require a (diagram|visual)/);
  assert.match(skill, /review-and-merge\.md/);
});

test("the examples cover a docs change, a tested fix and a high-risk change", async () => {
  const skill = await readFile(join(root, "skills/write-pr/SKILL.md"), "utf8");
  const docs = example(skill, "Small documentation change");
  const fix = example(skill, "Tested code fix");
  const risk = example(skill, "High-risk change");
  assert.match(docs, /NOT RUN|no test/i);
  assert.match(docs, /[Ll]ow risk/);
  assert.match(fix, /fail/i);
  assert.match(fix, /pass/i);
  assert.match(fix, /[Ll]ow risk|[Rr]ollback/);
  assert.match(risk, /blast radius|rollback|migration/i);
  assert.match(risk, /NOT RUN|fail/i);
  assert.match(risk, /[Uu]nverified|[Vv]erified/);
});

test("triage routes pull request text to write-pr and leaves review alone", async () => {
  const triage = await flat("skills/triage/SKILL.md");
  const index = await flat("skills/index.md");
  assert.ok(triage.includes(raw));
  assert.match(triage, /Pull request body:.*write-pr/);
  assert.doesNotMatch(triage, /Review:.*write-pr/);
  assert.match(index, /\[write-pr\]\(write-pr\/SKILL\.md\)/);
});

test("the template and the review page agree with the skill", async () => {
  const template = await flat(".github/pull_request_template.md");
  const review = await flat("workflow/review-and-merge.md");
  for (const section of ["## Summary", "## Evidence", "## Risk and rollback", "## References"]) {
    assert.ok(template.includes(section), `template missing ${section}`);
  }
  assert.match(template, /NOT RUN/);
  assert.doesNotMatch(template, /require a diagram|must include a diagram/i);
  assert.match(review, /skills\/write-pr\/SKILL\.md/);
  assert.match(review, /The reviewer merges only the head that they reviewed/);
});
