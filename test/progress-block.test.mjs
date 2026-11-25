import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(repoRoot, "learning", "progress.md"), "utf8");

const TOP = ["schema_version", "updated", "topic", "goal", "mode", "concepts", "misconceptions", "review", "next"];
const CONCEPT = ["name", "level", "evidence", "assistance"];
const MISCONCEPTION = ["concept", "note", "corrected"];
const REVIEW = ["concept", "after"];
const MODES = ["Explore", "Learn", "Practice", "Assess", "Review"];
const ASSISTANCE = ["none", "hint", "answer shown"];

function scalar(text) {
  const t = text.trim();
  if (t === "[]") return [];
  if (/^".*"$/.test(t)) return t.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === "true") return true;
  if (t === "false") return false;
  return t;
}

// Parse the small YAML subset of the progress block: maps, lists of maps, lists of scalars.
function parseBlock(text) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  let i = 0;
  const indentOf = (l) => l.match(/^ */)[0].length;
  function parseMap(indent) {
    const obj = {};
    while (i < lines.length && indentOf(lines[i]) === indent) {
      const m = lines[i].trim().match(/^([a-z_]+):(?: (.*))?$/);
      if (!m) throw new Error(`bad line: ${lines[i]}`);
      const [, key, rest] = m;
      i += 1;
      obj[key] = rest !== undefined ? scalar(rest) : parseList(indent);
    }
    return obj;
  }
  function parseList(parentIndent) {
    const items = [];
    while (i < lines.length && indentOf(lines[i]) > parentIndent && lines[i].trim().startsWith("- ")) {
      const itemIndent = indentOf(lines[i]);
      const body = lines[i].trim().slice(2);
      if (/^[a-z_]+:/.test(body)) {
        lines[i] = " ".repeat(itemIndent + 2) + body;
        items.push(parseMap(itemIndent + 2));
      } else {
        items.push(scalar(body));
        i += 1;
      }
    }
    return items;
  }
  return parseMap(0);
}

function validate(block) {
  const errors = [];
  const keys = (obj, allowed, where) => {
    for (const k of Object.keys(obj)) if (!allowed.includes(k)) errors.push(`${where}: unknown key ${k}`);
    for (const k of allowed) if (!(k in obj)) errors.push(`${where}: missing key ${k}`);
  };
  const isDate = (d) => {
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const date = new Date(`${d}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(d);
  };
  keys(block, TOP, "block");
  if (block.schema_version !== 1) errors.push("schema_version must be 1");
  if (!isDate(block.updated)) errors.push("updated must be YYYY-MM-DD");
  if (!MODES.includes(block.mode)) errors.push("mode is not valid");
  for (const c of block.concepts ?? []) {
    keys(c, CONCEPT, "concept");
    const okLevel = c.level === "unknown" || (Number.isInteger(c.level) && c.level >= 0 && c.level <= 5);
    if (!okLevel) errors.push(`level is not valid: ${c.level}`);
    if (!ASSISTANCE.includes(c.assistance)) errors.push(`assistance is not valid: ${c.assistance}`);
    if (!Array.isArray(c.evidence)) errors.push("evidence must be a list");
    else if (c.level === "unknown" && c.evidence.length > 0) errors.push("unknown level needs empty evidence");
  }
  for (const m of block.misconceptions ?? []) {
    keys(m, MISCONCEPTION, "misconception");
    if (typeof m.corrected !== "boolean") errors.push("corrected must be true or false");
  }
  for (const r of block.review ?? []) {
    keys(r, REVIEW, "review");
    if (!isDate(r.after)) errors.push("review.after must be YYYY-MM-DD");
  }
  return errors;
}

function exampleBlock() {
  const m = page.match(/Example block:\n\n```yaml\n([\s\S]*?)```/);
  assert.ok(m, "example block found in learning/progress.md");
  return m[1];
}

const clone = () => parseBlock(exampleBlock());

test("the example block parses and is valid", () => {
  const block = clone();
  assert.equal(block.schema_version, 1);
  assert.equal(block.concepts.length, 2);
  assert.deepEqual(validate(block), []);
});

test("the example block has an unknown concept with empty evidence", () => {
  const unknown = clone().concepts.filter((c) => c.level === "unknown");
  assert.ok(unknown.length > 0);
  for (const c of unknown) assert.deepEqual(c.evidence, []);
});

test("a wrong schema_version is rejected", () => {
  const b = clone();
  b.schema_version = 2;
  assert.ok(validate(b).includes("schema_version must be 1"));
});

test("a missing or unknown key is rejected", () => {
  const b = clone();
  delete b.goal;
  b.extra = "x";
  const errors = validate(b);
  assert.ok(errors.includes("block: missing key goal"));
  assert.ok(errors.includes("block: unknown key extra"));
});

test("a level out of range is rejected", () => {
  for (const level of [6, -1, "high", 2.5]) {
    const b = clone();
    b.concepts[0].level = level;
    assert.ok(validate(b).some((e) => e.startsWith("level is not valid")), String(level));
  }
});

test("an assistance value that is not listed is rejected", () => {
  const b = clone();
  b.concepts[0].assistance = "solution";
  assert.ok(validate(b).some((e) => e.startsWith("assistance is not valid")));
});

test("a bad date is rejected", () => {
  for (const d of ["16-11-2026", "2026-13-01", "2026-02-30", 5]) {
    const b = clone();
    b.updated = d;
    assert.ok(validate(b).includes("updated must be YYYY-MM-DD"), String(d));
  }
  const b = clone();
  b.review[0].after = "tomorrow";
  assert.ok(validate(b).includes("review.after must be YYYY-MM-DD"));
});

test("an unknown level with evidence is rejected", () => {
  const b = clone();
  b.concepts[1].evidence = ["a note"];
  assert.ok(validate(b).includes("unknown level needs empty evidence"));
});

test("a bad mode and a bad corrected value are rejected", () => {
  const b = clone();
  b.mode = "Cram";
  b.misconceptions[0].corrected = "yes";
  const errors = validate(b);
  assert.ok(errors.includes("mode is not valid"));
  assert.ok(errors.includes("corrected must be true or false"));
});

test("evidence that is not a list is rejected", () => {
  const b = clone();
  b.concepts[0].evidence = "text";
  assert.ok(validate(b).includes("evidence must be a list"));
});

test("the parser rejects a line that is not a key", () => {
  assert.throws(() => parseBlock("not a key"), /bad line/);
});
