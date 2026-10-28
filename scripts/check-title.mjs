#!/usr/bin/env node
// Check that a PR title or a commit title is a conventional commit:
// type(scope)!: description. The PR title becomes the commit title on main,
// so the validate workflow checks the PR title before the merge.
// Usage: node scripts/check-title.mjs "<title>"

import { pathToFileURL } from "node:url";

export const TYPES = [
  "feat", "fix", "docs", "refactor", "test", "chore",
  "build", "ci", "perf", "style", "revert",
];
const HEADER = /^([a-z]+)(?:\((.*?)\))?!?:(.*)$/;
const MAX_CHARS = 50;
// GitHub adds " (#NN)" when it squashes a PR. The limit applies to the title as written.
const SQUASH_SUFFIX = / \(#\d+\)$/;
const SCOPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Return a list with the first problem, or an empty list for a valid title.
export function checkTitle(title) {
  if (title.trim() === "") return ["the title is empty"];
  if (/[\r\n]/.test(title)) return ["the title must be one line"];
  const match = HEADER.exec(title);
  if (!match) return ['the title must start with a type, as in "fix: ..."'];
  const [, type, scope, description] = match;
  if (!TYPES.includes(type)) {
    return [`the type "${type}" is not allowed. Use one of: ${TYPES.join(", ")}`];
  }
  if (scope !== undefined && !SCOPE.test(scope)) {
    return ["the scope must use only a-z, 0-9 and single hyphens"];
  }
  if (!/^ \S/.test(description)) return ["put one space after the colon, then a description"];
  if (/\s$/.test(title)) return ["the title must not end with a space"];
  // Count code points, so an emoji counts as one character.
  const chars = [...title.replace(SQUASH_SUFFIX, "")].length;
  if (chars > MAX_CHARS) {
    return [`the title has ${chars} characters. Use ${MAX_CHARS} or fewer, without the (#NN) suffix`];
  }
  return [];
}

function main() {
  const title = process.argv[2] ?? "";
  const errors = checkTitle(title);
  if (errors.length > 0) {
    console.error(`title "${title}" is not a conventional commit: ${errors[0]}`);
    process.exitCode = 1;
    return;
  }
  console.log(`title "${title}" is a conventional commit.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
