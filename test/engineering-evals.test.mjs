import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadScenarios, safeRelativePath, gradeScenario, compareScenario } from "../scripts/engineering-evals.mjs";

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

test("each broken starter fails its independent oracle", async () => {
  for (const item of await loadScenarios()) {
    const starter = new URL("../evals/engineering/" + item.starter + "/", import.meta.url);
    const result = await gradeScenario(item, starter);
    assert.equal(result.passed, false, item.id);
  }
});

test("candidate solutions pass independent oracles", async () => {
  const sources = {
    "framed-transport": `export function decodeFrames(chunks) {
      const buffer = Buffer.concat(chunks.map((value) => Buffer.from(value)));
      const frames = [];
      let at = 0;
      while (at < buffer.length) {
        if (at + 2 > buffer.length) throw new Error("truncated header");
        const size = buffer.readUInt16BE(at);
        if (size > 1024) throw new RangeError("frame too large");
        at += 2;
        if (at + size > buffer.length) throw new Error("truncated payload");
        frames.push(buffer.subarray(at, at + size));
        at += size;
      }
      return frames;
    }`,
    "retry-idempotency": `export async function submitWithRetry(send, key, attempts = 3) {
      if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError("attempts");
      for (let count = 0; count < attempts; count += 1) {
        try {
          return await send(key);
        } catch (error) {
          if (count === attempts - 1) throw error;
        }
      }
    }`,
    "async-cancellation": `export async function runJobs(jobs, signal) {
      const results = [];
      for (const job of jobs) {
        if (signal.aborted) throw signal.reason;
        results.push(await job());
      }
      if (signal.aborted) throw signal.reason;
      return results;
    }`,
  };
  for (const item of await loadScenarios()) {
    const temp = await mkdtemp(join(tmpdir(), "dkstack-candidate-"));
    try {
      await writeFile(join(temp, "subject.mjs"), sources[item.id]);
      const result = await gradeScenario(item, temp);
      assert.equal(result.passed, true, item.id + "\n" + result.output);
      const comparison = await compareScenario(item.id, temp);
      assert.equal(comparison.outcome, "PASS", item.id);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }
});
