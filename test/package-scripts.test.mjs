import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");

test("npm run check runs the CHANGELOG check", () => {
  assert.equal(pkg.scripts["check:changelog"], "node scripts/check-changelog.mjs");
  assert.match(pkg.scripts.check, /npm run check:changelog &&/);
});

test("the validate workflow runs the CHANGELOG check", () => {
  assert.match(workflow, /^\s+run: npm run check:changelog\s*$/m);
});

test("no script only prints text", () => {
  for (const [name, command] of Object.entries(pkg.scripts)) {
    assert.doesNotMatch(command, /^\s*echo\b/, `script "${name}" only prints text`);
  }
});
