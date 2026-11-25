import { test } from "node:test";
import assert from "node:assert/strict";
import { flatten, readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function page(path) {
  return flatten(await readFile(join(repoRoot, path), "utf8"));
}

// #335: push protection of the code host meets the secret scan rule.
test("the security rule says push protection meets the secret scan rule", async () => {
  const text = await page("coding/security.md");
  for (const fact of [
    "Push protection of the code host meets this rule when it is on.",
    "It blocks a secret before the secret enters the history.",
    "If push protection is not on, run a pinned secret scanner in CI.",
    "This reading of the rule is deliberate.",
    "It scans only new pushes, so it does not find a secret that is already in the history.",
    "A person can bypass a block with a reason.",
    "It finds only known secret patterns.",
    "For a repository that has history from before push protection was on, run one scan of the full history.",
  ]) assert.ok(text.includes(fact), fact);
});

test("setup-quality-gates tells a consumer which secret scan option applies", async () => {
  const text = await page("skills/setup-quality-gates/SKILL.md");
  for (const fact of [
    "If the code host has push protection and it is on, add no secret scan to CI.",
    "If it is not on, add a secret scanner to CI.",
    "Pin the scanner by version and SHA-256.",
    "For a repository that has history from before the setting was on, run one scan of the full history with a pinned scanner.",
    "Push protection does not find a secret that is already in the history.",
  ]) assert.ok(text.includes(fact), fact);
});

test("setup-repo-protection links push protection to the rule", async () => {
  const text = await page("skills/setup-repo-protection/SKILL.md");
  assert.ok(text.includes("Push protection meets the secret scan rule in the security rules."));
});
