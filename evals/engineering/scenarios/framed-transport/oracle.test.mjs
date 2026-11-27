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
// The protocol limit is 1024 bytes. Each frame below is complete, so only the limit can reject it.
const LIMIT = 1024;
const frame = (size) => Buffer.concat([Buffer.from([size >> 8, size & 0xff]), Buffer.alloc(size, 7)]);
test("accepts a frame of exactly the limit", () => {
  assert.deepEqual(decodeFrames([frame(LIMIT)]).map((value) => value.length), [LIMIT]);
});
test("rejects a complete frame one byte above the limit", () => {
  assert.throws(() => decodeFrames([frame(LIMIT + 1)]), RangeError);
});
test("rejects truncated final frame with a truncated error", () => {
  assert.throws(() => decodeFrames([Buffer.from([0, 3, 65])]), (error) =>
    error instanceof Error && !(error instanceof TypeError) && /truncated/.test(error.message));
});
