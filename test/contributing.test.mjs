import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// SCR-M6, SCR-M5, FRG-M5 and ATL-3 in #154: CONTRIBUTING.md tells a
// contributor how to run the checks and what a new page or skill needs.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const text = (await readFile(join(repoRoot, "CONTRIBUTING.md"), "utf8")).replace(/\s+/g, " ");
const section = (heading) => text.slice(text.indexOf(heading), text.indexOf(" ## ", text.indexOf(heading) + heading.length));

test("CONTRIBUTING.md says how to run the checks", () => {
  const run = section("## Run the checks");
  for (const phrase of ["`npm run check`", "Node 24", "`npm run check:title -- \"<title>\"`"]) assert.ok(run.includes(phrase), phrase);
});

test("CONTRIBUTING.md lists what a new page or skill needs", () => {
  const add = section("## Add a page or a skill");
  for (const phrase of ["index", "triage", "test", "`## [Unreleased]`", "raw URL on `v1`"]) assert.ok(add.includes(phrase), phrase);
  assert.ok(text.includes("Each rule has one owner page. Other pages link to it."));
});

test("CONTRIBUTING.md says what to do with an update bot title over 50 characters", () => {
  const bot = section("## Update bot pull requests");
  for (const phrase of ["50", "edits the title before the merge", "`validate` runs again"]) assert.ok(bot.includes(phrase), phrase);
});
