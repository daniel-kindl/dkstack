import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pages = [
  "coding/performance.md",
  "coding/reliability.md",
  "coding/observability.md",
  "coding/networking.md",
  "coding/concurrency-practices.md",
  "coding/reproducible-builds.md",
];

test("operational guides describe independently verifiable engineering behavior", async () => {
  for (const path of pages) {
    const content = await readFile(new URL("../" + path, import.meta.url), "utf8");
    assert.ok(content.includes("# "), path);
    assert.ok(content.includes("## ") || content.includes("- "), path);
  }
  const texts = await Promise.all(pages.map(async (path) =>
    readFile(new URL("../" + path, import.meta.url), "utf8")));
  assert.match(texts[0], /baseline/);
  assert.match(texts[1], /idempotency/);
  assert.match(texts[2], /cardinality/);
  assert.match(texts[3], /complete message/);
  assert.match(texts[4], /synchronization/);
  assert.match(texts[5], /lockfiles/);
});

test("profile skill requires comparable measurements", async () => {
  const skill = await readFile(new URL("../skills/profile-performance/SKILL.md", import.meta.url), "utf8");
  assert.match(skill, /No speedup claim without comparable/);
  assert.match(skill, /NOT RUN/);
});
