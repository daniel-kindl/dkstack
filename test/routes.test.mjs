import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ATL-M4 and SCR-M6 in #154: each skill and each page can be found from the
// entry points. A new skill or page that nobody links fails here.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(join(repoRoot, file), "utf8");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const SECTIONS = ["architecture", "coding", "learning", "tdd", "tips", "ui", "version-control", "versioning", "workflow", "writing"];

const skills = (await readdir(join(repoRoot, "skills"), { withFileTypes: true }))
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();
const skillText = Object.fromEntries(await Promise.all(skills.map(async (s) => [s, await read(`skills/${s}/SKILL.md`)])));
const links = (text, name) => text.includes(`${RAW}skills/${name}/SKILL.md`);

// Return the skills that an agent reaches from triage: the skills that triage
// links, and the skills that those skills link, at any depth.
function reachable(from) {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const name of skills) {
      if (!seen.has(name) && links(skillText[current], name)) {
        seen.add(name);
        queue.push(name);
      }
    }
  }
  return seen;
}

test("skills/index.md lists each skill", async () => {
  const index = await read("skills/index.md");
  for (const name of skills) assert.ok(index.includes(`(${name}/SKILL.md)`), `skills/index.md does not list ${name}`);
});

test("triage reaches each skill, directly or through a skill that it links", () => {
  const seen = reachable("triage");
  const missing = skills.filter((name) => !seen.has(name));
  assert.deepEqual(missing, []);
});

test("the reach test fails when triage drops a skill that only triage links", () => {
  const saved = skillText.triage;
  try {
    skillText.triage = saved.split("\n").filter((l) => !l.includes(`${RAW}skills/learn/SKILL.md`)).join("\n");
    assert.equal(reachable("triage").has("learn"), false);
  } finally {
    skillText.triage = saved;
  }
});

test("each section index lists each page of its section", async () => {
  for (const section of SECTIONS) {
    const index = await read(`${section}/index.md`);
    const pages = (await readdir(join(repoRoot, section))).filter((f) => f.endsWith(".md") && f !== "index.md");
    for (const page of pages) assert.ok(index.includes(`(${page})`) || index.includes(`(${page}#`), `${section}/index.md does not list ${page}`);
  }
});

test("AGENTS.md lists each section index, except tips while it has no tip", async () => {
  const agents = await read("AGENTS.md");
  const sections = agents.slice(agents.indexOf("## Sections\n"), agents.indexOf("\n## ", agents.indexOf("## Sections\n") + 1));
  const tips = await read("tips/index.md");
  for (const section of [...SECTIONS, "skills"]) {
    if (section === "tips" && tips.includes("(None yet.")) continue;
    assert.ok(sections.includes(`(${section}/index.md)`), `AGENTS.md "Sections" does not list ${section}/index.md`);
  }
});
