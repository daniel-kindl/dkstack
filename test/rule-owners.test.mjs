import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// SCR-20, ATL-12, REED-9 and SEN-18 in #154: each rule has one owner page.
// The other pages link the owner and do not copy the rule.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (file) => (await readFile(join(repoRoot, file), "utf8")).replace(/\s+/g, " ");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

test("code-review links the title rule and does not copy the length limit", async () => {
  const review = await read("skills/code-review/SKILL.md");
  assert.ok(review.includes(`(${RAW}version-control/index.md#rules)`));
  assert.doesNotMatch(review, /50 characters|code points/);
});

test("coding/practices.md links the quality gates and does not copy the check rules", async () => {
  const practices = await read("coding/practices.md");
  assert.ok(practices.includes("(quality-gates.md)"));
  assert.doesNotMatch(practices, /Run all checks before you open a pull request|as NOT RUN/);
});

test("coding/quality.md links error handling", async () => {
  assert.ok((await read("coding/quality.md")).includes("(error-handling.md)"));
});

test("coding/index.md says that testing.md points to tdd/", async () => {
  const index = await read("coding/index.md");
  assert.ok(index.includes("[testing.md](testing.md): A pointer to [tdd/](../tdd/index.md)"));
});

test("architecture/reversibility.md links the easier to change rule and does not copy it", async () => {
  const page = await read("architecture/reversibility.md");
  assert.ok(page.includes("(index.md#easier-to-change)"));
  assert.doesNotMatch(page, /cheaper to change when two options are otherwise equal/);
});

test("tdd/security-testing.md sends a report to the project's SECURITY.md", async () => {
  const page = await read("tdd/security-testing.md");
  assert.ok(page.includes("the project's `SECURITY.md`"));
});
