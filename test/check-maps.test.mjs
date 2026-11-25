import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkMaps, checkMapsDiff } from "../scripts/check-maps.mjs";
import { writeFile, rm } from "node:fs/promises";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-maps.mjs");
const MAP = "docs/maps/export.md";

const OPEN = `# Map: CSV export

Status: open
Destination: A person can export the library as one CSV file.
Next: Q3

## Notes

- The library has no export today. Source: src/library.js:12

## Decisions

- Q1 File format: CSV with a header row. Decided by: Daniel Kindl, 2026-11-19. Record: [ADR 0002](../adr/0002-csv.md).
- Q2 Name: "export". Decided by: Daniel Kindl, 2026-11-20. Record: this line.

## Open questions

### Q3: Which fields go in the file?

Type: owner
Blocked by: Q1

Pick the fields of a book that the file has.

### Q4: How large can a library be?

Type: research
Blocked by: none

Find the largest library in the test data.

## Not yet clear

- How a person opens the file on a phone.

## Out of scope

- Import. Reason: a second feature.

## Prototypes

None yet.

## Hand-off

None yet.
`;

const DONE = OPEN
  .replace("Status: open", "Status: done")
  .replace("Next: Q3", "Next: none")
  .replace(/## Open questions\n[\s\S]*?(?=## Not yet clear)/, "## Open questions\n\n")
  .replace("- How a person opens the file on a phone.\n", "")
  .replace("## Hand-off\n\nNone yet.", "## Hand-off\n\n- Plan: [plan](https://example.com/issues/40)\n- Issues: #41, #42");

const ADR = { "docs/adr/0002-csv.md": "# ADR 0002: CSV\n" };

async function errorsFor(map, extra = ADR) {
  const root = await makeTree({ [MAP]: map, ...extra });
  try {
    return (await checkMaps(root)).errors;
  } finally {
    await removeTree(root);
  }
}

const run = (args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

test("this repository passes", async () => {
  assert.deepEqual((await checkMaps(repoRoot)).errors, []);
});

test("an open map and a done map in the template format pass", async () => {
  assert.deepEqual(await errorsFor(OPEN), []);
  assert.deepEqual(await errorsFor(DONE), []);
});

test("a missing docs/maps folder is a pass", async () => {
  const root = await makeTree({ "README.md": "# x\n" });
  try {
    assert.deepEqual(await checkMaps(root), { checked: 0, errors: [] });
  } finally {
    await removeTree(root);
  }
});

test("the first line must be the map title", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("# Map: CSV export", "# CSV export")), [
    `${MAP}:1: the first line must be "# Map: <name>"`,
  ]);
});

test("headings must be the template headings in template order", async () => {
  const notes = /## Notes\n[\s\S]*?(?=## Decisions)/.exec(OPEN)[0];
  const swapped = OPEN.replace(notes, "").replace("## Open questions", `${notes}## Open questions`);
  assert.deepEqual(await errorsFor(swapped), [
    `${MAP}:12: the heading "## Notes" is out of template order`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("## Prototypes\n\nNone yet.\n\n", "")), [
    `${MAP}:1: missing heading "## Prototypes"`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("## Out of scope", "## Risks")), [
    `${MAP}:36: unknown heading "## Risks"`,
    `${MAP}:1: missing heading "## Out of scope"`,
  ]);
});

test("Status must be open or done", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("Status: open", "Status: ready")), [
    `${MAP}:3: Status must be "open" or "done"`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("Status: open\n", "")), [
    `${MAP}:1: missing "Status:" line`,
  ]);
});

test("Destination and Next must have a value", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace(/^Destination: .*$/m, "Destination:")), [
    `${MAP}:4: "Destination:" is empty`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("Next: Q3\n", "")), [`${MAP}:1: missing "Next:" line`]);
});

test("an open question heading has a Q id and a title", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("### Q4: How large", "### How large")), [
    `${MAP}:25: an open question heading must be "### Q<n>: <title>"`,
  ]);
});

test("a Q id is used once", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("### Q4:", "### Q2:")), [
    `${MAP}:25: Q2 is already used on line 14`,
  ]);
});

test("an open question has a Type from the list", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("Type: research", "Type: spike")), [
    `${MAP}:27: Q4 has an unknown Type "spike". Use owner, research, prototype or task`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("Type: research\n", "")), [`${MAP}:25: Q4 has no "Type:" line`]);
});

test("Blocked by names questions in the same file", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("Blocked by: Q1", "Blocked by: Q9")), [
    `${MAP}:21: Q3 is blocked by Q9, which is not in this file`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("Blocked by: Q1", "Blocked by: soon")), [
    `${MAP}:21: Q3 "Blocked by:" must be none or a list of Q<n>`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("Blocked by: Q1\n", "")), [
    `${MAP}:18: Q3 has no "Blocked by:" line`,
  ]);
});

test("Blocked by has no cycle", async () => {
  const cycle = OPEN.replace("Blocked by: Q1", "Blocked by: Q1, Q4").replace("Blocked by: none", "Blocked by: Q3");
  assert.deepEqual(await errorsFor(cycle), [`${MAP}:18: Blocked by cycle: Q3 -> Q4 -> Q3`]);
});

