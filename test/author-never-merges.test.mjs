import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function page(path) {
  return readFile(join(repoRoot, path), "utf8");
}

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
  return lines.slice(start + 1, end).join("\n");
}

function flatten(text) {
  return text.replace(/\s+/g, " ").trim();
}

function items(section, marker) {
  const found = [];
  for (const line of section.split("\n")) {
    if (line.startsWith(marker)) found.push(line.slice(marker.length));
    else if (line.startsWith("  ") && found.length > 0) found[found.length - 1] += ` ${line}`;
  }
  return found.map(flatten);
}

// SEN-9, ATL-5, SCR-11 and ATL-16 in #154: review-and-merge.md "Rules" owns
// the merge gate. The tests pin its key facts, not full sentences (D7). The
// other pages have one short sentence and a link.
const OWNER_LINK = /review-and-merge\.md#rules\)/;

test("the review Rules own the full merge gate", async () => {
  const rules = flatten(sectionText(await page("workflow/review-and-merge.md"), "## Rules"));
  for (const fact of ["The author never merges.", "only the head that they reviewed", "all required checks are green",
    "no rule bypassed", "may also merge, including a pull request that they authored"]) {
    assert.ok(rules.includes(fact), fact);
  }
});

test("the role Rules say that the author must not merge, and link the merge gate", async () => {
  const rules = flatten(sectionText(await page("workflow/roles.md"), "## Rules"));
  assert.ok(rules.includes("the author must not review, approve or merge their own pull request"));
  assert.match(rules, OWNER_LINK);
  assert.doesNotMatch(rules, /all merge checks pass/);
});

test("the Flow merge step says that the author never merges, and links the merge gate", async () => {
  const step = items(sectionText(await page("workflow/index.md"), "## Flow"), "4. ").join(" ");
  assert.ok(step.includes("The author never merges."));
  assert.match(step, OWNER_LINK);
  assert.doesNotMatch(step, /required checks are green|no rule bypassed/);
});

test("safety.md and code-review link the merge gate and do not restate it", async () => {
  const safety = flatten(await page("workflow/safety.md"));
  assert.ok(safety.includes("The author agent never merges."));
  assert.match(safety, OWNER_LINK);
  const review = flatten(await page("skills/code-review/SKILL.md"));
  assert.match(review, OWNER_LINK);
  assert.doesNotMatch(review, /Required checks on that head must be green/);
});
