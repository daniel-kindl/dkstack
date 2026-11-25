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

// Each test below fails when the matching check is removed from the script.
const EC = GOOD[".editorconfig"];
for (const [key, value] of [["root", "true"], ["charset", "utf-8"], ["end_of_line", "lf"], ["indent_style", "space"],
  ["insert_final_newline", "true"], ["trim_trailing_whitespace", "true"]]) {
  test(`.editorconfig without "${key} = ${value}" fails`, async () => {
    const text = EC.split("\n").filter((l) => !l.startsWith(`${key} =`) || l.startsWith("trim_trailing_whitespace = false")).join("\n");
    assert.notEqual(text, EC, "the fixture line");
    assert.match((await errorsOf({ ".editorconfig": text })).join("\n"), new RegExp(`missing "${key} = ${value}"`));
  });
  test(`.editorconfig with "${key}" set to another value fails`, async () => {
    const text = EC.replace(new RegExp(`^${key} = .*$`, "m"), `${key} = other`);
    assert.match((await errorsOf({ ".editorconfig": text })).join("\n"), new RegExp(`missing "${key} = ${value}"`));
  });
}

test(".editorconfig keys count only in the top or the * section", async () => {
  const text = EC.replace("[*]\n", "[*.js]\n");
  assert.match((await errorsOf({ ".editorconfig": text })).join("\n"), /missing "charset = utf-8"/);
  const upper = EC.replace("charset = utf-8", "CHARSET = UTF-8");
  assert.deepEqual(await errorsOf({ ".editorconfig": upper }), []);
  const other = EC.replace("[*.md]", "[*.txt]");
  assert.match((await errorsOf({ ".editorconfig": other })).join("\n"), /Markdown section/);
  const wrong = EC.replace("[*.md]\ntrim_trailing_whitespace = false", "[*.md]\ntrim_trailing_whitespace = true");
  assert.match((await errorsOf({ ".editorconfig": wrong })).join("\n"), /Markdown section/);
});

test("CI needs both npm ci and npm audit", async () => {
  const ci = (body) => ({ ...NPM, ".github/workflows/ci.yml": `jobs:\n  t:\n    steps:\n${body}` });
  const onlyCi = (await errorsOf(ci("      - run: npm ci\n"))).join("\n");
  assert.match(onlyCi, /no CI step runs "npm audit"/);
  assert.doesNotMatch(onlyCi, /"npm ci"/);
  const onlyAudit = (await errorsOf(ci("      - run: npm audit\n"))).join("\n");
  assert.match(onlyAudit, /no CI step runs "npm ci"/);
  assert.doesNotMatch(onlyAudit, /"npm audit"/);
  assert.match((await errorsOf(ci("      - run: npm install\n"))).join("\n"), /"npm ci"/);
  assert.match((await errorsOf(ci("      - run: npm run audit\n      - run: npm cit\n"))).join("\n"), /"npm audit"/);
});

test("CI steps are read from each workflow file, .yaml too, and comments do not count", async () => {
  const files = { ...NPM, ".github/workflows/ci.yml": "# npm ci\n", ".github/workflows/audit.yaml": "run: npm audit\n", ".github/workflows/ci2.yml": "run: npm ci\n", ".github/workflows/notes.txt": "x" };
  assert.deepEqual(await errorsOf(files), []);
  assert.match((await errorsOf({ ...NPM, ".github/workflows/ci.yml": "  # npm ci and npm audit\n" })).join("\n"), /"npm ci"/);
});

test("each dependency field needs a lockfile", async () => {
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    const files = { ...NPM, "package.json": JSON.stringify({ [field]: { a: "1" } }), "package-lock.json": undefined };
    assert.match((await errorsOf(files)).join("\n"), /no package-lock\.json/, field);
  }
  const none = { ...NPM, "package.json": JSON.stringify({ name: "x" }), "package-lock.json": undefined, ".github/workflows/ci.yml": "run: echo\n" };
  assert.deepEqual(await errorsOf(none), []);
});

