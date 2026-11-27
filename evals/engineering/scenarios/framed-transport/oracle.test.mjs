import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.DKSTACK_CANDIDATE_ROOT;
if (!root) throw new Error("Missing candidate root");
const { decodeFrames } = await import(pathToFileURL(resolve(root, "subject.mjs")).href);

test("two frames survive fragmentation and coalescing", () => {
  const chunks = [Buffer.from([0, 3, 65]), Buffer.from([66, 67, 0, 2, 68]), Buffer.from([69])];
  assert.deepEqual(decodeFrames(chunks).map((value) => Buffer.from(value).toString()), ["ABC", "DE"]);
});
test("rejects length above protocol limit", () => {
  assert.throws(() => decodeFrames([Buffer.from([4, 1])]), RangeError);
});
test("rejects truncated final frame", () => {
  assert.throws(() => decodeFrames([Buffer.from([0, 3, 65])]), Error);
});
