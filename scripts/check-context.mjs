#!/usr/bin/env node
// Check the format of CONTEXT.md, the domain glossary at the repository root.
// The format is in architecture/domain-languages.md, section Glossary: an H1,
// a "## Language" heading and "**Term**:" entries, each with a definition and
// an optional "_Avoid_:" line. A term is defined once (case is ignored), and
// a term is not on an "_Avoid_:" line. A missing CONTEXT.md is a pass.
// With two or more bounded contexts, a root CONTEXT-MAP.md lists each context
// with the file CONTEXT.md in its folder, and its relations. The script checks
// the map and each listed file.
// This file has no dependencies, so another repository can copy it.
// Usage: node scripts/check-context.mjs [root]
// Exit 0: pass. Exit 1: findings. Exit 2: usage or read error.

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FILE = "CONTEXT.md";
const MAP_FILE = "CONTEXT-MAP.md";
const TERM = /^\*\*(.+?)\*\*:\s*(.*)$/;
const AVOID = /^_Avoid_:\s*(.*)$/;

// Return the problems in the text of CONTEXT.md, as "CONTEXT.md:line: message".
export function checkContextText(text, label = FILE) {
  const lines = text.split(/\r?\n/);
  const errors = [];
  const error = (index, message) => errors.push(`${label}:${index + 1}: ${message}`);

  const first = lines.findIndex((line) => line.trim() !== "");
  if (first === -1 || !/^# \S/.test(lines[first])) {
    error(Math.max(first, 0), "the file must start with an H1 title");
  }

  const language = lines.findIndex((line) => line.trim() === "## Language");
  if (language === -1) {
    error(0, 'the file has no "## Language" heading');
    return errors;
  }

  const terms = new Map();
  const avoided = [];
  let entry = null;
  for (let i = language + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^## /.test(line)) break;
    if (line === "" || /^### /.test(line)) continue;
    const term = TERM.exec(line);
    if (term) {
      if (entry && !entry.defined) error(entry.index, `the term "${entry.name}" has no definition`);
      const name = term[1].trim();
      const key = name.toLowerCase();
      if (terms.has(key)) {
        error(i, `the term "${name}" is already defined on line ${terms.get(key) + 1}`);
      } else {
        terms.set(key, i);
      }
      entry = { name, index: i, defined: term[2] !== "" };
      continue;
    }
    const avoid = AVOID.exec(line);
    if (avoid) {
      for (const word of avoid[1].split(",").map((w) => w.trim()).filter(Boolean)) {
        avoided.push({ word, index: i });
      }
      continue;
    }
    if (entry) entry.defined = true;
  }
  if (entry && !entry.defined) error(entry.index, `the term "${entry.name}" has no definition`);
  if (terms.size === 0) error(language, 'the "## Language" section has no **Term**: entry');

  for (const { word, index } of avoided) {
    if (terms.has(word.toLowerCase())) {
      error(index, `"${word}" is a term and is also on an _Avoid_: line`);
    }
  }
  return errors.sort((a, b) => lineOf(a) - lineOf(b));
}

const lineOf = (message) => Number(message.split(":")[1]);

const CONTEXT_ENTRY = /^- \*\*(.+?)\*\*:\s*\[[^\]]*\]\(([^)]*)\)\s*$/;
const RELATION = /^- \*\*(.+?)\*\* -> \*\*(.+?)\*\*:\s*(.*)$/;

