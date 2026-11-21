#!/usr/bin/env node
// Check the format of each map in docs/maps/. The chart-route skill writes the
// maps and has the template. A missing docs/maps/ folder is a pass.
// This file has no dependencies, so another repository can copy it.
// Usage: node scripts/check-maps.mjs [root]
// Exit 0: pass. Exit 1: findings. Exit 2: usage or read error.

import { readFile, readdir, stat } from "node:fs/promises";
import { join, posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = "docs/maps";
const HEADINGS = ["Notes", "Decisions", "Open questions", "Not yet clear", "Out of scope",
  "Prototypes", "Hand-off"];
const TYPES = ["owner", "research", "prototype", "task"];
const HEADER_FIELDS = ["Status", "Destination", "Next"];
const LINK = /\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)/;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

// Split the lines into the header (before the first "## ") and the "## " sections.
function parse(lines) {
  const headings = [];
  let fence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (!fence && /^## /.test(line)) headings.push({ name: line.slice(3).trim(), index: i });
  });
  const sections = new Map();
  headings.forEach((h, n) => {
    const end = n + 1 < headings.length ? headings[n + 1].index : lines.length;
    if (!sections.has(h.name)) sections.set(h.name, { index: h.index, start: h.index + 1, end });
  });
  const headerEnd = headings.length > 0 ? headings[0].index : lines.length;
  return { headings, sections, headerEnd };
}

