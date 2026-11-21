import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = (path) => readFile(join(repoRoot, path), "utf8");
const read = async (path) => (await raw(path)).replace(/\s+/g, " ");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

// Issue #168: domain terms live in CONTEXT.md. The format is folium's (#153).
test("domain-languages owns CONTEXT.md, its path and its format", async () => {
  const text = await read("architecture/domain-languages.md");
  assert.match(text, /## Glossary/);
  for (const phrase of [
    "`CONTEXT.md` at the repository root",
    "a `## Language` heading",
    "`**Term**:`",
    "`_Avoid_:`",
    "Create `CONTEXT.md` when the first term is resolved.",
    "Do not put implementation details in the file.",
    "Put only terms of the domain in the file.",
    "Under it, write a short definition of what the term is.",
  ]) {
    assert.ok(text.includes(phrase), `missing: ${phrase}`);
  }
});

test("the Glossary section shows the format in an example", async () => {
  const text = await raw("architecture/domain-languages.md");
  const section = text.slice(text.indexOf("## Glossary"));
  assert.match(section, /^# .+$/m);
  assert.match(section, /^## Language$/m);
  assert.match(section, /^\*\*[^*]+\*\*:$/m);
  assert.match(section, /^_Avoid_: .+$/m);
});

test("the domain-glossary skill links the section and does not copy the format", async () => {
  const text = await read("skills/domain-glossary/SKILL.md");
  assert.ok(text.includes(`(${RAW}architecture/domain-languages.md#glossary)`));
  assert.doesNotMatch(text, /## Language/, "the skill must not copy the format");
});

test("triage, clarify-intent and code-review use CONTEXT.md", async () => {
  const triage = await read("skills/triage/SKILL.md");
  assert.ok(triage.includes("`CONTEXT.md`"));
  assert.ok(triage.includes("skills/domain-glossary/SKILL.md"));
  const clarify = await read("skills/clarify-intent/SKILL.md");
  assert.ok(clarify.includes("`CONTEXT.md`"));
  assert.ok(clarify.includes(`${RAW}architecture/domain-languages.md#glossary`));
  const review = await read("skills/code-review/SKILL.md");
  const domain = review.split("- Domain language: ")[1]?.split(" - ")[0] ?? "";
  assert.ok(domain.includes("`CONTEXT.md`"), "code-review must have a Domain language line");
  assert.ok(domain.includes("A name that uses a word from an `_Avoid_:` line is Low."));
  assert.ok(domain.includes("A name that gives a glossary term a different meaning is Medium."));
  assert.ok(domain.includes("A changed meaning with no change to `CONTEXT.md` is Medium."));
  assert.match(await read("skills/index.md"), /\[domain-glossary\]\(domain-glossary\/SKILL\.md\)/);
});