test("a decision has Decided by with a name and a date", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("Decided by: Daniel Kindl, 2026-11-20", "Decided by: the agent")), [
    `${MAP}:14: Q2 has no "Decided by: <owner>, <YYYY-MM-DD>"`,
  ]);
  assert.deepEqual(await errorsFor(OPEN.replace("- Q2 Name", "- Name")), [
    `${MAP}:14: a decision must start with "- Q<n> <title>:"`,
  ]);
});

test("a decision has a Record that is a link or this line", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace(" Record: this line.", "")), [`${MAP}:14: Q2 has no "Record:"`]);
  assert.deepEqual(await errorsFor(OPEN.replace("Record: this line.", "Record: in chat.")), [
    `${MAP}:14: Q2 "Record:" must be a link or "this line"`,
  ]);
});

test("a relative Record link must resolve", async () => {
  assert.deepEqual(await errorsFor(OPEN, {}), [`${MAP}:13: Q1 Record link "../adr/0002-csv.md" does not resolve`]);
});

test("a done map has no open question, nothing unclear and a Hand-off link", async () => {
  const done = OPEN.replace("Status: open", "Status: done");
  assert.deepEqual(await errorsFor(done), [
    `${MAP}:16: a done map must have no open question`,
    `${MAP}:32: a done map must have an empty "Not yet clear"`,
    `${MAP}:44: a done map must link the plan and the issues under "Hand-off"`,
  ]);
});

test("a map has no image link", async () => {
  assert.deepEqual(await errorsFor(OPEN.replace("None yet.\n\n## Hand-off", "![sketch](a.png)\n\n## Hand-off")), [
    `${MAP}:42: a map must not have an image link`,
  ]);
});

test("the CLI exits 0 for a good map, 1 for findings and 2 for a usage error", async () => {
  const good = await makeTree({ [MAP]: OPEN, ...ADR });
  const bad = await makeTree({ [MAP]: OPEN.replace("Status: open", "Status: ready"), ...ADR });
  try {
    const pass = run([good]);
    assert.equal(pass.status, 0);
    assert.equal(pass.stdout, "1 map(s) have the template format.\n");
    const fail = run([bad]);
    assert.equal(fail.status, 1);
    assert.equal(fail.stderr, `${MAP}:3: Status must be "open" or "done"\n`);
    const usage = run(["a", "b"]);
    assert.equal(usage.status, 2);
    assert.match(usage.stderr, /^usage: /);
  } finally {
    await removeTree(good);
    await removeTree(bad);
  }
});

test("the CLI exits 2 when a map cannot be read", async () => {
  const root = await makeTree({ "docs/maps/broken.md/inner.md": "a folder, not a file\n" });
  try {
    const result = run([root]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /^cannot read docs\/maps: /);
  } finally {
    await removeTree(root);
  }
});

const A = (path) => ({ status: "A", path });
const M = (path) => ({ status: "M", path });
const D = (path) => ({ status: "D", path });

test("diff: a map change with only maps, ADRs and CONTEXT.md passes", () => {
  assert.deepEqual(checkMapsDiff([M(MAP), A("docs/adr/0002-x.md"), M("CONTEXT.md")]), []);
});

test("diff: a map change with a file outside the allowed paths fails", () => {
  assert.deepEqual(checkMapsDiff([M(MAP), M("scripts/x.mjs")]), [
    "scripts/x.mjs: a map pull request changes only docs/maps/, docs/adr/ and CONTEXT.md.",
  ]);
});

test("diff: a deleted map fails", () => {
  assert.deepEqual(checkMapsDiff([D(MAP)]), [`${MAP}: a map must never be deleted.`]);
});

test("diff: a change with no map change passes", () => {
  assert.deepEqual(checkMapsDiff([M("scripts/x.mjs"), D("docs/adr/0001-a.md")]), []);
  assert.deepEqual(checkMapsDiff([]), []);
});

const git = (root, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

test("the CLI diff mode exits 0, 1 and 2, and a missing docs/maps folder passes", async () => {
  const root = await makeTree({ "README.md": "# x\n", [MAP]: OPEN });
  try {
    git(root, "init", "-q", "-b", "main");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "base");
    const diff = () => run(["--diff", "--base", "main", root]);
    assert.equal(diff().status, 0);
    await writeFile(join(root, MAP), `${OPEN}\n`);
    assert.equal(diff().status, 0);
    await writeFile(join(root, "other.txt"), "x\n");
    const mixed = diff();
    assert.equal(mixed.status, 1);
    assert.equal(mixed.stderr, "other.txt: a map pull request changes only docs/maps/, docs/adr/ and CONTEXT.md.\n");
    await rm(join(root, "other.txt"));
    await rm(join(root, MAP));
    const gone = diff();
    assert.equal(gone.status, 1);
    assert.equal(gone.stderr, `${MAP}: a map must never be deleted.\n`);
    assert.equal(run(["--diff", "--base", "nope", root]).status, 2);
    assert.equal(run(["--bogus"]).status, 2);
  } finally {
    await removeTree(root);
  }
  const none = await makeTree({ "README.md": "# x\n" });
  try {
    git(none, "init", "-q", "-b", "main");
    git(none, "add", "-A");
    git(none, "commit", "-q", "-m", "base");
    await writeFile(join(none, "a.txt"), "x\n");
    assert.equal(run(["--diff", "--base", "main", none]).status, 0);
  } finally {
    await removeTree(none);
  }
});
