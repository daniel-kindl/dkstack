import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkNewAdrs, adrsToRead } from "../scripts/check-adrs.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-adrs.mjs");
const NEW = "docs/adr/0002-use-messages.md";
const OLD = "docs/adr/0001-old-decision.md";

const adr = (status, affects) => `# ADR 0002: Use messages

${status === null ? "" : `Status: ${status}\n`}${affects === null ? "" : `Affects: ${affects}\n`}
## Context

Components must stay independent.

## Decision

Use messages between components.
`;

const TREE = {
  [OLD]: "# ADR 0001: Old decision\n\n## Decision\n\nKeep it.\n",
  "src/components/a.js": "export {};\n",
  "src/other.js": "export {};\n",
};

async function newErrors(content, extra = {}) {
  const root = await makeTree({ ...TREE, [NEW]: content, ...extra });
  try {
    return (await checkNewAdrs(root, [NEW])).errors;
  } finally {
    await removeTree(root);
  }
}

const run = (args, cwd) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd });

test("a new ADR with a known Status and matching Affects passes", async () => {
  assert.deepEqual(await newErrors(adr("Accepted", "src/components/**, `src/other.js`")), []);
  assert.deepEqual(await newErrors(adr("Proposed", "src/components")), []);
  assert.deepEqual(await newErrors(`# ADR 0002\n\n- Status: Accepted\n- Affects: src/*.js\n`), []);
});

test("an old ADR without the new lines never fails", async () => {
  const root = await makeTree({ ...TREE, [NEW]: adr("Accepted", "src/**") });
  try {
    assert.deepEqual((await checkNewAdrs(root, [NEW, "src/other.js"])).errors, []);
    assert.equal((await checkNewAdrs(root, [NEW, "src/other.js"])).checked, 1);
  } finally {
    await removeTree(root);
  }
});

test("a new ADR must have a Status line", async () => {
  assert.deepEqual(await newErrors(adr(null, "src/**")), [`${NEW}:1: a new ADR must have a "Status:" line`]);
});

test("a new ADR must have a known Status value", async () => {
  assert.deepEqual(await newErrors(adr("Done", "src/**")), [
    `${NEW}:3: unknown Status "Done". Use Proposed, Accepted or Superseded by NNNN`,
  ]);
});

test("a Superseded by target must exist", async () => {
  assert.deepEqual(await newErrors(adr("Superseded by 0009", "src/**")), [
    `${NEW}:3: Status names ADR 0009, which does not exist`,
  ]);
  assert.deepEqual(await newErrors(adr("Superseded by 0001", "src/**")), []);
});

test("a new ADR must have an Affects line with a value", async () => {
  assert.deepEqual(await newErrors(adr("Accepted", null)), [`${NEW}:1: a new ADR must have an "Affects:" line`]);
  assert.deepEqual(await newErrors(adr("Accepted", "")), [`${NEW}:4: "Affects:" is empty`]);
});

test("each Affects glob matches at least one file", async () => {
  assert.deepEqual(await newErrors(adr("Accepted", "src/**, lib/**")), [
    `${NEW}:4: the Affects glob "lib/**" matches no file`,
  ]);
});

test("review mode lists the Accepted ADRs that match and the old ADRs with no Affects", async () => {
  const root = await makeTree({
    ...TREE,
    [NEW]: adr("Accepted", "src/components/**"),
    "docs/adr/0003-proposed.md": adr("Proposed", "src/**"),
    "docs/adr/0004-replaced.md": adr("Superseded by 0002", "src/**"),
    "docs/adr/0005-elsewhere.md": adr("Accepted", "src/other.js"),
  });
  try {
    assert.deepEqual(await adrsToRead(root, ["src/components/a.js"]), [
      `${OLD}: no Affects line. Read the title and the Decision section.`,
      `${NEW}: Accepted. Affects matches src/components/a.js.`,
    ]);
  } finally {
    await removeTree(root);
  }
});

test("a missing docs/adr folder is a pass in both modes", async () => {
  const root = await makeTree({ "README.md": "# x\n" });
  try {
    assert.deepEqual(await checkNewAdrs(root, ["docs/adr/0001-x.md"]), { checked: 0, errors: [] });
    assert.deepEqual(await adrsToRead(root, ["README.md"]), []);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 0 for a good ADR, 1 for findings and 2 for a usage error", async () => {
  const good = await makeTree({ ...TREE, [NEW]: adr("Accepted", "src/**") });
  const bad = await makeTree({ ...TREE, [NEW]: adr("Done", "src/**") });
  try {
    const pass = run([good, "--", NEW]);
    assert.equal(pass.stderr, "");
    assert.equal(pass.status, 0);
    assert.equal(pass.stdout, "1 new ADR(s) have Status and Affects.\n");
    const fail = run([bad, "--", NEW]);
    assert.equal(fail.status, 1);
    assert.equal(fail.stderr, `${NEW}:3: unknown Status "Done". Use Proposed, Accepted or Superseded by NNNN\n`);
    const usage = run(["--bad-flag"]);
    assert.equal(usage.status, 2);
    assert.match(usage.stderr, /^usage: /);
  } finally {
    await removeTree(good);
    await removeTree(bad);
  }
});

test("the review CLI always exits 0, also when it finds ADRs", async () => {
  const root = await makeTree({ ...TREE, [NEW]: adr("Done", "src/**") });
  try {
    const result = run(["--review", root, "--", "src/other.js"]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, `${OLD}: no Affects line. Read the title and the Decision section.\n`);
  } finally {
    await removeTree(root);
  }
});

test("with no file list, the CLI checks the ADRs added since the base ref", async () => {
  const root = await makeTree({ ...TREE });
  const git = (...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args],
    { cwd: root, encoding: "utf8" });
  try {
    git("init", "-q", "-b", "main");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("switch", "-q", "-c", "work");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(join(root, NEW), adr("Done", "src/**"));
    git("add", ".");
    git("commit", "-q", "-m", "add an ADR");
    const fail = run(["--base", "main", root]);
    assert.equal(fail.status, 1);
    assert.equal(fail.stderr, `${NEW}:3: unknown Status "Done". Use Proposed, Accepted or Superseded by NNNN\n`);
    const badRef = run(["--base", "no-such-ref", root]);
    assert.equal(badRef.status, 2);
    assert.match(badRef.stderr, /^cannot list the changed files: /);
  } finally {
    await removeTree(root);
  }
});
