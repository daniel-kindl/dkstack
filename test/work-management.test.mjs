import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = join(repoRoot, "workflow", "work.md");

async function pageText() {
  return readFile(pagePath, "utf8");
}

test("workflow/index.md indexes the work contract", async () => {
  const text = await readFile(join(repoRoot, "workflow", "index.md"), "utf8");
  assert.match(text, /\[work\.md\]\(work\.md\)/);
});

test("the work contract defines the lifecycle, readiness and sources", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /triage.*planning.*ready.*active.*review.*closed/);
  assert.match(flat, /one lifecycle state/);
  assert.match(flat, /feature, bug, refactor, chore, docs or research/);
  assert.match(flat, /p0, p1, p2 or p3/);
  assert.match(flat, /Priority does not make an issue ready/);
  assert.match(flat, /agent or human/);
  assert.match(flat, /If eligibility is absent, the issue is not ready/);
  assert.match(flat, /state is ready/);
  assert.match(flat, /eligibility is agent/);
  assert.match(flat, /[Ee]very prerequisite is complete/);
  assert.match(flat, /acceptance criteria exist/);
  assert.match(flat, /native hierarchy/);
  assert.match(flat, /native blocker link/);
  assert.match(flat, /plan file in the repository/);
  assert.match(flat, /review record on that pull request/);
});

test("the work contract fails closed and isolates the mapping session", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /fail closed/);
  assert.match(flat, /missing, unsupported or in conflict/);
  assert.match(flat, /must not implement a mapped issue in that same session/);
  assert.match(flat, /context-sharing subagent is the same session/);
  assert.match(flat, /A fresh session implements the mapped issue/);
  assert.match(flat, /map-work/);
  assert.match(flat, /plan-work/);
  assert.match(flat, /plan-work plans the commits of one issue/);
});

test("a mapping pull request does not move the parent to review", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /mapping pull request does not move the parent from active to review/);
  assert.match(flat, /parent stays active while the children do the work/);
  assert.match(flat, /not actionable until that mapping pull request has passed independent review and is merged/);
});

test("mapping isolation applies to children, not the parent", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /mapped issue.*child issue/);
  assert.match(flat, /parent objective.*not a mapped issue/);
});

test("a closed prerequisite unlocks work only when it is complete", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /only when that prerequisite is complete/);
  assert.match(flat, /Closed is not enough/);
  assert.match(flat, /A rejected prerequisite is not complete/);
  assert.match(flat, /An abandoned prerequisite is not complete/);
  assert.match(flat, /does not say whether it is complete, rejected or abandoned, fail closed/);
  assert.doesNotMatch(flat, /every prerequisite is closed/i);
});

test("in-scope mapping does not need a separate owner record", async () => {
  const flat = (await pageText()).replace(/\s+/g, " ");
  assert.match(flat, /does not need a new approval from the owner/);
  assert.match(flat, /material expansion of that scope/);
  assert.match(flat, /restricted action/);
  assert.doesNotMatch(flat, /authorized map-work in the parent issue/);
});

test("the work contract links the existing rules and does not copy them", async () => {
  const text = await pageText();
  assert.match(text, /\[safety\.md\]\(safety\.md\)/);
  assert.match(text, /\[roles\.md\]\(roles\.md\)/);
  assert.match(text, /\[review-and-merge\.md\]\(review-and-merge\.md\)/);
  assert.match(text, /\[feature-plans\.md\]\(feature-plans\.md\)/);
  assert.doesNotMatch(text, /Do not force-push/);
  assert.doesNotMatch(text, /The reviewer merges only the head that they reviewed/);
  assert.doesNotMatch(text, /github/i);
  assert.doesNotMatch(text, /gitea/i);
  assert.doesNotMatch(text, /gitlab/i);
});

function sectionText(text, heading) {
  const lines = text.split("\n");
  const level = heading.match(/^#+/)[0].length;
  const start = lines.findIndex((line) => line === heading);
  assert.notEqual(start, -1, `missing heading: ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#+) /);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function flatten(text) {
  return text.replace(/\s+/g, " ").trim();
}

function listAfter(section, lead) {
  const lines = section.split("\n");
  const start = lines.findIndex((line) => flatten(line).endsWith(lead));
  assert.notEqual(start, -1, `missing list lead: ${lead}`);
  const items = [];
  let i = start + 1;
  while (i < lines.length && lines[i].trim() === "") i += 1;
  for (; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("- ")) items.push(line.slice(2));
    else if (line.startsWith("  ") && items.length > 0) items[items.length - 1] += ` ${line}`;
    else break;
  }
  return items.map(flatten);
}

test("the work contract records an owner instruction durably", async () => {
  const section = flatten(sectionText(await pageText(), "## Owner instructions in chat"));
  for (const sentence of [
    "Before an agent relies on an owner instruction in a later session, it records the instruction durably on the relevant issue.",
    "The instruction must come from the [human owner](roles.md#human-owner).",
    "Ordinary work in the same verified session can continue without a new record.",
    "Include the owner's own words, where they came from, the issue and authorized scope, the session date, and a session link or identifier when available.",
    "An agent may transcribe the human decision; the agent's own agreement is not approval.",
  ]) {
    assert.ok(section.includes(sentence), `missing sentence: ${sentence}`);
  }
});

test("the work contract limits a fail-closed repair to a closed list", async () => {
  const raw = sectionText(await pageText(), "## Fail closed");
  const section = flatten(raw);
  for (const sentence of [
    "Do not ask for permission again.",
    "Routine, reversible workflow defects are only these:",
  ]) {
    assert.ok(section.includes(sentence), `missing sentence: ${sentence}`);
  }
  assert.deepEqual(listAfter(raw, "Routine, reversible workflow defects are only these:"), [
    "A missing lifecycle, type or agent eligibility field that the tracker supports, when the correct value is not in doubt. See [transitions](#transitions).",
    "A missing catalog label, created with the preflight apply mode. See [preflight.md](preflight.md).",
    "A tracker transition that an agent must record again and read again.",
  ]);
  assert.deepEqual(listAfter(raw, "A repair never covers these:"), [
    "A merge, a release or a tag.",
    "An action that [safety.md](safety.md) limits.",
    "A change to the scope of the issue.",
    "A field that conflicts with another source, or a human-only designation.",
  ]);
});
