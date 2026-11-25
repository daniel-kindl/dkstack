#!/usr/bin/env node
// Check that each TODO in scripts/ and test/ has an issue reference such as
// #123 on the same line. The rule is in writing/comments.md, section "Rules".
// This file and its test file are skipped, because they contain the word as
// an example.
// Usage: node scripts/check-todos.mjs [root]
// Exit 0: pass. Exit 1: findings.

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FOLDERS = ["scripts", "test"];
const SKIP = new Set(["scripts/check-todos.mjs", "test/check-todos.test.mjs"]);
const TODO = /\bTODO\b/;
const ISSUE = /#\d+/;

async function filesIn(root, folder) {
  let entries;
  try {
    entries = await readdir(join(root, folder), { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const path = `${folder}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await filesIn(root, path)));
    else if (entry.isFile() && !SKIP.has(path)) files.push(path);
  }
  return files;
}

// Return { checked, errors }. Paths use "/" and are relative to root.
export async function checkTodos(root) {
  const files = (await Promise.all(FOLDERS.map((folder) => filesIn(root, folder)))).flat();
  const errors = [];
  for (const path of files) {
    const lines = (await readFile(join(root, path), "utf8")).split(/\r?\n/);
    lines.forEach((line, i) => {
      if (TODO.test(line) && !ISSUE.test(line)) errors.push(`${path}:${i + 1}: TODO has no issue reference. Add #NNN`);
    });
  }
  return { checked: files.length, errors };
}

async function main() {
  const root = resolve(process.argv[2] ?? ".");
  const { checked, errors } = await checkTodos(root);
  if (errors.length > 0) {
    for (const message of errors) console.error(message);
    process.exitCode = 1;
    return;
  }
  console.log(`${checked} file(s) in scripts and test have no TODO without an issue reference.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
