#!/usr/bin/env node
// Warn about text that breaks the sentence limits of writing/index.md: a step
// with more than 20 words, a sentence with more than 25 words, and a
// semicolon. A step is a numbered list item or a checklist item ("- [ ]"). CHANGELOG.md, code, block
// quotes, tables, headings and text in double quotes are not checked. This is
// the first stage: the check prints warnings and always exits 0 (#154, P40).

import { readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { markdownFiles } from "./markdown-files.mjs";

const STEP_LIMIT = 20;
const SENTENCE_LIMIT = 25;
const SKIP_FILES = new Set(["CHANGELOG.md"]);
const NUMBERED = /^\s*\d+[.)]\s+/;
const BULLET = /^\s*[-*+]\s+/;
const CHECKLIST = /^\s*[-*+]\s+\[[ xX]\]\s+/;

// Return the text of a line without code, links, HTML tags and quotes.
function plain(line) {
  return line
    .replace(/`[^`]*`/g, "code")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/"[^"]*"/g, "quote");
}

// Yield { line, text, step } for each block of prose: a paragraph or a list
// item, with its lines joined.
function* blocks(text) {
  let fence = null;
  let current = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (fenceMatch) {
      if (current) yield current;
      current = null;
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    const skip = fence !== null || raw.trim() === "" || /^\s*(#{1,6}\s|>|\|)/.test(raw);
    if (skip) {
      if (current) yield current;
      current = null;
      continue;
    }
    const item = NUMBERED.test(raw) || BULLET.test(raw);
    if (item || current === null) {
      if (current) yield current;
      current = { line: i + 1, text: raw.replace(CHECKLIST, "").replace(NUMBERED, "").replace(BULLET, ""), step: NUMBERED.test(raw) || CHECKLIST.test(raw) };
    } else {
      current.text += ` ${raw.trim()}`;
    }
  }
  if (current) yield current;
}

// Return the warnings for one Markdown text, as "path:line: message".
export function writingWarnings(path, text) {
  const warnings = [];
  for (const block of blocks(text)) {
    const prose = plain(block.text);
    if (prose.includes(";")) warnings.push(`${path}:${block.line}: a semicolon`);
    const limit = block.step ? STEP_LIMIT : SENTENCE_LIMIT;
    const kind = block.step ? "a step" : "a sentence";
    for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
      const count = sentence.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      if (count > limit) warnings.push(`${path}:${block.line}: ${kind} has ${count} words, more than ${limit}`);
    }
  }
  return warnings;
}

// Return { checked, warnings }. Paths use "/" and are relative to root.
export async function checkWriting(root) {
  const files = (await markdownFiles(root)).filter((f) => !SKIP_FILES.has(relative(root, f)));
  const warnings = [];
  for (const file of files) {
    const relFile = relative(root, file).split(sep).join("/");
    warnings.push(...writingWarnings(relFile, await readFile(file, "utf8")));
  }
  return { checked: files.length, warnings };
}

async function main() {
  const root = resolve(process.argv[2] ?? ".");
  const { checked, warnings } = await checkWriting(root);
  for (const message of warnings) console.error(message);
  console.log(`${checked} Markdown file(s) checked. ${warnings.length} writing warning(s). This check only warns.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
