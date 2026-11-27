import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadScenarios, safeRelativePath, gradeScenario, compareScenario, compareArms, main } from "../scripts/engineering-evals.mjs";

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
          if (error.permanent || count === attempts - 1) throw error;
        }
      }
    }`,
    "async-cancellation": `export async function runJobs(jobs, signal) {
      const results = [];
      for (const job of jobs) {
        if (signal.aborted) throw signal.reason;
        results.push(await job(signal));
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

// Each near miss is a wrong solution that an oracle must catch.
const NEAR_MISSES = {
  "framed-transport": {
    "no size limit": `export function decodeFrames(chunks) {
      const buffer = Buffer.concat(chunks.map((value) => Buffer.from(value)));
      const frames = [];
      let at = 0;
      while (at < buffer.length) {
        if (at + 2 > buffer.length) throw new Error("truncated header");
        const size = buffer.readUInt16BE(at);
        at += 2;
        if (at + size > buffer.length) throw new RangeError("truncated payload");
        frames.push(buffer.subarray(at, at + size));
        at += size;
      }
      return frames;
    }`,
    "a crash, not a truncated frame error": `export function decodeFrames(chunks) {
      const buffer = Buffer.concat(chunks.map((value) => Buffer.from(value)));
      const frames = [];
      let at = 0;
      while (at < buffer.length) {
        const size = buffer.readUInt16BE(at);
        if (size > 1024) throw new RangeError("frame too large");
        at += 2;
        if (at + size > buffer.length) null.crash;
        frames.push(buffer.subarray(at, at + size));
        at += size;
      }
      return frames;
    }`,
  },
  "retry-idempotency": {
    "retries a permanent error": `export async function submitWithRetry(send, key, attempts = 3) {
      if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError("attempts");
      for (let count = 0; count < attempts; count += 1) {
        try {
          return await send(key);
        } catch (error) {
          if (count === attempts - 1) throw error;
        }
      }
    }`,
  },
  "async-cancellation": {
    "does not pass the signal to a job": `export async function runJobs(jobs, signal) {
      const results = [];
      for (const job of jobs) {
        if (signal.aborted) throw signal.reason;
        results.push(await job());
      }
      if (signal.aborted) throw signal.reason;
      return results;
    }`,
  },
};

test("each oracle rejects the near misses for its goal", async () => {
  const items = await loadScenarios();
  for (const [id, cases] of Object.entries(NEAR_MISSES)) {
    const item = items.find((value) => value.id === id);
    for (const [name, source] of Object.entries(cases)) {
      const temp = await mkdtemp(join(tmpdir(), "dkstack-candidate-"));
      try {
        await writeFile(join(temp, "subject.mjs"), source);
        const result = await gradeScenario(item, temp);
        assert.equal(result.passed, false, `${id}: ${name}\n${result.output}`);
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    }
  }
});

test("each scenario goal states the rule that its oracle checks", async () => {
  const goals = Object.fromEntries((await loadScenarios()).map((item) => [item.id, item.goal]));
  assert.match(goals["framed-transport"], /at most 1024 bytes/);
  assert.match(goals["framed-transport"], /RangeError/);
  assert.match(goals["framed-transport"], /"truncated"/);
  assert.match(goals["retry-idempotency"], /permanent/);
  assert.match(goals["async-cancellation"], /Pass the signal to each job/);
});

// Capture what main writes, so the CLI tests run in this process and count for coverage.
function io() {
  const out = { stdout: "", stderr: "" };
  return { out, stdout: { write: (text) => { out.stdout += text; } }, stderr: { write: (text) => { out.stderr += text; } } };
}

test("compareArms reports an arm with no candidate as NOT RUN", async () => {
  await scenarioRoot(async (base) => {
    const result = await compareArms("sample", {}, base);
    assert.equal(result.starter_passed, false);
    assert.deepEqual(result.arms.baseline, { status: "NOT_RUN", reason: "No candidate for this arm" });
    assert.deepEqual(result.arms.dkstack, { status: "NOT_RUN", reason: "No candidate for this arm" });
    assert.equal(result.comparison, "NOT_RUN");
  });
});

test("compareArms compares the baseline arm with the dkstack arm", async () => {
  await scenarioRoot(async (base, temp) => {
    const good = join(temp, "good");
    const bad = join(temp, "bad");
    await mkdir(good);
    await mkdir(bad);
    await writeFile(join(good, "subject.mjs"), "export const value = 1;\n");
    await writeFile(join(bad, "subject.mjs"), "export const value = 2;\n");
    const better = await compareArms("sample", { baseline: bad, dkstack: good }, base);
    assert.equal(better.arms.baseline.status, "FAIL");
    assert.equal(better.arms.dkstack.status, "PASS");
    assert.equal(better.comparison, "DKSTACK_BETTER");
    assert.equal((await compareArms("sample", { baseline: good, dkstack: bad }, base)).comparison, "BASELINE_BETTER");
    assert.equal((await compareArms("sample", { baseline: good, dkstack: good }, base)).comparison, "SAME");
    const one = await compareArms("sample", { dkstack: good }, base);
    assert.equal(one.arms.baseline.status, "NOT_RUN");
    assert.equal(one.comparison, "NOT_RUN");
  });
});

test("compareArms gives no PASS when the starter already passes", async () => {
  await scenarioRoot(async (base, temp) => {
    const good = join(temp, "good");
    await mkdir(good);
    await writeFile(join(good, "subject.mjs"), "export const value = 1;\n");
    const result = await compareArms("sample", { dkstack: good }, base);
    assert.equal(result.starter_passed, true);
    assert.equal(result.arms.dkstack.status, "FAIL");
  }, { starter: "export const value = 1;\n" });
});

test("the CLI checks and lists the manifest", async () => {
  await scenarioRoot(async (base) => {
    const check = io();
    assert.equal(await main([], check, base), 0);
    assert.equal(check.out.stdout, "Validated 1 engineering scenarios.\n");
    const list = io();
    assert.equal(await main(["list"], list, base), 0);
    assert.deepEqual(JSON.parse(list.out.stdout).map((item) => item.id), ["sample"]);
  });
});

test("the CLI compare command prints NOT RUN for each arm with no candidate", async () => {
  await scenarioRoot(async (base) => {
    const run = io();
    assert.equal(await main(["compare", "sample"], run, base), 0);
    assert.equal(JSON.parse(run.out.stdout).comparison, "NOT_RUN");
    assert.match(run.out.stderr, /^baseline: NOT RUN, No candidate for this arm$/m);
    assert.match(run.out.stderr, /^dkstack: NOT RUN, No candidate for this arm$/m);
    assert.match(run.out.stderr, /^comparison: NOT RUN$/m);
  });
});

test("the CLI compare and grade commands run a candidate", async () => {
  await scenarioRoot(async (base, temp) => {
    const good = join(temp, "good");
    await mkdir(good);
    await writeFile(join(good, "subject.mjs"), "export const value = 1;\n");
    const compare = io();
    assert.equal(await main(["compare", "sample", "--dkstack", good, "--execute-untrusted"], compare, base), 0);
    assert.equal(JSON.parse(compare.out.stdout).arms.dkstack.status, "PASS");
    assert.match(compare.out.stderr, /^dkstack: PASS$/m);
    const grade = io();
    assert.equal(await main(["grade", "sample", good, "--execute-untrusted"], grade, base), 0);
    assert.equal(JSON.parse(grade.out.stdout).outcome, "PASS");
    const fail = io();
    assert.equal(await main(["grade", "sample", join(base, "scenarios", "sample", "starter"), "--execute-untrusted"], fail, base), 1);
  });
});

test("the CLI exits 2 with the usage for a bad command", async () => {
  await scenarioRoot(async (base, temp) => {
    for (const args of [
      ["unknown"],
      ["grade", "sample", temp],
      ["compare", "sample", "--dkstack", temp],
      ["compare", "sample", "--other", temp, "--execute-untrusted"],
      ["compare", "sample", "--dkstack"],
      ["compare"],
    ]) {
      const run = io();
      assert.equal(await main(args, run, base), 2, args.join(" "));
      assert.match(run.out.stderr, /^Usage:/m, args.join(" "));
    }
  });
});

test("the CLI exits 1 with the message for a manifest error", async () => {
  await scenarioRoot(async (base) => {
    const run = io();
    assert.equal(await main(["check"], run, base), 1);
    assert.match(run.out.stderr, /No scenarios/);
  }, { list: [] });
});
