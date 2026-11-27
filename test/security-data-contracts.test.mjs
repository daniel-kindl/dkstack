import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";

test("security and data rules cover cross-boundary failure modes", async () => {
  const cases = [
    ["coding/threat-modeling.md", /Prompt injection|prompt injection/i],
    ["coding/data-integrity.md", /rollback/i],
    ["architecture/api-contracts.md", /external/i],
  ];
  for (const [path, expression] of cases) {
    const content = await readFile(new URL("../" + path, import.meta.url), "utf8");
    assert.match(content, expression, path);
    assert.ok(content.includes("## "), path);
  }
});
test("migration and threat skills preserve owner control", async () => {
  const assess = await readFile(new URL("../skills/assess-threats/SKILL.md", import.meta.url), "utf8");
  const migrate = await readFile(new URL("../skills/migrate-data/SKILL.md", import.meta.url), "utf8");
  assert.match(assess, /Do not test production endpoints/);
  assert.match(migrate, /Do not run production migrations/);
  assert.match(assess, /negative test/);
  assert.match(migrate, /dry run/);
});
