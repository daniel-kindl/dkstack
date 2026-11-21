import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, sectionText } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The pre-release audit of 1.6.0 found stale, duplicated and conflicting text.
// Each test pins one fix so that the old text does not come back.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = (file) => readFile(join(repoRoot, file), "utf8");
const read = async (file) => (await raw(file)).replace(/\s+/g, " ");

test("the Unreleased notes do not name the removed roles.md as a current owner", async () => {
  const changelog = await raw("CHANGELOG.md");
  const unreleased = changelog.slice(changelog.indexOf("## [Unreleased]"), changelog.indexOf("## [1.5.0]"));
  const changed = sectionText(unreleased, "### Changed").replace(/\s+/g, " ");
  assert.ok(!changed.includes("workflow/roles.md"), "Changed names workflow/roles.md");
  assert.ok(changed.includes('`workflow/safety.md` "Owner records"'));
});

test("ADR 0001 records that 1.6.0 ships its breaking changes on v1, for one release only", async () => {
  const adr = await read("docs/adr/0001-how-consumers-follow-versions.md");
  assert.ok(adr.includes("### Amendment 2026-11-21, 1.6.0 on v1"));
  assert.ok(adr.includes('"I will release is as v1 1.6.0. Fix all other findings."'));
  assert.ok(adr.includes("This is an exception for one release only."));
  const amendment = adr.slice(adr.indexOf("### Amendment 2026-11-21, 1.6.0 on v1"), adr.indexOf("## Consequences"));
  assert.ok(amendment.includes("See #288."), "the amendment links the issue");
  assert.ok(amendment.includes("three breaking changes"));
  assert.ok(amendment.includes('the first amendment of 2026-11-11: > This is an exception for one release only. The rule "A breaking release starts `v2`" applies to > every later release.'),
    "the amendment quotes the sentence that it replaces");
});

test("DRY defers the extract decision to the stewardship trade-off", async () => {
  const dry = await read("architecture/dry.md");
  assert.ok(!dry.includes("When you see the same idea twice, extract it."));
  assert.ok(dry.includes("(stewardship.md#trade-offs)"));
});

test("security.md defines a secret once", async () => {
  const page = await read("coding/security.md");
  assert.equal(page.split("A secret is ").length - 1, 1, "more than one definition of a secret");
  assert.ok(page.includes("A secret is a credential, a session ID, a token, a key or a password."));
});

test("the release workflow comment says which token writes", async () => {
  const workflow = await read(".github/workflows/release.yml");
  assert.ok(!workflow.includes("It uses only GITHUB_TOKEN."));
  assert.ok(workflow.includes("# passes. The workflow never force-pushes. GITHUB_TOKEN only reads. A token # from the release app does all the writes."));
});

test("versioning names the commit step as the last step that runs repository code", async () => {
  const page = await read("versioning/index.md");
  assert.ok(page.includes("It commits the release and writes the notes. This is the last step that runs repository code."));
});

test("versioning links the release OK in safety.md and does not copy it", async () => {
  const page = await read("versioning/index.md");
  assert.ok(!page.includes("The owner's OK for a release is two actions."));
  assert.ok(!page.includes("No bot starts the workflow or approves the environment."));
  assert.ok(page.includes("[Safety](../workflow/safety.md) owns the release rule and says what counts as the owner's OK."));
});

test("code-review links the unproven rule in verify-claim and does not copy it", async () => {
  const page = await read("skills/code-review/SKILL.md");
  assert.ok(!page.includes("A required behavior below level 4 is unproven."));
  const verify = sectionText(await raw("skills/code-review/SKILL.md"), "## 8. Verify").replace(/\s+/g, " ");
  assert.ok(verify.includes("An unproven required behavior gets the severity that verify-claim gives it."));
  assert.ok(verify.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/verify-claim/SKILL.md)"));
});

test("small-steps does not claim that AGENTS.md asks for small commits", async () => {
  const page = await read("architecture/small-steps.md");
  assert.ok(!page.includes("make small commits"));
  assert.ok(page.includes("(../AGENTS.md#key-rules)"));
});

test("the Fixed entry names the words that the pages use", async () => {
  const changelog = await read("CHANGELOG.md");
  assert.ok(changelog.includes('say "person" or "people", not "human".'));
});

test("the pages say person or people, not human", async () => {
  for (const file of ["skills/writing-check/SKILL.md", "architecture/stewardship.md", "skills/triage/SKILL.md"]) {
    assert.doesNotMatch(await read(file), /\bhumans?\b/i, file);
  }
});
