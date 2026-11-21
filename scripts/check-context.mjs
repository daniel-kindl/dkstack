#!/usr/bin/env node
// Check the format of CONTEXT.md, the domain glossary at the repository root.
// The format is in architecture/domain-languages.md, section Glossary: an H1,
// a "## Language" heading and "**Term**:" entries, each with a definition and
// an optional "_Avoid_:" line. A term is defined once (case is ignored), and
// a term is not on an "_Avoid_:" line. A missing CONTEXT.md is a pass.
// This file has no dependencies, so another repository can copy it.
// Usage: node scripts/check-context.mjs [root]
// Exit 0: pass. Exit 1: findings. Exit 2: usage or read error.

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FILE = "CONTEXT.md";
const TERM = /^\*\*(.+?)\*\*:\s*(.*)$/;
const AVOID = /^_Avoid_:\s*(.*)$/;

// Return the problems in the text of CONTEXT.md, as "CONTEXT.md:line: message".
export function checkContextText(text) {
  const lines = text.split(/\r?\n/);
  const errors = [];
  const error = (index, message) => errors.push(`${FILE}:${index + 1}: ${message}`);

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

// Return { found, errors }. A missing CONTEXT.md is a pass with found = false.
export async function checkContext(root) {
  let text;
  try {
    text = await readFile(join(root, FILE), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return { found: false, errors: [] };
    throw err;
  }
  return { found: true, errors: checkContextText(text) };
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
  console.log(result.found ? `${FILE} has the glossary format.` : `No ${FILE}. Nothing to check.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
