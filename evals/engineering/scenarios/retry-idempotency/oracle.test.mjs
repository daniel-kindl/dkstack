import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.DKSTACK_CANDIDATE_ROOT;
if (!root) throw new Error("Missing candidate root");
const { submitWithRetry } = await import(pathToFileURL(resolve(root, "subject.mjs")).href);

test("transient failure retains idempotency identity", async () => {
  const keys = [];
  const send = async (key) => {
    keys.push(key);
    if (keys.length < 3) throw new Error("transient");
    return "ok";
  };
  assert.equal(await submitWithRetry(send, "request-17", 3), "ok");
  assert.deepEqual(keys, ["request-17", "request-17", "request-17"]);
});
test("bounded attempts propagate terminal failure", async () => {
  let calls = 0;
  await assert.rejects(submitWithRetry(async () => { calls += 1; throw new Error("down"); }, "id", 2), /down/);
  assert.equal(calls, 2);
});
test("rejects unsafe retry count", async () => {
  await assert.rejects(submitWithRetry(async () => "ok", "id", 0), RangeError);
});
