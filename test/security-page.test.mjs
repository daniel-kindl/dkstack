import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFile(join(repoRoot, ...parts), "utf8");

// Return the text of one section, up to the next heading of the same or a higher level.
function section(text, heading) {
  const lines = text.split("\n");
  const level = heading.match(/^#+/)[0].length;
  const start = lines.indexOf(heading);
  assert.notEqual(start, -1, `missing heading: ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = /^(#+) /.exec(lines[i]);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join(" ").replace(/\s+/g, " ");
}

// The key phrases pin the rules, not the full sentences (#154, D7).
test("the CI workflows section of the security page has each rule", async () => {
  const ci = section(await read("coding", "security.md"), "## CI workflows");
  for (const phrase of [
    "Do not run untrusted code with secrets or a write token",
    "`pull_request_target`",
    "`workflow_run`",
    "Pass the value through `env:`",
    "`secrets: inherit`",
    "`toJSON(secrets)`",
    "`persist-credentials: false`",
    "Set the least `permissions:` at the top level",
    "`timeout-minutes` on each job",
    "Require approval before a workflow runs for a pull request from a fork",
  ]) {
    assert.ok(ci.includes(phrase), `missing: ${phrase}`);
  }
});

test("the security page says what a safe release or deploy workflow is", async () => {
  const release = section(await read("coding", "security.md"), "### Release and deploy workflows");
  for (const phrase of [
    "The owner starts it with `workflow_dispatch`",
    "No tag push and no merge push starts it",
    "No bot identity can act as that reviewer",
    "checks that the ref is `main`",
    "`concurrency`",
    "short-lived token with the least scope",
  ]) {
    assert.ok(release.includes(phrase), `missing: ${phrase}`);
  }
});

test("review-standards links the CI workflows rules and does not copy them", async () => {
  const review = await read("skills", "review-standards", "SKILL.md");
  assert.ok(
    review.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md#ci-workflows)"),
  );
  assert.ok(!review.includes("persist-credentials"));
});

// SEN-M9 in #154: one runbook for a leaked token, key or password.
test("the security page has a leak runbook in order, and the leak rule links it", async () => {
  const page = await read("coding", "security.md");
  const runbook = section(page, "## If a secret leaks");
  const order = ["Tell the owner", "Revoke", "Rotate", "audit log", "secret scanning alerts", "Record the event"]
    .map((phrase) => {
      const at = runbook.indexOf(phrase);
      assert.notEqual(at, -1, `missing: ${phrase}`);
      return at;
    });
  assert.deepEqual([...order].sort((a, b) => a - b), order, "the steps are in order");
  assert.ok(runbook.includes("(../versioning/index.md#one-time-setup)"), "the release app key step links versioning");
  const rule = section(page, "## Rules").split("- ").find((r) => r.startsWith("If a secret leaks"));
  assert.ok(rule?.includes("(#if-a-secret-leaks)"), "the leak rule links the runbook");
});
