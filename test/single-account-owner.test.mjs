import { test } from "node:test";
import assert from "node:assert/strict";
import { flatten, readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skill = async () => flatten(await readFile(join(repoRoot, "skills", "setup-repo-protection", "SKILL.md"), "utf8"));

// #334: an owner who uses one code host account with the agents.
test("setup-repo-protection names the single-account case and its safe settings", async () => {
  const text = await skill();
  for (const fact of [
    "Check whether the owner and the agents use one code host account.",
    "The code host does not let the author approve their own pull request.",
    "Set required approvals to 0. Do not require a code owner review.",
    "The `CODEOWNERS` entry from step 4 then has no effect. Do not rely on it.",
    "Keep all other rules from step 2.",
  ]) assert.ok(text.includes(fact), fact);
});

test("the single-account step keeps the independent review and gives a sample exception", async () => {
  const text = await skill();
  for (const fact of [
    "Each pull request still needs an independent review before the merge. See [review and merge](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md).",
    "The owner writes the review of each CI workflow change in the pull request before the merge.",
    "- dkstack rule: setup-repo-protection, the `CODEOWNERS` entry that requires the owner's review for the CI workflow files.",
    "- Project rule: no required approval.",
    "- Reason: the owner and the agents use one account.",
  ]) assert.ok(text.includes(fact), fact);
});
