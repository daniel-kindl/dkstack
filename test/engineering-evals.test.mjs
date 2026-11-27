import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadScenarios, safeRelativePath, gradeScenario, compareScenario } from "../scripts/engineering-evals.mjs";

test("engineering scenario manifest is valid", async () => {
  const cases = await loadScenarios();
  assert.deepEqual(cases.map((item) => item.id).sort(), ["async-cancellation", "framed-transport", "retry-idempotency"]);
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

const PASSING_ORACLE = `import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { value } = await import(pathToFileURL(resolve(process.env.DKSTACK_CANDIDATE_ROOT, "subject.mjs")).href);
test("value is 1", () => assert.equal(value, 1));
`;
const ITEM = { id: "sample", goal: "goal", topic: "topic", oracle: "scenarios/sample/oracle.test.mjs", starter: "scenarios/sample/starter" };

// Make a scenario root with one scenario. The starter exports value 0, so it fails the oracle.
async function scenarioRoot(fn, { list = [ITEM], starter = "export const value = 0;\n" } = {}) {
  const temp = await mkdtemp(join(tmpdir(), "dkstack-engineering-eval-"));
  try {
    const base = join(temp, "root");
    await mkdir(join(base, "scenarios", "sample", "starter"), { recursive: true });
    await writeFile(join(base, "scenarios", "sample", "oracle.test.mjs"), PASSING_ORACLE);
    await writeFile(join(base, "scenarios", "sample", "starter", "subject.mjs"), starter);
    await writeFile(join(base, "scenarios.json"), JSON.stringify(list));
    await fn(base, temp);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

test("loadScenarios names each manifest error", async () => {
  const cases = [
    [{}, /No scenarios/],
    [[], /No scenarios/],
    [[{ ...ITEM, id: "Bad Id" }], /Invalid or duplicate scenario ID/],
    [[{ ...ITEM, goal: " " }], /Missing goal/],
    [[{ ...ITEM, oracle: "../oracle.test.mjs" }], /Unsafe oracle/],
    [[{ ...ITEM, starter: "/tmp/starter" }], /Unsafe starter/],
    [[{ ...ITEM, oracle: "scenarios/sample/starter/subject.mjs" }], /Oracle must be a test module/],
    [[{ ...ITEM, starter: "scenarios/sample" }], /Starter subject missing/],
  ];
  for (const [list, message] of cases) {
    await scenarioRoot(async (base) => {
      await assert.rejects(loadScenarios(base), message, JSON.stringify(list));
    }, { list });
  }
});

test("loadScenarios rejects a symlinked parent folder that leaves the root", async () => {
  await scenarioRoot(async (base, temp) => {
    const outside = join(temp, "outside");
    await mkdir(join(outside, "x", "starter"), { recursive: true });
    await writeFile(join(outside, "x", "oracle.test.mjs"), PASSING_ORACLE);
    await writeFile(join(outside, "x", "starter", "subject.mjs"), "export const value = 0;\n");
    await symlink(outside, join(base, "linked"));
    const list = [{ ...ITEM, id: "x", oracle: "linked/x/oracle.test.mjs", starter: "linked/x/starter" }];
    await writeFile(join(base, "scenarios.json"), JSON.stringify(list));
    await assert.rejects(loadScenarios(base), /Outside evaluation root/);
  });
});

test("loadScenarios rejects a listed path that is a symlink inside the root", async () => {
  await scenarioRoot(async (base) => {
    await symlink(join(base, "scenarios", "sample", "oracle.test.mjs"), join(base, "scenarios", "sample", "link.test.mjs"));
    await writeFile(join(base, "scenarios.json"), JSON.stringify([{ ...ITEM, oracle: "scenarios/sample/link.test.mjs" }]));
    await assert.rejects(loadScenarios(base), /Symlink not allowed/);
  });
});

test("gradeScenario rejects a candidate subject that is a symlink", async () => {
  await scenarioRoot(async (base, temp) => {
    const candidate = join(temp, "candidate");
    await mkdir(candidate);
    await writeFile(join(temp, "real.mjs"), "export const value = 1;\n");
    await symlink(join(temp, "real.mjs"), join(candidate, "subject.mjs"));
    await assert.rejects(gradeScenario(ITEM, candidate, base), /regular subject\.mjs/);
  });
});

test("gradeScenario stops a candidate that runs past the time limit", { timeout: 20000 }, async () => {
  await scenarioRoot(async (base, temp) => {
    const candidate = join(temp, "candidate");
    await mkdir(candidate);
    await writeFile(join(candidate, "subject.mjs"), "// A busy loop: only the runner time limit can stop it.\nwhile (true) {}\nexport const value = 1;\n");
    const started = Date.now();
    const result = await gradeScenario(ITEM, candidate, base, { timeoutMs: 500 });
    assert.equal(result.passed, false);
    assert.match(result.error, /ETIMEDOUT/);
    assert.ok(Date.now() - started < 10000, "the runner stops the candidate");
  });
});

test("a scenario whose starter already passes cannot give PASS", async () => {
  await scenarioRoot(async (base, temp) => {
    const candidate = join(temp, "candidate");
    await mkdir(candidate);
    await writeFile(join(candidate, "subject.mjs"), "export const value = 1;\n");
    const result = await compareScenario("sample", candidate, base);
    assert.equal(result.starter_passed, true);
    assert.equal(result.candidate_passed, true);
    assert.equal(result.outcome, "FAIL");
  }, { starter: "export const value = 1;\n" });
});
