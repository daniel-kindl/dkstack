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

test("npm run check and the validate workflow run the map, glossary and ADR checks", () => {
  for (const name of ["maps", "context", "adrs"]) {
    assert.equal(pkg.scripts[`check:${name}`], `node scripts/check-${name}.mjs`);
    assert.match(pkg.scripts.check, new RegExp(`npm run check:${name} &&`));
    assert.match(workflow, new RegExp(`^\\s+run: npm run check:${name}\\s*$`, "m"));
  }
});

test("the validate workflow fetches the history that check-adrs compares with", () => {
  const checkout = /- name: Check out the repository\n([\s\S]*?)(?=\n\s+- name: )/.exec(workflow);
  assert.ok(checkout, "the validate workflow must have a checkout step");
  assert.match(checkout[1], /uses: actions\/checkout@[0-9a-f]{40}/);
  assert.match(checkout[1], /^\s+fetch-depth: 0$/m);
});
