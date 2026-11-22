import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkNewAdrs, checkAdrChanges, parseDiff, adrsToRead } from "../scripts/check-adrs.mjs";
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
    assert.equal(pass.stdout, "Amendment check NOT RUN. Give the diff with --diff <file>.\n1 new ADR(s) have Status and Affects.\n");
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

const diffOf = (path, hunks) => `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n${hunks}`;
const HEAD = "# ADR 0001\n\nStatus: Accepted\n\n## Decision\n\nKeep it.\n";

async function changeErrors(content, diff) {
  const root = await makeTree({ [OLD]: content });
  try {
    return (await checkAdrChanges(root, diff)).errors;
  } finally {
    await removeTree(root);
  }
}

test("a new ADR file name must be NNNN-short-title.md", async () => {
  for (const name of ["2-x.md", "0002-Use-Messages.md", "0002_use.md", "0002-.md", "0002-a--b.md"]) {
    const path = `docs/adr/${name}`;
    const root = await makeTree({ [path]: adr("Accepted", "src/**"), "src/a.js": "" });
    try {
      assert.match((await checkNewAdrs(root, [path])).errors[0], /file name must be NNNN-short-title\.md/, name);
    } finally {
      await removeTree(root);
    }
  }
  assert.deepEqual(await newErrors(adr("Accepted", "src/**")), []);
});

test("two ADRs must not share a number", async () => {
  const errors = await newErrors(adr("Accepted", "src/**"), { "docs/adr/0002-other.md": adr("Accepted", "src/**") });
  assert.deepEqual(errors, ["docs/adr: ADRs 0002-other.md and 0002-use-messages.md share the number 0002"]);
});

test("a change to an Accepted ADR may add lines under an amendment heading", async () => {
  const content = `${HEAD}\n### Amendment 2026-01-02\n\nNew text.\n`;
  assert.deepEqual(await changeErrors(content, diffOf(OLD, "@@ -7,0 +8,4 @@\n+\n+### Amendment 2026-01-02\n+\n+New text.\n")), []);
});

test("an ADR with no Status line counts as Accepted", async () => {
  const diff = diffOf(OLD, "@@ -4,0 +5,1 @@\n+More.\n");
  assert.deepEqual(await changeErrors("# ADR 0001\n\n## Decision\n\nKeep it.\nMore.\n", diff), [
    `${OLD}:5: an added line of an Accepted ADR must be under a "### Amendment YYYY-MM-DD" heading`,
  ]);
});

test("a deeper heading inside an amendment stays in the amendment", async () => {
  const content = "# A\n\n### Amendment 2026-01-02\n\n#### Why\n\nText.\n";
  assert.deepEqual(await changeErrors(content, diffOf(OLD, "@@ -4,0 +5,3 @@\n+#### Why\n+\n+Text.\n")), []);
});

test("a removed or changed line of an Accepted ADR fails", async () => {
  const errors = await changeErrors(HEAD.replace("Keep it.", "Drop it."), diffOf(OLD, "@@ -7 +7 @@\n-Keep it.\n+Drop it.\n"));
  assert.equal(errors.length, 2);
  assert.match(errors[0], /do not remove or change the line "Keep it\."/);
});

test("a context line moves the line count in a diff with context", async () => {
  const diff = diffOf(OLD, "@@ -1,2 +1,3 @@\n # ADR 0001\n \n+Extra.\n\\ No newline at end of file\n");
  assert.deepEqual(await changeErrors("# ADR 0001\n\nExtra.\n", diff), [
    `${OLD}:3: an added line of an Accepted ADR must be under a "### Amendment YYYY-MM-DD" heading`,
  ]);
});

test("a Proposed ADR changes freely, also when the change removes lines", async () => {
  assert.deepEqual(await changeErrors("# A\n\nStatus: Proposed\n\nExtra.\n", diffOf(OLD, "@@ -4 +4 @@\n-Old.\n+Extra.\n")), []);
  const toAccepted = diffOf(OLD, "@@ -3 +3 @@\n-Status: Proposed\n+Status: Accepted\n");
  assert.deepEqual(await changeErrors("# A\n\nStatus: Accepted\n", toAccepted), []);
});

