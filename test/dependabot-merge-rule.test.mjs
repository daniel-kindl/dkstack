import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The owner decided on 2026-11-12 that a Dependabot patch or minor update can
// merge through auto-merge that he configured. These tests keep the limits of
// that rule in the safety and review pages: only Dependabot pull requests,
// only patch and minor updates, the required checks gate the merge, no bypass,
// and no agent turns on auto-merge for another pull request.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function page(path) {
  return readFile(join(repoRoot, path), "utf8");
}

function flatten(text) {
  return text.replace(/\s+/g, " ").trim();
}

// Return the text of one section, up to the next heading of the same or a higher level.
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
  return flatten(lines.slice(start + 1, end).join("\n"));
}

// Return the items of a "- " list, each as one line.
function items(section) {
  return section.split(/ - (?=\S)/).map((s) => s.replace(/^- /, "").trim());
}

const LIMITS = [
  /`dependabot\[bot\]` opened/,
  /patch or a minor update/,
  /required checks/,
  /no rule is bypassed/,
  /dependabot\/fetch-metadata/,
];

test("the safety rules let only owner-configured Dependabot auto-merge merge without a reviewer", async () => {
  const rules = items(sectionText(await page("workflow/safety.md"), "## Rules"));
  const rule = rules.filter((item) => item.includes("Dependabot auto-merge"));
  assert.equal(rule.length, 1, "the safety rules must have one Dependabot auto-merge item");
  for (const limit of LIMITS) assert.match(rule[0], limit);
  assert.match(rule[0], /An agent never turns on auto-merge for another pull request\./);
  assert.match(rule[0], /Reason: /);
});

test("the review page names the one change that reaches main without review", async () => {
  const text = await page("workflow/review-and-merge.md");
  const intro = flatten(text.slice(0, text.indexOf("\n## ")));
  assert.match(intro, /No change reaches `main` without review, except a \[Dependabot auto-merge\]\(#dependabot-auto-merge\)\./);
  const section = sectionText(text, "## Dependabot auto-merge");
  for (const limit of LIMITS) assert.match(section, limit);
  assert.match(section, /\[coding\/dependencies\.md\]\(\.\.\/coding\/dependencies\.md\)/);
  assert.match(section, /A major update waits for the owner\./);
  assert.match(section, /needs no issue and no review/);
});
