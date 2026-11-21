import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// REED-10 and REED-MISS-2 in #154, after D4: "D4: a public product for any
// team". One tagline, and the README says what dkstack is and how to start.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (file) => (await readFile(join(repoRoot, file), "utf8")).replace(/\s+/g, " ");
const TAGLINE = "Rules and skills for AI coding agents, in one place.";

test("README.md, package.json and AGENTS.md use one tagline", async () => {
  assert.ok((await read("README.md")).startsWith(`# dkstack ${TAGLINE}`));
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.description, TAGLINE);
  assert.ok((await read("AGENTS.md")).includes(TAGLINE));
  for (const file of ["README.md", "AGENTS.md"]) assert.doesNotMatch(await read(file), /coding AI agents/);
});

test("the README top says what dkstack is, that it is guidance only, who it is for, and how to start", async () => {
  const readme = await read("README.md");
  const top = readme.slice(0, readme.indexOf("## Release status"));
  for (const phrase of ["guidance only", "any team", "## Start", "sample-AGENTS.md", "triage"]) {
    assert.ok(top.includes(phrase), phrase);
  }
});
