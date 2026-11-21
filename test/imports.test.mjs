import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// FRG-8 in #154: a script must not throw or run its main code when another
// program imports it. "node -e" has no script path in process.argv[1].

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const scripts = (await readdir(join(repoRoot, "scripts"))).filter((f) => f.endsWith(".mjs")).sort();

for (const script of scripts) {
  test(`scripts/${script} can be imported from node -e`, () => {
    const r = spawnSync(process.execPath, ["-e", `import("./scripts/${script}").then(() => console.log("ok"))`],
      { cwd: repoRoot, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, "ok\n");
  });
}

// L1 on #218: a test that reads a repository file with fs.readFile fails on
// a CRLF checkout when it splits on "\n". Each test uses the helper.
test("each test reads files through the readFile helper in test/helpers.mjs", async () => {
  const { readFile } = await import("./helpers.mjs");
  const tests = (await readdir(join(repoRoot, "test"))).filter((f) => f.endsWith(".test.mjs"));
  for (const file of tests) {
    const text = await readFile(join(repoRoot, "test", file), "utf8");
    assert.doesNotMatch(text, /import \{[^}]*\breadFile\b[^}]*\} from "node:fs(?:\/promises)?"/, file);
  }
});
