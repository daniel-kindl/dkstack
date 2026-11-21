import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// SCR-14 in #154: one word for one meaning. Rule text says "the owner",
// prose says "pull request", and the result value is NOT RUN.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(join(repoRoot, file), "utf8");
const QUOTE = "Daniel: approve this workflow run yourself. No agent approves it.";

test("the release rule text says the owner, not Daniel or he", async () => {
  for (const file of ["versioning/index.md", "workflow/safety.md"]) {
    const text = (await read(file)).replaceAll(QUOTE, "");
    assert.doesNotMatch(text, /\bDaniel\b/, file);
    assert.doesNotMatch(text, /\b[Hh](?:e|is|im)\b/, file);
  }
  const agents = await read("AGENTS.md");
  assert.equal(agents.split("Daniel").length - 1, 1, "AGENTS.md names Daniel once");
});

test("prose says pull request, not PR, outside trigger words", async () => {
  const sections = ["architecture", "coding", "ui", "versioning", "workflow", "writing", "tdd"];
  const files = [];
  for (const dir of sections) files.push(...(await readdir(join(repoRoot, dir))).filter((f) => f.endsWith(".md")).map((f) => `${dir}/${f}`));
  for (const dir of await readdir(join(repoRoot, "skills"), { withFileTypes: true })) {
    if (dir.isDirectory()) files.push(`skills/${dir.name}/SKILL.md`);
  }
  // The Low on #256: the top-level pages too. An ADR is a record, so docs/adr/ is not changed.
  files.push("README.md", "CONTRIBUTING.md", "SECURITY.md", "AGENTS.md", "sample-AGENTS.md");
  for (const file of files) {
    const text = (await read(file)).replace(/Triggers:[^"\n]*/g, "").replace(/`[^`]*`/g, "");
    assert.doesNotMatch(text, /\bPRs?\b/, file);
  }
});

test("plan-work writes NOT RUN", async () => {
  const text = await read("skills/plan-work/SKILL.md");
  assert.doesNotMatch(text, /record it as not run/);
  assert.match(text, /record it as NOT RUN/);
});
