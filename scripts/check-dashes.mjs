#!/usr/bin/env node
// Check that no Markdown file has an em dash (U+2014) or an en dash (U+2013).
// ASD-STE100 does not use them. Code blocks are checked too, because an
// example is text that a reader copies.

import { readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { markdownFiles } from "./markdown-files.mjs";

const DASHES = new Map([
  ["\u2014", "em dash (U+2014)"],
  ["\u2013", "en dash (U+2013)"],
]);

// Return { checked, errors }. Paths use "/" and are relative to root.
export async function checkDashes(root) {
  const files = await markdownFiles(root);
  const errors = [];
  for (const file of files) {
    const relFile = relative(root, file).split(sep).join("/");
    const lines = (await readFile(file, "utf8")).split(/\r?\n/);
    lines.forEach((line, i) => {
      [...line].forEach((char, j) => {
        const name = DASHES.get(char);
        if (name) errors.push(`${relFile}:${i + 1}:${j + 1}: ${name}`);
      });
    });
  }
  return { checked: files.length, errors };
}

async function main() {
  const root = resolve(process.argv[2] ?? ".");
  const { checked, errors } = await checkDashes(root);
  if (errors.length > 0) {
    for (const message of errors) console.error(message);
    process.exitCode = 1;
    return;
  }
  console.log(`${checked} Markdown file(s) have no em dash or en dash.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
