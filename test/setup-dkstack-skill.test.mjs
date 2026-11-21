import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseFrontmatter } from "../scripts/check-skills.mjs";

// Issue #290: the setup-dkstack skill connects a new or an existing repository to dkstack.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const LINK = `(${RAW}skills/setup-dkstack/SKILL.md)`;
const raw = (path) => readFile(join(repoRoot, path), "utf8");
const flat = async (path) => (await raw(path)).replace(/\s+/g, " ");

test("a person or an agent can start setup-dkstack", async () => {
  const fields = parseFrontmatter(await raw("skills/setup-dkstack/SKILL.md"));
  assert.equal(fields["disable-model-invocation"], undefined);
  assert.equal(fields["user-invocable"], undefined);
});

test("setup-dkstack handles a new and an existing AGENTS.md", async () => {
  const text = await flat("skills/setup-dkstack/SKILL.md");
  assert.ok(text.includes(`(${RAW}sample-AGENTS.md)`), "links sample-AGENTS.md on v1");
  assert.match(text, /If the file does not exist, copy/);
  assert.match(text, /If the file exists and has no dkstack URL, merge into it/);
  assert.match(text, /Do not delete project text/);
  assert.match(text, /different version or tag, tell the owner/);
});

test("setup-dkstack does not overwrite CLAUDE.md and installs skills only with the owner's OK", async () => {
  const text = await flat("skills/setup-dkstack/SKILL.md");
  assert.match(text, /`@AGENTS\.md`/);
  assert.match(text, /Do not delete or overwrite its text/);
  assert.match(text, /install the skills\. Ask the owner first/);
});

test("setup-dkstack records an exception only with the owner's OK and never for safety", async () => {
  const text = await flat("skills/setup-dkstack/SKILL.md");
  assert.ok(text.includes(`(${RAW}AGENTS.md#precedence)`));
  assert.ok(text.includes(`(${RAW}workflow/safety.md)`));
  assert.match(text, /cannot be an exception/);
});

test("bootstrap step 1, triage and the skill index use setup-dkstack", async () => {
  const bootstrap = await raw("skills/bootstrap/SKILL.md");
  const one = /^1\. (.*)$/m.exec(bootstrap)[1];
  assert.ok(one.includes(LINK), "bootstrap step 1");
  assert.ok((await raw("skills/triage/SKILL.md")).includes(LINK), "triage");
  assert.match(await raw("skills/index.md"), /^- \[setup-dkstack\]\(setup-dkstack\/SKILL\.md\) \(both\):/m);
});
