import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkConsumer, printHashes, sha256 } from "../scripts/check-consumer.mjs";
import { makeTree, removeTree, readFile } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-consumer.mjs");
const URL_V1 = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md";

const GOOD = {
  "AGENTS.md": `# AGENTS.md\n\n> Read and follow ${URL_V1}\n\n## Exceptions\n\nNone.\n`,
  "CLAUDE.md": "@AGENTS.md\n",
  ".gitattributes": "* text=auto eol=lf\n",
  ".editorconfig": `root = true\n\n[*]\ncharset = utf-8\nend_of_line = lf\nindent_style = space\ninsert_final_newline = true\ntrim_trailing_whitespace = true\n\n[*.md]\ntrim_trailing_whitespace = false\n`,
};
const DEPENDABOT = `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "build"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: weekly
    commit-message:
      prefix: "ci"
`;
const NPM = {
  "package.json": JSON.stringify({ dependencies: { a: "1.0.0" } }),
  "package-lock.json": "{}",
  ".github/workflows/ci.yml": "jobs:\n  t:\n    steps:\n      - run: npm ci\n      - run: npm audit --audit-level=high\n",
  ".github/dependabot.yml": DEPENDABOT,
};

async function errorsOf(files, options) {
  const root = await makeTree(Object.fromEntries(Object.entries({ ...GOOD, ...files }).filter(([, v]) => v !== undefined)));
  try {
    return await checkConsumer(root, options);
  } finally {
    await removeTree(root);
  }
}
async function errorsWithout(name, extra = {}) {
  const files = { ...GOOD, ...extra };
  delete files[name];
  const root = await makeTree(files);
  try {
    return await checkConsumer(root);
  } finally {
    await removeTree(root);
  }
}

test("a repository with the full setup passes", async () => {
  assert.deepEqual(await errorsOf({}), []);
  assert.deepEqual(await errorsOf(NPM), []);
});

test("AGENTS.md needs a dkstack URL on v1 or on a tag, and an Exceptions section", async () => {
  assert.deepEqual(await errorsOf({ "AGENTS.md": `${URL_V1.replace("/v1/", "/v1.6.0/")}\n## Exceptions\n` }), []);
  const main = await errorsOf({ "AGENTS.md": `${URL_V1.replace("/v1/", "/main/")}\n## Exceptions\n` });
  assert.match(main.join("\n"), /no dkstack URL/);
  const none = await errorsOf({ "AGENTS.md": `${URL_V1}\n## Project facts\n` });
  assert.match(none.join("\n"), /no "## Exceptions" section/);
  assert.match((await errorsWithout("AGENTS.md")).join("\n"), /AGENTS\.md: the file is missing/);
});

test("CLAUDE.md is optional, and it needs the @AGENTS.md line", async () => {
  assert.deepEqual(await errorsWithout("CLAUDE.md"), []);
  assert.match((await errorsOf({ "CLAUDE.md": "Read AGENTS.md\n" })).join("\n"), /CLAUDE\.md: the file has no @AGENTS\.md line/);
});

test(".editorconfig needs each key and the Markdown exception", async () => {
  assert.match((await errorsWithout(".editorconfig")).join("\n"), /\.editorconfig: the file is missing/);
  const weak = GOOD[".editorconfig"].replace("end_of_line = lf", "end_of_line = crlf").replace("[*.md]\ntrim_trailing_whitespace = false\n", "");
  const text = (await errorsOf({ ".editorconfig": weak })).join("\n");
  assert.match(text, /missing "end_of_line = lf"/);
  assert.match(text, /Markdown section/);
  assert.deepEqual(await errorsOf({ ".editorconfig": GOOD[".editorconfig"].replace("[*.md]", "[*.{md,txt}]") }), []);
});

test(".gitattributes needs the LF line", async () => {
  assert.match((await errorsWithout(".gitattributes")).join("\n"), /\.gitattributes: no line/);
  assert.match((await errorsOf({ ".gitattributes": "* text=auto\n" })).join("\n"), /\.gitattributes/);
});

