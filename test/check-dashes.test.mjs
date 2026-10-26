import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkDashes } from "../scripts/check-dashes.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-dashes.mjs");
const EM = "\u2014";
const EN = "\u2013";

async function dashesFor(files) {
  const root = await makeTree(files);
  try {
    return await checkDashes(root);
  } finally {
    await removeTree(root);
  }
}

test("no Markdown file in the repository has an em dash or an en dash", async () => {
  const result = await checkDashes(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.ok(result.checked > 0, "the check must find Markdown files in the repository");
});

test("each em dash and en dash is reported with file, line and column", async () => {
  const result = await dashesFor({
    "README.md": `# Title\n\nOne ${EM} two.\nPages 1${EN}3 and 4${EN}5.\n`,
    "docs/a.md": `ok\n`,
  });
  assert.equal(result.checked, 2);
  assert.deepEqual(result.errors, [
    "README.md:3:5: em dash (U+2014)",
    "README.md:4:8: en dash (U+2013)",
    "README.md:4:16: en dash (U+2013)",
  ]);
});

test("dashes in code blocks also fail, and the hyphen and minus forms pass", async () => {
  const result = await dashesFor({
    "a.md": "```\nx " + EM + " y\n```\n`" + EN + "`\nuse-a-hyphen - and --\n",
  });
  assert.deepEqual(result.errors, ["a.md:2:3: em dash (U+2014)", "a.md:4:2: en dash (U+2013)"]);
});

test("only Markdown files are checked, and node_modules and .git are skipped", async () => {
  const result = await dashesFor({
    "notes.txt": EM,
    "script.mjs": `// ${EM}\n`,
    "node_modules/pkg/README.md": EM,
    ".git/x.md": EM,
    "ok.md": "fine\n",
  });
  assert.equal(result.checked, 1);
  assert.deepEqual(result.errors, []);
});

test("the CLI exits 1 for a dash and 0 for a clean tree", async () => {
  const bad = await makeTree({ "README.md": `a ${EM} b\n` });
  const good = await makeTree({ "README.md": "a, b\n" });
  try {
    const failRun = spawnSync(process.execPath, [script, bad], { encoding: "utf8" });
    assert.equal(failRun.status, 1);
    assert.equal(failRun.stderr, "README.md:1:3: em dash (U+2014)\n");
    const passRun = spawnSync(process.execPath, [script, good], { encoding: "utf8" });
    assert.equal(passRun.stderr, "");
    assert.equal(passRun.status, 0);
    assert.equal(passRun.stdout, "1 Markdown file(s) have no em dash or en dash.\n");
  } finally {
    await removeTree(bad);
    await removeTree(good);
  }
});