// Return { errors, contexts } for the text of CONTEXT-MAP.md. Each context is
// { name, path, index }. Each error is "CONTEXT-MAP.md:line: message".
export function checkMapText(text) {
  const lines = text.split(/\r?\n/);
  const errors = [];
  const contexts = [];
  const error = (index, message) => errors.push(`${MAP_FILE}:${index + 1}: ${message}`);

  const first = lines.findIndex((line) => line.trim() !== "");
  if (first === -1 || !/^# \S/.test(lines[first])) {
    error(Math.max(first, 0), "the file must start with an H1 title");
  }
  const heading = lines.findIndex((line) => line.trim() === "## Contexts");
  if (heading === -1) {
    error(0, 'the file has no "## Contexts" heading');
    return { errors, contexts };
  }

  const names = new Map();
  const paths = new Map();
  let i = heading + 1;
  for (; i < lines.length && !/^## /.test(lines[i]); i++) {
    const entry = CONTEXT_ENTRY.exec(lines[i].trim());
    if (!entry) {
      if (lines[i].trim().startsWith("- ")) {
        error(i, "the line is not a context entry. Write - **Name**: [file](path/CONTEXT.md)");
      }
      continue;
    }
    const name = entry[1].trim();
    const path = entry[2].trim();
    if (names.has(name.toLowerCase())) {
      error(i, `the context "${name}" is already listed on line ${names.get(name.toLowerCase()) + 1}`);
      continue;
    }
    if (paths.has(path)) {
      error(i, `the file "${path}" is already listed on line ${paths.get(path) + 1}`);
      continue;
    }
    names.set(name.toLowerCase(), i);
    paths.set(path, i);
    const parts = path.split("/");
    if (parts.length < 2 || parts.at(-1) !== "CONTEXT.md" || parts.some((p) => p === "" || p === "." || p === "..")) {
      error(i, `the file "${path}" must be a CONTEXT.md in a folder below the root`);
      continue;
    }
    contexts.push({ name, path, index: i });
  }
  if (names.size < 2) {
    error(heading, `the map lists ${names.size} context${names.size === 1 ? "" : "s"}. List two or more, or use CONTEXT.md at the root`);
  }

  const relations = lines.findIndex((line) => line.trim() === "## Relations");
  for (let j = relations === -1 ? lines.length : relations + 1; j < lines.length; j++) {
    if (/^## /.test(lines[j])) break;
    const relation = RELATION.exec(lines[j].trim());
    if (!relation) {
      if (lines[j].trim().startsWith("- ")) {
        error(j, "the line is not a relation. Write - **Upstream** -> **Downstream**: <text>");
      }
      continue;
    }
    const [, from, to, rest] = relation;
    const unknown = [from, to].find((name) => !names.has(name.trim().toLowerCase()));
    if (unknown) {
      error(j, `the relation names "${unknown.trim()}", which is not a listed context`);
    } else if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      error(j, "the relation joins a context to itself");
    } else if (rest.trim() === "") {
      error(j, "the relation does not say who is upstream and how the data is translated");
    }
  }
  return { errors, contexts };
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

// Return { found, errors, checked }. A project with neither CONTEXT.md nor
// CONTEXT-MAP.md is a pass with found = false. checked counts the context
// files below the root that the map lists.
export async function checkContext(root) {
  const errors = [];
  const text = await readOptional(join(root, FILE));
  if (text !== null) errors.push(...checkContextText(text));
  const mapText = await readOptional(join(root, MAP_FILE));
  let checked = 0;
  if (mapText !== null) {
    const map = checkMapText(mapText);
    errors.push(...map.errors);
    for (const context of map.contexts) {
      const body = await readOptional(join(root, context.path));
      if (body === null) {
        errors.push(`${MAP_FILE}:${context.index + 1}: the file "${context.path}" does not exist`);
      } else {
        checked += 1;
        errors.push(...checkContextText(body, context.path));
      }
    }
  }
  return { found: text !== null || mapText !== null, errors, checked, mapped: mapText !== null };
}

async function main(args) {
  if (args.length > 1 || args.some((arg) => arg.startsWith("-"))) {
    console.error("usage: node scripts/check-context.mjs [root]");
    return 2;
  }
  let result;
  try {
    result = await checkContext(resolve(args[0] ?? "."));
  } catch (err) {
    console.error(`cannot read ${FILE}: ${err.message}`);
    return 2;
  }
  if (result.errors.length > 0) {
    for (const message of result.errors) console.error(message);
    return 1;
  }
  if (result.mapped) {
    console.log(`${MAP_FILE} and ${result.checked} context file(s) have the glossary format.`);
  } else {
    console.log(result.found ? `${FILE} has the glossary format.` : `No ${FILE}. Nothing to check.`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
