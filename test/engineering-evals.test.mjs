import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadScenarios, safeRelativePath } from "../evals/engineering/run.mjs";

test("engineering scenario manifest is valid", async () => {
  const cases = await loadScenarios();
  assert.equal(cases.length, 3);
  assert.equal(new Set(cases.map((item) => item.id)).size, cases.length);
});
test("reject unsafe paths", () => {
  for (const value of ["../out", "/root", "a//b", "./a", "a/../b", ""]) {
    assert.equal(safeRelativePath(value), false);
  }
  assert.equal(safeRelativePath("scenarios/test/starter"), true);
});
test("reject duplicate scenario IDs", async () => {
  const temp = await mkdtemp(join(tmpdir(), "dkstack-engineering-eval-"));
  try {
    await mkdir(join(temp, "scenarios", "sample", "starter"), { recursive: true });
    await writeFile(join(temp, "scenarios", "sample", "oracle.test.mjs"), "test");
    await writeFile(join(temp, "scenarios", "sample", "starter", "subject.mjs"), "export {};");
    const item = { id: "sample", goal: "goal", topic: "topic", oracle: "scenarios/sample/oracle.test.mjs", starter: "scenarios/sample/starter" };
    await writeFile(join(temp, "scenarios.json"), JSON.stringify([item, item]));
    await assert.rejects(loadScenarios(temp), /duplicate/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
