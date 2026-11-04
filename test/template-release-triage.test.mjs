import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CATALOG } from "../scripts/preflight.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function read(path) {
  return readFile(join(repoRoot, path), "utf8");
}

// Return the text of one "## " section, without its heading.
function sectionText(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.indexOf(heading);
  assert.notEqual(start, -1, `missing section ${heading}`);
  let end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  if (end === -1) end = lines.length;
  return lines.slice(start + 1, end);
}

test("the external request template sets the triage label from the catalog", async () => {
  const text = await read(".github/ISSUE_TEMPLATE/external-request.md");
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  assert.ok(m, "the template must have front matter");
  const labels = m[1].split(/\r?\n/).filter((line) => line.startsWith("labels:"));
  assert.deepEqual(labels, ['labels: ["status:triage"]']);
  assert.ok(CATALOG.some((label) => label.name === "status:triage"),
    "status:triage must be in the preflight label catalog");
});

test("the release skill applies the publish rule at step 5, before steps 6 and 7", async () => {
  const steps = sectionText(await read("skills/release/SKILL.md"), "## Steps")
    .filter((line) => /^\d+\. /.test(line));
  assert.deepEqual(steps.map((line) => line.split(".")[0]), ["1", "2", "3", "4", "5", "6", "7"]);
  assert.equal(steps[4],
    "5. Apply the publish rule. Stop when the rule does not allow the release. Do not start step 6 before this check passes.");
  assert.match(steps[5], /^6\. Follow the release steps on the versioning page\./);
  assert.match(steps[6], /^7\. Verify the release as the versioning page says\./);
});

test("the release skill stops at the right step when a piece is missing", async () => {
  const lines = sectionText(await read("skills/release/SKILL.md"), "## When a piece is missing")
    .filter((line) => line.trim() !== "");
  assert.deepEqual(lines, [
    "The steps expect a changelog entry, the rights to create a tag and the owner's OK for this release. " +
      "If a piece is missing, stop and report it. Do not guess the missing piece.",
    "- No changelog entry for this release: stop at step 3. Report that the entry is missing. " +
      "Do not write an entry that nobody reviewed.",
    "- No rights to create a tag or to do another release step: stop before step 6. " +
      "Report the step and the right that is missing. Do not use other rights and do not change the protection.",
    "- No OK from the owner for this release and this version: stop at step 5. " +
      "Report the version that you chose and ask the owner. An OK for a different version is not the OK.",
  ]);
});

test("the release skill Rules section keeps the publish rule", async () => {
  const rules = sectionText(await read("skills/release/SKILL.md"), "## Rules");
  assert.ok(rules.includes("- An agent publishes or releases only with the owner's explicit OK for that release. " +
    "The OK names the exact version. It never covers a production deploy or a project's release workflow."));
});
