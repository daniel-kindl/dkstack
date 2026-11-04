import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("the review Rules say that the author never merges", async () => {
  const rules = items(sectionText(await page("workflow/review-and-merge.md"), "## Rules"), "- ");
  const merge = rules.filter((item) => item.includes("The author never merges."));
  assert.deepEqual(merge, [
    "The reviewer merges only the head that they reviewed, and only when the review passes, all required checks are green, and the code host shows the pull request as ready to merge with no rule bypassed. The author never merges. The [human owner](roles.md#human-owner) may also merge, including a pull request that they authored, after the same checks pass. Reason: a later push, a failed check, an open finding or a bypassed rule must not reach `main`.",
  ]);
});

test("the role Rules say that the author must not merge", async () => {
  const rules = items(sectionText(await page("workflow/roles.md"), "## Rules"), "- ");
  const merge = rules.filter((item) => item.includes("the author must not review, approve or merge"));
  assert.deepEqual(merge, [
    "One agent can hold more than one role, but the author must not review, approve or merge their own pull request. Reason: a second agent finds errors that the author does not see.",
  ]);
});

test("the Flow merge step says that the author never merges", async () => {
  const flow = sectionText(await page("workflow/index.md"), "## Flow");
  const step = items(flow, "4. ");
  assert.deepEqual(step, [
    "The reviewer merges only the head that they reviewed, and only when the review passes, all required checks are green, and the code host shows the pull request as ready to merge with no rule bypassed. The author never merges. The [human owner](roles.md#human-owner) may also merge.",
  ]);
});