test("changing only the Status line to Superseded by NNNN passes", async () => {
  const content = "# A\n\nStatus: Superseded by 0002\n";
  assert.deepEqual(await changeErrors(content, diffOf(OLD, "@@ -3 +3 @@\n-Status: Accepted\n+Status: Superseded by 0002\n")), []);
  assert.deepEqual(await changeErrors(content, diffOf(OLD, "@@ -2,0 +3 @@\n+Status: Superseded by 0002\n")), []);
  const mixed = diffOf(OLD, "@@ -3 +3,2 @@\n-Status: Accepted\n+Status: Superseded by 0002\n+Text.\n");
  assert.equal((await changeErrors(`${content}Text.\n`, mixed)).length, 3);
});

test("deleting an ADR fails and adding one is not an amendment", async () => {
  const deleted = `diff --git a/${OLD} b/${OLD}\ndeleted file mode 100644\n--- a/${OLD}\n+++ /dev/null\n@@ -1 +0,0 @@\n-x\n`;
  assert.deepEqual(await changeErrors("", deleted), [`${OLD}:1: do not delete an Accepted ADR. Set it to "Superseded by NNNN" in place of this`]);
  const added = `diff --git a/${OLD} b/${OLD}\nnew file mode 100644\n--- /dev/null\n+++ b/${OLD}\n@@ -0,0 +1 @@\n+x\n`;
  assert.deepEqual(await changeErrors("x\n", added), []);
  assert.deepEqual(await changeErrors("x\n", diffOf("README.md", "@@ -1 +1 @@\n-a\n+b\n")), []);
  assert.deepEqual(await changeErrors("x\n", "stray line\n"), []);
});

test("the CLI reads the diff from --diff and takes the added ADRs from it", async () => {
  const { writeFile } = await import("node:fs/promises");
  const root = await makeTree({ ...TREE, [OLD]: "# A\n\nStatus: Accepted\n\nText.\n" });
  try {
    const file = join(root, "change.diff");
    await writeFile(file, diffOf(OLD, "@@ -4 +5 @@\n-Old.\n+Text.\n"));
    const fail = run(["--diff", file, root]);
    assert.equal(fail.status, 1);
    assert.match(fail.stderr, /do not remove or change the line "Old\."/);
    await writeFile(file, `diff --git a/${NEW} b/${NEW}\nnew file mode 100644\n--- /dev/null\n+++ b/${NEW}\n@@ -0,0 +1 @@\n+x\n`);
    await writeFile(join(root, NEW), adr("Accepted", "src/**"));
    const pass = run(["--diff", file, root]);
    assert.equal(pass.status, 0);
    assert.equal(pass.stdout, "1 new ADR(s) have Status and Affects.\n");
    const missing = run(["--diff", join(root, "none.diff"), root]);
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /^cannot read the diff: /);
  } finally {
    await removeTree(root);
  }
});

test("with git, an edit of an Accepted ADR fails and an amendment passes", async () => {
  const { writeFile } = await import("node:fs/promises");
  const base = "# A\n\nStatus: Accepted\n\n## Decision\n\nKeep it.\n";
  const root = await makeTree({ ...TREE, [OLD]: base });
  const git = (...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args],
    { cwd: root, encoding: "utf8" });
  try {
    git("init", "-q", "-b", "main");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("switch", "-q", "-c", "work");
    await writeFile(join(root, OLD), base.replace("Keep it.", "Drop it."));
    const fail = run(["--base", "main", root]);
    assert.equal(fail.status, 1);
    assert.match(fail.stderr, /do not remove or change the line "Keep it\."/);
    await writeFile(join(root, OLD), `${base}\n### Amendment 2026-01-02\n\nMore.\n`);
    const pass = run(["--base", "main", root]);
    assert.equal(pass.stderr, "");
    assert.equal(pass.stdout, "1 changed ADR(s) only add amendments.\nNo new ADR. Nothing to check.\n");
  } finally {
    await removeTree(root);
  }
});

const hunk = (path, body) => `diff --git a/${path} b/${path}\n${body}`;

test("review mode with --diff uses all changed files of the diff", async () => {
  const { writeFile } = await import("node:fs/promises");
  const root = await makeTree({ ...TREE, [NEW]: adr("Accepted", "src/components/**") });
  try {
    const file = join(root, "change.diff");
    await writeFile(file, diffOf("src/components/a.js", "@@ -1 +1 @@\n-a\n+b\n"));
    const result = run(["--review", "--diff", file, root]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /0002-use-messages\.md: Accepted\. Affects matches src\/components\/a\.js\./);
  } finally {
    await removeTree(root);
  }
});