test("a manifest with dependencies needs a lockfile, npm ci and npm audit", async () => {
  const bare = { "package.json": NPM["package.json"], ".github/dependabot.yml": DEPENDABOT, ".github/workflows/ci.yml": "# npm ci\n# npm audit\n" };
  const text = (await errorsOf(bare)).join("\n");
  assert.match(text, /no package-lock\.json/);
  assert.match(text, /no CI step runs "npm ci"/);
  assert.match(text, /no CI step runs "npm audit"/);
  const noWorkflow = (await errorsOf({ ...NPM, ".github/workflows/ci.yml": undefined, ".github/dependabot.yml": DEPENDABOT.replace(/  - package-ecosystem: "github-actions"[\s\S]*/, "") }));
  assert.match(noWorkflow.join("\n"), /npm ci/);
});

test("a manifest without dependencies needs no lockfile or CI step", async () => {
  const text = (await errorsOf({ "package.json": JSON.stringify({ name: "x", devDependencies: {} }), ".github/dependabot.yml": DEPENDABOT.replace(/  - package-ecosystem: "github-actions"[\s\S]*/, "").replace("npm", "npm") })).join("\n");
  assert.doesNotMatch(text, /lockfile|package-lock|npm ci/);
  assert.match((await errorsOf({ "package.json": "{" })).join("\n"), /not valid JSON/);
});

test("a shrinkwrap file counts as a lockfile", async () => {
  const files = { ...NPM, "package-lock.json": undefined, "npm-shrinkwrap.json": "{}" };
  assert.deepEqual(await errorsOf(files), []);
});

test("Dependabot covers each ecosystem weekly with a commit prefix", async () => {
  assert.match((await errorsOf({ ...NPM, ".github/dependabot.yml": undefined })).join("\n"), /dependabot\.yml: the file is missing/);
  const monthly = DEPENDABOT.replace('interval: "weekly"', 'interval: "monthly"').replace('prefix: "ci"', "");
  const text = (await errorsOf({ ...NPM, ".github/dependabot.yml": monthly })).join("\n");
  assert.match(text, /"npm" entry does not check weekly/);
  assert.match(text, /"github-actions" entry has no commit-message prefix/);
  const noActions = DEPENDABOT.replace(/  - package-ecosystem: "github-actions"[\s\S]*/, "");
  assert.match((await errorsOf({ ...NPM, ".github/dependabot.yml": noActions })).join("\n"), /no update entry for "github-actions"/);
  assert.deepEqual(await errorsOf({ ...NPM, ".github/dependabot.yml": undefined, ".github/dependabot.yaml": DEPENDABOT }), []);
});

const SCRIPT_TEXT = "export const a = 1;\n";
const LIST = JSON.stringify({ "v1.6.0": { "check-x.mjs": sha256(SCRIPT_TEXT) }, "v1.7.0": { "check-x.mjs": "0".repeat(64) } });
const URL_TAG = URL_V1.replace("/v1/", "/v1.6.0/");

test("a copied script that matches the hash list for its tag passes", async () => {
  const files = { "AGENTS.md": `${URL_TAG}\n## Exceptions\n`, "scripts/check-x.mjs": SCRIPT_TEXT, "scripts/dkstack-hashes.json": LIST, "scripts/own.mjs": "x" };
  assert.deepEqual(await errorsOf(files), []);
  assert.deepEqual(await errorsOf({ ...files, "scripts/check-x.mjs": SCRIPT_TEXT.replace("\n", "\r\n") }), []);
});

test("a changed copied script fails the hash check", async () => {
  const files = { "AGENTS.md": `${URL_TAG}\n## Exceptions\n`, "scripts/check-x.mjs": `${SCRIPT_TEXT}// edit\n`, "scripts/dkstack-hashes.json": LIST };
  assert.match((await errorsOf(files)).join("\n"), /scripts\/check-x\.mjs: the hash does not match the tag v1\.6\.0/);
});

test("the tag comes from --tag when AGENTS.md pins no tag", async () => {
  const files = { "scripts/check-x.mjs": SCRIPT_TEXT, "scripts/dkstack-hashes.json": LIST };
  assert.match((await errorsOf(files)).join("\n"), /no tag/);
  assert.deepEqual(await errorsOf(files, { tag: "v1.6.0" }), []);
  assert.match((await errorsOf(files, { tag: "v1.7.0" })).join("\n"), /does not match the tag v1\.7\.0/);
  assert.match((await errorsOf(files, { tag: "v9.9.9" })).join("\n"), /no entry for the tag v9\.9\.9/);
});

