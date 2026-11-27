import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.DKSTACK_CANDIDATE_ROOT;
if (!root) throw new Error("Missing candidate root");
const { runJobs } = await import(pathToFileURL(resolve(root, "subject.mjs")).href);

test("already aborted signal runs no jobs", async () => {
  const controller = new AbortController();
  controller.abort();
  let called = 0;
  await assert.rejects(runJobs([async () => { called += 1; }], controller.signal), { name: "AbortError" });
  assert.equal(called, 0);
});
test("abort between jobs stops further work", async () => {
  const controller = new AbortController();
  let called = 0;
  await assert.rejects(runJobs([
    async () => { called += 1; controller.abort(); return "first"; },
    async () => { called += 1; return "second"; },
  ], controller.signal), { name: "AbortError" });
  assert.equal(called, 1);
});
test("successful jobs preserve input order", async () => {
  assert.deepEqual(await runJobs([async () => 1, async () => 2], new AbortController().signal), [1, 2]);
});