test("deleting a Proposed ADR passes and deleting an Accepted one fails", async () => {
  const gone = (text) => hunk(OLD, `deleted file mode 100644\n--- a/${OLD}\n+++ /dev/null\n@@ -1,2 +0,0 @@\n${text}`);
  const root = await makeTree({ "README.md": "x\n" });
  try {
    assert.deepEqual((await checkAdrChanges(root, gone("-# A\n-Status: Proposed\n"))).errors, []);
    assert.equal((await checkAdrChanges(root, gone("-# A\n-Status: Accepted\n"))).errors.length, 1);
    assert.equal((await checkAdrChanges(root, gone("-# A\n-text\n"))).errors.length, 1);
  } finally {
    await removeTree(root);
  }
});

test("only a new ADR can fail the shared-number check", async () => {
  const old = { "docs/adr/0005-a.md": adr("Accepted", "src/**"), "docs/adr/0005-b.md": adr("Accepted", "src/**") };
  assert.deepEqual(await newErrors(adr("Accepted", "src/**"), old), []);
  const root = await makeTree({ ...TREE, ...old });
  try {
    assert.deepEqual((await checkNewAdrs(root, ["docs/adr/0005-b.md"])).errors.filter((e) => /share/.test(e)),
      ["docs/adr: ADRs 0005-a.md and 0005-b.md share the number 0005"]);
  } finally {
    await removeTree(root);
  }
});

test("a status-only change must not remove other lines", async () => {
  const diff = diffOf(OLD, "@@ -4 +3 @@\n-Keep it.\n+Status: Superseded by 0002\n");
  const errors = await changeErrors("# A\n\nStatus: Superseded by 0002\n", diff);
  assert.match(errors.join("\n"), /do not remove or change the line "Keep it\."/);
});

test("content lines that start with dashes or pluses are kept", async () => {
  const diff = diffOf(OLD, "@@ -3 +3 @@\n--- note\n+++ note\n");
  const errors = await changeErrors("# A\n\nStatus: Accepted\n\n++ note\n", diff);
  assert.match(errors.join("\n"), /do not remove or change the line "-- note"/);
});

test("the CLI says when the amendment check did not run", async () => {
  const root = await makeTree({ ...TREE });
  try {
    const result = run([root, "--", "src/other.js"]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Amendment check NOT RUN\. Give the diff with --diff <file>\./);
  } finally {
    await removeTree(root);
  }
});

test("with git, renaming an Accepted ADR fails", async () => {
  const root = await makeTree({ ...TREE, [OLD]: "# A\n\nStatus: Accepted\n\nKeep it.\n" });
  const git = (...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args],
    { cwd: root, encoding: "utf8" });
  try {
    git("init", "-q", "-b", "main");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("switch", "-q", "-c", "work");
    git("mv", OLD, "docs/adr/0001-new-name.md");
    const fail = run(["--base", "main", root]);
    assert.equal(fail.status, 1);
    assert.match(fail.stderr, /do not delete an Accepted ADR/);
  } finally {
    await removeTree(root);
  }
});

test("a blank context line without its space does not hide the next file", async () => {
  const other = "docs/adr/0003-other.md";
  const diff = `${diffOf(OLD, "@@ -1,2 +1,3 @@\n # A\n\n+Extra.\n")}${diffOf(other, "@@ -1 +1,2 @@\n x\n+y\n")}`;
  const entries = parseDiff(diff);
  assert.deepEqual(entries.map((e) => e.path), [OLD, other]);
  assert.deepEqual(entries[0].added, [{ line: 3, text: "Extra." }]);
});

test("a diff header starts a new file even inside an unfinished hunk", async () => {
  const diff = `${diffOf(OLD, "@@ -1,5 +1,5 @@\n x\n")}${diffOf("docs/adr/0003-other.md", "@@ -1 +1 @@\n-a\n+b\n")}`;
  const entries = parseDiff(diff);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[1].removed, ["a"]);
  assert.deepEqual(entries[1].added, [{ line: 1, text: "b" }]);
});

test("with git, a renamed ADR with a bad name is still a new ADR", async () => {
  const root = await makeTree({ ...TREE, [OLD]: "# A\n\nStatus: Proposed\n\nKeep it.\n" });
  const git = (...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args],
    { cwd: root, encoding: "utf8" });
  try {
    git("init", "-q", "-b", "main");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    git("switch", "-q", "-c", "work");
    git("mv", OLD, "docs/adr/0001-Bad_Name.md");
    const fail = run(["--base", "main", root]);
    assert.match(fail.stderr, /file name must be NNNN-short-title\.md/);
  } finally {
    await removeTree(root);
  }
});
