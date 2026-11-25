import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, sectionText } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

// Return the lines of a JavaScript source that declare a variable with `var`.
function varLines(source) {
  return source.split("\n").filter((line) => /^\s*(export\s+)?var\s/.test(line) || /^\s*for\s*\(\s*var\s/.test(line));
}

test("coding/types.md forbids a type or a comment that turns off the type check", async () => {
  const section = sectionText(await text("coding/types.md"), "## No escape from the type system");
  for (const part of [
    "`any`",
    "`as any`",
    "`dynamic`",
    "`Any`",
    "`interface{}`",
    "`@ts-ignore`",
    // Split so that check-suppressions does not read the test as a suppression.
    "`# type" + ": ignore`",
    "quality-gates.md#suppressions",
    "`unknown`",
    "`object`",
    "at the boundary",
    "cast",
    "non-null assertion",
  ]) {
    assert.ok(section.includes(part), `missing ${part}`);
  }
});

test("coding/types.md requires explicit types and names the language exceptions", async () => {
  const section = sectionText(await text("coding/types.md"), "## Explicit types");
  for (const part of [
    "public signature",
    "local variable",
    "anonymous type",
    "lambda",
    "closure",
    "Record the exception",
    "`var`",
    "`const`",
    "`let`",
  ]) {
    assert.ok(section.includes(part), `missing ${part}`);
  }
});

test("coding/types.md names the native checks and the CI gate", async () => {
  const section = sectionText(await text("coding/types.md"), "## Enforcement");
  for (const part of [
    '"strict": true',
    "@typescript-eslint/no-explicit-any",
    "@typescript-eslint/ban-ts-comment",
    "<Nullable>enable</Nullable>",
    "IDE0008",
    "EnforceCodeStyleInBuild",
    "disallow_any_explicit",
    "ANN401",
    "no-var",
    "in CI as an error",
  ]) {
    assert.ok(section.includes(part), `missing ${part}`);
  }
});

test("coding/types.md has a good and a bad example", async () => {
  const page = await text("coding/types.md");
  assert.ok(page.includes("## Good example"), "missing good example");
  assert.ok(page.includes("## Bad example"), "missing bad example");
});

test("the type rule is linked from the coding index, the review smells and the gate setup", async () => {
  assert.ok((await text("coding/index.md")).includes("(types.md)"), "coding/index.md does not list types.md");
  const smells = await text("skills/review-standards/SKILL.md");
  const row = smells.split("\n").find((line) => line.startsWith("| Type escape"));
  assert.ok(row, "missing smell row");
  assert.ok(row.includes("v1/coding/types.md"), "row must link the rule");
  const gates = sectionText(await text("skills/setup-quality-gates/SKILL.md"), "## Steps");
  assert.ok(gates.includes("v1/coding/types.md"), "setup-quality-gates does not link the rule");
});

test("CONTRIBUTING.md records the dkstack exception to the type check", async () => {
  const section = sectionText(await text("CONTRIBUTING.md"), "## Exceptions");
  for (const part of ["coding/types.md", "plain JavaScript", "`typescript`", "no npm dependencies"]) {
    assert.ok(section.includes(part), `missing ${part}`);
  }
});

test("varLines finds a var declaration and ignores other text", () => {
  assert.deepEqual(varLines("var a = 1;\n  var b;\nexport var c = 2;"), ["var a = 1;", "  var b;", "export var c = 2;"]);
  assert.deepEqual(varLines("for (var i = 0; i < 2; i++) {}"), ["for (var i = 0; i < 2; i++) {}"]);
  assert.deepEqual(varLines("const variable = 1;\n// var in a comment\nlet x = 'var y';"), []);
});

test("no script or test declares a variable with var", async () => {
  for (const dir of ["scripts", "test"]) {
    for (const name of await readdir(join(root, dir))) {
      if (!name.endsWith(".mjs")) continue;
      assert.deepEqual(varLines(await text(`${dir}/${name}`)), [], `${dir}/${name} uses var`);
    }
  }
});