test("a script that the tag does not have fails", async () => {
  const list = JSON.stringify({ "v1.6.0": { "check-x.mjs": "a" }, "v1.7.0": { "check-y.mjs": "b" } });
  const files = { "scripts/check-y.mjs": "y", "scripts/dkstack-hashes.json": list };
  assert.match((await errorsOf(files, { tag: "v1.6.0" })).join("\n"), /the tag v1\.6\.0 has no such script/);
});

test("the hash list is missing, invalid or not about the scripts", async () => {
  assert.match((await errorsOf({ "scripts/check-consumer.mjs": "x" })).join("\n"), /hash list is missing/);
  assert.deepEqual(await errorsOf({ "scripts/own.mjs": "x" }), []);
  assert.match((await errorsOf({ "scripts/dkstack-hashes.json": "{" })).join("\n"), /not valid JSON/);
  assert.deepEqual(await errorsOf({ "scripts/own.mjs": "x", "scripts/dkstack-hashes.json": LIST }), []);
});

test("--hashes reads the list from another path", async () => {
  const root = await makeTree({ ...GOOD, "AGENTS.md": `${URL_TAG}\n## Exceptions\n`, "scripts/check-x.mjs": SCRIPT_TEXT, "elsewhere/list.json": LIST });
  try {
    assert.deepEqual(await checkConsumer(root, { hashes: join(root, "elsewhere", "list.json") }), []);
  } finally {
    await removeTree(root);
  }
});

test("printHashes prints one hash for each .mjs file", async () => {
  const root = await makeTree({ "b.mjs": SCRIPT_TEXT, "a.mjs": "x", "note.txt": "y" });
  try {
    assert.deepEqual(JSON.parse(await printHashes(root)), { "a.mjs": sha256("x"), "b.mjs": sha256(SCRIPT_TEXT) });
  } finally {
    await removeTree(root);
  }
});

test("the command line exits 0, 1 and 2", async () => {
  const root = await makeTree(GOOD);
  try {
    const ok = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /correct dkstack consumer/);
    const bad = await makeTree({ "AGENTS.md": "x" });
    try {
      const fail = spawnSync(process.execPath, [script, bad], { encoding: "utf8" });
      assert.equal(fail.status, 1);
      assert.match(fail.stderr, /AGENTS\.md/);
    } finally {
      await removeTree(bad);
    }
    for (const args of [["--bogus"], ["--tag"], [join(root, "AGENTS.md", "x"), join(root, ".editorconfig")]]) {
      const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
      assert.equal(result.status, 2, args.join(" "));
    }
    const printed = spawnSync(process.execPath, [script, "--print-hashes", join(repoRoot, "scripts")], { encoding: "utf8" });
    assert.equal(printed.status, 0);
    assert.ok(JSON.parse(printed.stdout)["check-consumer.mjs"]);
  } finally {
    await removeTree(root);
  }
});

test("the fixture folder is a correct consumer", () => {
  const result = spawnSync(process.execPath, [script, join(repoRoot, "test", "fixtures", "consumer")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("the hash list for v1.6.0 matches the scripts of that tag", async (t) => {
  const list = JSON.parse(await readFile(join(repoRoot, "scripts", "dkstack-hashes.json"), "utf8"));
  for (const [tag, files] of Object.entries(list)) {
    for (const [name, hash] of Object.entries(files)) {
      let text;
      try {
        text = execFileSync("git", ["show", `${tag}:scripts/${name}`], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      } catch {
        t.skip(`the tag ${tag} is not in this clone`);
        return;
      }
      assert.equal(sha256(text), hash, `${tag} ${name}`);
    }
  }
});

test("check-consumer imports only Node modules", async () => {
  const text = await readFile(script, "utf8");
  for (const [, from] of text.matchAll(/^import .* from "([^"]+)";/gm)) assert.ok(from.startsWith("node:"), from);
});

test("setup-quality-gates step 4 copies check-consumer and the hash list", async () => {
  const skill = await readFile(join(repoRoot, "skills", "setup-quality-gates", "SKILL.md"), "utf8");
  const four = skill.split("\n4. ")[1].split("\n5. ")[0].replace(/\s+/g, " ");
  for (const name of ["check-consumer.mjs", "dkstack-hashes.json"]) assert.ok(four.includes(`\`${name}\``), name);
  assert.ok(four.includes("node scripts/check-consumer.mjs"));
});
