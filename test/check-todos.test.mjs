import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkTodos } from "../scripts/check-todos.mjs";
import { makeTree, removeTree, readFile } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-todos.mjs");

async function todosFor(files) {
  const root = await makeTree(files);
  try {
    return await checkTodos(root);
  } finally {
    await removeTree(root);
  }
}

test("each TODO in scripts and test has an issue reference", async () => {
  const result = await checkTodos(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.ok(result.checked > 0, "the check must find files in scripts and test");
});

test("a TODO with no issue reference fails with file and line", async () => {
  const result = await todosFor({
    "scripts/a.mjs": "// ok\n// TODO: fix this later\n",
    "test/b.test.mjs": "// TODO fix\n",
  });
  assert.equal(result.checked, 2);
  assert.deepEqual(result.errors, [
    "scripts/a.mjs:2: TODO has no issue reference. Add #NNN",
    "test/b.test.mjs:1: TODO has no issue reference. Add #NNN",
  ]);
});

test("a TODO with an issue reference passes", async () => {
  const result = await todosFor({
    "scripts/a.mjs": "// TODO(#12): fix\n// TODO: fix, see #345\n",
  });
  assert.deepEqual(result.errors, []);
});

test("a word that only contains TODO, and a TODO outside scripts and test, pass", async () => {
  const result = await todosFor({
    "scripts/a.mjs": "const TODOS = 1; // TODOLIST\n",
    "docs/a.md": "TODO: later\n",
    "scripts/check-todos.mjs": "// TODO\n",
    "test/check-todos.test.mjs": "// TODO\n",
  });
  assert.deepEqual(result.errors, []);
});

test("a missing scripts or test folder passes", async () => {
  const result = await todosFor({ "README.md": "x\n" });
  assert.equal(result.checked, 0);
  assert.deepEqual(result.errors, []);
});

test("the CLI exits 1 for a bare TODO and 0 for a clean tree", async () => {
  const bad = await makeTree({ "scripts/a.mjs": "// TODO\n" });
  const good = await makeTree({ "scripts/a.mjs": "// TODO #1\n" });
  try {
    const failRun = spawnSync(process.execPath, [script, bad], { encoding: "utf8" });
    assert.equal(failRun.status, 1);
    assert.equal(failRun.stderr, "scripts/a.mjs:1: TODO has no issue reference. Add #NNN\n");
    const passRun = spawnSync(process.execPath, [script, good], { encoding: "utf8" });
    assert.equal(passRun.status, 0);
    assert.match(passRun.stdout, /1 file\(s\)/);
  } finally {
    await removeTree(bad);
    await removeTree(good);
  }
});

test("npm run check and the validate workflow run the TODO check", async () => {
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts["check:todos"], "node scripts/check-todos.mjs");
  assert.ok(pkg.scripts.check.split(" && ").includes("npm run check:todos"));
  const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");
  assert.match(workflow, /^\s+run: npm run check:todos\s*$/m);
});
