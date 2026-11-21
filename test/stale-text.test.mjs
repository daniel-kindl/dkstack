import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ATL-14 and the findings in its group in #154: releases exist since v1.0.0,
// so text from before the first release is stale.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (file) => (await readFile(join(repoRoot, file), "utf8")).replace(/\s+/g, " ");

test("README.md and SECURITY.md have no text from before the first release", async () => {
  for (const file of ["README.md", "SECURITY.md"]) {
    const text = await read(file);
    for (const stale of ["No release exists yet", "Before the first release", "after the first release", "use no secrets"]) {
      assert.ok(!text.includes(stale), `${file}: ${stale}`);
    }
  }
});

test("README.md links the latest release, names Node 24 and lists the CHANGELOG check", async () => {
  const readme = await read("README.md");
  assert.ok(readme.includes("https://github.com/daniel-kindl/dkstack/releases/latest"));
  assert.ok(readme.includes("Node 24 or later"));
  assert.ok(readme.includes("Only the release job uses the release app secrets."));
  assert.match(readme, /CHANGELOG\.md has an entry for the version in `package\.json`/);
});

test("SECURITY.md says which release gets fixes and how they ship", async () => {
  const security = await read("SECURITY.md");
  assert.ok(security.includes("The latest release on `v1` is supported."));
  assert.ok(security.includes("A fix ships as a PATCH release on `v1`."));
});