test("Dependabot asks for npm with a manifest and for github-actions with workflows", async () => {
  const npmOnly = DEPENDABOT.replace(/  - package-ecosystem: "github-actions"[\s\S]*/, "");
  const actionsOnly = DEPENDABOT.replace(/  - package-ecosystem: "npm"[\s\S]*?(?=  - package-ecosystem: "github)/, "");
  const manifest = { "package.json": JSON.stringify({ name: "x" }) };
  assert.deepEqual(await errorsOf({ ...manifest, ".github/dependabot.yml": npmOnly }), []);
  assert.match((await errorsOf({ ...manifest, ".github/dependabot.yml": actionsOnly })).join("\n"), /no update entry for "npm"/);
  const flow = { ".github/workflows/ci.yml": "run: echo\n" };
  assert.deepEqual(await errorsOf({ ...flow, ".github/dependabot.yml": actionsOnly }), []);
  assert.match((await errorsOf({ ...flow, ".github/dependabot.yml": npmOnly })).join("\n"), /no update entry for "github-actions"/);
  assert.deepEqual(await errorsOf({ ".github/dependabot.yml": "broken" }), []);
});

test("Dependabot checks the weekly interval and the prefix of the npm entry too", async () => {
  const daily = (await errorsOf({ ...NPM, ".github/dependabot.yml": DEPENDABOT.replace('"weekly"', '"daily"') })).join("\n");
  assert.match(daily, /"npm" entry does not check weekly/);
  assert.doesNotMatch(daily, /"github-actions" entry/);
  const bare = (await errorsOf({ ...NPM, ".github/dependabot.yml": DEPENDABOT.replace('prefix: "build"', "") })).join("\n");
  assert.match(bare, /"npm" entry has no commit-message prefix/);
  assert.doesNotMatch(bare, /"github-actions" entry/);
  assert.match((await errorsOf({ ...NPM, ".github/dependabot.yml": DEPENDABOT.replace("interval: weekly", "interval: monthly") })).join("\n"), /"github-actions" entry does not check weekly/);
});

test("the hash check names the scripts that the list names, and no others", async () => {
  const files = { "AGENTS.md": `${URL_TAG}\n## Exceptions\n`, "scripts/dkstack-hashes.json": LIST };
  assert.deepEqual(await errorsOf({ ...files, "scripts/other.mjs": "x" }), []);
  assert.deepEqual(await errorsOf({ ...files, "scripts/check-x.mjs": SCRIPT_TEXT, "scripts/other.mjs": "x" }), []);
  assert.match((await errorsOf({ ...files, "scripts/check-x.mjs": "changed", "scripts/other.mjs": "x" })).join("\n"), /check-x\.mjs/);
});

test("the CLI reads --tag, --hashes and the root", async () => {
  const root = await makeTree({ ...GOOD, "scripts/check-x.mjs": SCRIPT_TEXT, "list.json": LIST });
  try {
    const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    assert.equal(run(root, "--hashes", join(root, "list.json"), "--tag", "v1.6.0").status, 0);
    assert.equal(run("--tag", "v1.7.0", "--hashes", join(root, "list.json"), root).status, 1);
    assert.equal(run(root, "--hashes", join(root, "list.json")).status, 1);
    assert.equal(run("--hashes").status, 2);
  } finally {
    await removeTree(root);
  }
});

test("the hash list names each script that step 4 copies and that exists at the tag", async (t) => {
  const skill = await readFile(join(repoRoot, "skills", "setup-quality-gates", "SKILL.md"), "utf8");
  const four = skill.split("\n4. ")[1].split("\n5. ")[0];
  const names = [...new Set([...four.matchAll(/`([\w-]+\.mjs)`/g)].map((m) => m[1]))];
  const list = JSON.parse(await readFile(join(repoRoot, "scripts", "dkstack-hashes.json"), "utf8"));
  for (const [tag, files] of Object.entries(list)) {
    for (const name of names) {
      let exists = true;
      try {
        execFileSync("git", ["cat-file", "-e", `${tag}:scripts/${name}`], { cwd: repoRoot, stdio: "ignore" });
      } catch {
        exists = false;
      }
      if (exists) assert.ok(name in files, `${tag} has ${name}, so the list needs it`);
      else assert.ok(!(name in files), `${tag} lacks ${name}`);
    }
  }
  assert.ok(names.includes("check-links.mjs"));
  t.diagnostic(`${names.length} names`);
});

test("the Markdown rule reads only trim_trailing_whitespace, and only for the md glob", async () => {
  const later = EC.replace("[*.md]\ntrim_trailing_whitespace = false", "[*.md]\ntrim_trailing_whitespace = false\nindent_size = 2");
  assert.deepEqual(await errorsOf({ ".editorconfig": later }), []);
  const js = EC.replace("[*.md]", "[*.{js,ts}]");
  assert.match((await errorsOf({ ".editorconfig": js })).join("\n"), /Markdown section/);
});

test("the update interval must be exactly weekly", async () => {
  const text = (await errorsOf({ ...NPM, ".github/dependabot.yml": DEPENDABOT.replace('"weekly"', "weeklyish") })).join("\n");
  assert.match(text, /"npm" entry does not check weekly/);
});

test("a read error that is not a missing file stops the check with exit 2", async () => {
  const run = async (files) => {
    const root = await makeTree(files);
    try {
      return spawnSync(process.execPath, [script, root], { encoding: "utf8" }).status;
    } finally {
      await removeTree(root);
    }
  };
  assert.equal(await run({ "AGENTS.md/x": "y" }), 2);
  assert.equal(await run({ ...GOOD, scripts: "not a folder" }), 2);
  assert.equal(await run({ ...GOOD, ".github/workflows": "not a folder" }), 2);
  assert.equal(await run({ ...GOOD, "scripts/dkstack-hashes.json/x": "y", "scripts/check-consumer.mjs": "x" }), 2);
});

test("an unknown flag is not a root", () => {
  assert.equal(spawnSync(process.execPath, [script, "--bogus", join(repoRoot, "test", "fixtures", "consumer")], { encoding: "utf8" }).status, 2);
});
