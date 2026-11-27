import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";

const pages = [
  "workflow/agent-execution.md",
  "workflow/coordination.md",
  "workflow/recovery.md",
  "workflow/risk-assessment.md",
];

test("agent execution guides carry concrete safety contracts", async () => {
  for (const path of pages) {
    const content = await readFile(new URL("../" + path, import.meta.url), "utf8");
    assert.ok(content.includes("# "), path);
    assert.ok(content.includes("## "), path);
  }
  const execution = await readFile(new URL("../workflow/agent-execution.md", import.meta.url), "utf8");
  assert.match(execution, /uncommitted changes/);
  assert.match(execution, /untrusted data/);
  const coordination = await readFile(new URL("../workflow/coordination.md", import.meta.url), "utf8");
  assert.match(coordination, /two agents edit the same file concurrently/);
  const recovery = await readFile(new URL("../workflow/recovery.md", import.meta.url), "utf8");
  assert.match(recovery, /last confirmed successful action/);
  const risk = await readFile(new URL("../workflow/risk-assessment.md", import.meta.url), "utf8");
  assert.match(risk, /High/);
  assert.match(risk, /NOT RUN/);
});
