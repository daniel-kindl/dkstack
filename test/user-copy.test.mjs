import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// REED-MISS-1 in #154, P49 approved by the owner: one page for the copy that
// users of a product read. ASD-STE100 still applies (D3).

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (file) => (await readFile(join(repoRoot, file), "utf8")).replace(/\s+/g, " ");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

test("the user-facing copy page covers each kind of copy and keeps ASD-STE100", async () => {
  const page = await read("writing/user-facing-copy.md");
  for (const kind of ["product READMEs", "landing pages", "release notes", "announcements", "emails", "CLI messages", "app store text"]) {
    assert.ok(page.includes(kind), kind);
  }
  for (const rule of ["first", "concrete words", "Do not invent numbers, quotes, customers or comparisons",
    "No hype", "fake urgency", "fake scarcity", "(../ui/principles.md#no-deceptive-patterns)", "breaking changes",
    "voice guide", "(index.md)"]) {
    assert.ok(page.includes(rule), rule);
  }
  assert.doesNotMatch(page, /contraction/i);
});

test("the writing index, triage and the UI content page link the user-facing copy page", async () => {
  assert.ok((await read("writing/index.md")).includes("(user-facing-copy.md)"));
  const triage = await read("skills/triage/SKILL.md");
  const at = triage.indexOf("- Any text, including");
  const row = triage.slice(at, triage.indexOf(" - ", at + 2));
  assert.ok(row.includes(`(${RAW}writing/user-facing-copy.md)`), row);
  assert.ok((await read("ui/content-and-localization.md")).includes("(../writing/user-facing-copy.md)"));
});