// Return the problems in one map, as "path:line: message". `exists(path)` says
// if a path relative to the repository root exists.
export async function checkMapText(path, text, exists) {
  const lines = text.split(/\r?\n/);
  const errors = [];
  const error = (index, message) => errors.push(`${path}:${index + 1}: ${message}`);
  const { headings, sections, headerEnd } = parse(lines);
  const body = (name) => {
    const s = sections.get(name);
    return s ? lines.slice(s.start, s.end).map((line, k) => ({ line, index: s.start + k })) : [];
  };

  if (!/^# Map: \S/.test(lines[0] ?? "")) error(0, 'the first line must be "# Map: <name>"');

  const header = new Map();
  for (let i = 0; i < headerEnd; i++) {
    const m = /^(Status|Destination|Next):\s*(.*)$/.exec(lines[i]);
    if (m && !header.has(m[1])) header.set(m[1], { value: m[2].trim(), index: i });
  }
  for (const field of HEADER_FIELDS) {
    const entry = header.get(field);
    if (!entry) error(0, `missing "${field}:" line`);
    else if (entry.value === "") error(entry.index, `"${field}:" is empty`);
  }
  const status = header.get("Status");
  if (status && status.value !== "" && !["open", "done"].includes(status.value)) {
    error(status.index, 'Status must be "open" or "done"');
  }

  let highest = -1;
  for (const h of headings) {
    const order = HEADINGS.indexOf(h.name);
    if (order === -1) error(h.index, `unknown heading "## ${h.name}"`);
    else if (order < highest) error(h.index, `the heading "## ${h.name}" is out of template order`);
    else highest = order;
  }
  for (const name of HEADINGS) {
    if (!sections.has(name)) error(0, `missing heading "## ${name}"`);
  }

  // Each Q id, where it is used first.
  const ids = new Map();
  const useId = (id, index) => {
    if (ids.has(id)) error(index, `${id} is already used on line ${ids.get(id) + 1}`);
    else ids.set(id, index);
  };

  const decisions = [];
  for (const { line, index } of body("Decisions")) {
    if (!/^- /.test(line)) continue;
    const m = /^- (Q\d+) [^:]+:/.exec(line);
    if (!m) {
      error(index, 'a decision must start with "- Q<n> <title>:"');
      continue;
    }
    useId(m[1], index);
    decisions.push({ id: m[1], line, index });
  }

  const questions = [];
  for (const { line, index } of body("Open questions")) {
    if (!/^### /.test(line)) {
      if (questions.length > 0) questions.at(-1).lines.push({ line, index });
      continue;
    }
    const m = /^### (Q\d+): \S/.exec(line);
    if (!m) {
      error(index, 'an open question heading must be "### Q<n>: <title>"');
      questions.push({ id: null, index, lines: [] });
      continue;
    }
    useId(m[1], index);
    questions.push({ id: m[1], index, lines: [] });
  }

  const graph = new Map();
  for (const q of questions) {
    if (!q.id) continue;
    const field = (name) => q.lines.find(({ line }) => line.startsWith(`${name}:`));
    const type = field("Type");
    if (!type) error(q.index, `${q.id} has no "Type:" line`);
    else {
      const value = type.line.slice(5).trim();
      if (!TYPES.includes(value)) {
        error(type.index, `${q.id} has an unknown Type "${value}". Use owner, research, prototype or task`);
      }
    }
    const blocked = field("Blocked by");
    graph.set(q.id, []);
    if (!blocked) {
      error(q.index, `${q.id} has no "Blocked by:" line`);
      continue;
    }
    const value = blocked.line.slice("Blocked by:".length).trim();
    if (value === "none") continue;
    if (!/^Q\d+(\s*,\s*Q\d+)*$/.test(value)) {
      error(blocked.index, `${q.id} "Blocked by:" must be none or a list of Q<n>`);
      continue;
    }
    for (const id of value.split(",").map((s) => s.trim())) {
      if (!ids.has(id)) error(blocked.index, `${q.id} is blocked by ${id}, which is not in this file`);
      else graph.get(q.id).push(id);
    }
  }
  for (const cycle of findCycles(graph, questions.filter((q) => q.id).map((q) => q.id))) {
    error(ids.get(cycle[0]), `Blocked by cycle: ${[...cycle, cycle[0]].join(" -> ")}`);
  }

  for (const d of decisions) {
    const decided = /Decided by: ([^,.]+?), (\d{4}-\d{2}-\d{2})\b/.exec(d.line);
    if (!decided) error(d.index, `${d.id} has no "Decided by: <owner>, <YYYY-MM-DD>"`);
    const record = /Record: (.+)$/.exec(d.line);
    if (!record) {
      error(d.index, `${d.id} has no "Record:"`);
      continue;
    }
    const link = LINK.exec(record[1]);
    if (!link) {
      if (!/^this line\b/.test(record[1])) error(d.index, `${d.id} "Record:" must be a link or "this line"`);
      continue;
    }
    const target = link[1].split("#")[0];
    if (target === "" || SCHEME.test(target) || target.startsWith("/")) continue;
    const resolved = posix.normalize(posix.join(posix.dirname(path), target));
    if (!(await exists(resolved))) error(d.index, `${d.id} Record link "${link[1]}" does not resolve`);
  }

  if (status && status.value === "done") {
    const open = sections.get("Open questions");
    if (open && questions.length > 0) error(open.index, "a done map must have no open question");
    const unclear = sections.get("Not yet clear");
    if (unclear && body("Not yet clear").some(({ line }) => /^\s*[-*] \S/.test(line))) {
      error(unclear.index, 'a done map must have an empty "Not yet clear"');
    }
    const handOff = sections.get("Hand-off");
    const linked = body("Hand-off").some(({ line }) => LINK.test(line) || /https?:\/\/\S/.test(line) || /(^|\s)#\d+\b/.test(line));
    if (handOff && !linked) error(handOff.index, 'a done map must link the plan and the issues under "Hand-off"');
  }

  lines.forEach((line, i) => {
    if (/!\[[^\]]*\]\(|<img\b/i.test(line)) error(i, "a map must not have an image link");
  });
  return errors;
}

// Return each cycle once, as a list of ids that starts with the id that comes first in `order`.
function findCycles(graph, order) {
  const cycles = [];
  const seen = new Set();
  const state = new Map();
  const stack = [];
  const visit = (id) => {
    state.set(id, "active");
    stack.push(id);
    for (const next of graph.get(id) ?? []) {
      if (!graph.has(next)) continue;
      if (state.get(next) === "active") {
        const cycle = stack.slice(stack.indexOf(next));
        const start = cycle.reduce((a, b) => (order.indexOf(a) <= order.indexOf(b) ? a : b));
        const rotated = [...cycle.slice(cycle.indexOf(start)), ...cycle.slice(0, cycle.indexOf(start))];
        const key = [...cycle].sort().join(",");
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(rotated);
        }
      } else if (!state.has(next)) {
        visit(next);
      }
    }
    stack.pop();
    state.set(id, "done");
  };
  for (const id of order) if (!state.has(id)) visit(id);
  return cycles;
}

// Return { checked, errors } for the maps under root. A missing docs/maps/ is a pass.
export async function checkMaps(root) {
  let names;
  try {
    names = (await readdir(join(root, DIR))).filter((name) => name.endsWith(".md")).sort();
  } catch (err) {
    if (err.code === "ENOENT") return { checked: 0, errors: [] };
    throw err;
  }
  const exists = async (path) => stat(join(root, path)).then(() => true, () => false);
  const errors = [];
  for (const name of names) {
    const path = `${DIR}/${name}`;
    errors.push(...(await checkMapText(path, await readFile(join(root, path), "utf8"), exists)));
  }
  return { checked: names.length, errors };
}

async function main(args) {
  if (args.length > 1 || args.some((arg) => arg.startsWith("-"))) {
    console.error("usage: node scripts/check-maps.mjs [root]");
    return 2;
  }
  let result;
  try {
    result = await checkMaps(resolve(args[0] ?? "."));
  } catch (err) {
    console.error(`cannot read ${DIR}: ${err.message}`);
    return 2;
  }
  if (result.errors.length > 0) {
    for (const message of result.errors) console.error(message);
    return 1;
  }
  console.log(result.checked > 0 ? `${result.checked} map(s) have the template format.`
    : `No maps in ${DIR}. Nothing to check.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
