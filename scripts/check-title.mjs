#!/usr/bin/env node
// Check that a PR title or a commit title is a conventional commit:
// type(scope)!: description. The PR title becomes the commit title on main,
// so the validate workflow checks the PR title before the merge.
// A description that does not start with an imperative verb gives a warning, not a failure.
// In GitHub Actions, use --event to read the title from GITHUB_EVENT_PATH.
// Usage: node scripts/check-title.mjs "<title>"

import { pathToFileURL } from "node:url";
import { readPullRequest } from "./pr-event.mjs";

export const TYPES = [
  "feat", "fix", "docs", "refactor", "test", "chore",
  "build", "ci", "perf", "style", "revert",
];
const HEADER = /^([a-z]+)(?:\((.*?)\))?!?:(.*)$/;
const MAX_CHARS = 50;
// GitHub adds " (#NN)" when it squashes a PR. The limit applies to the title as written.
const SQUASH_SUFFIX = / \(#\d+\)$/;
const SCOPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// ASD-STE100 does not use these dashes. scripts/check-dashes.mjs has the same list for Markdown.
const DASHES = new Map([
  ["\u2014", "em dash (U+2014)"],
  ["\u2013", "en dash (U+2013)"],
]);

// A first word with one of these endings is often a past form, a gerund or a third person form.
const NOT_IMPERATIVE = /(?:ed|ing|s)$/;
// These imperative verbs have one of the endings above.
const IMPERATIVE = /(?:ss|us|eed)$|^(?:embed|bring)$/;
const MOOD_WARNING =
  'the description should start with a verb in imperative mood, as in "add", not "added", "adding" or "adds"';

// Return a list with the first problem, or an empty list for a valid title.
export function checkTitle(fullTitle) {
  // Remove the suffix once, so every rule below sees the same text.
  const title = fullTitle.replace(SQUASH_SUFFIX, "");
  if (title.trim() === "") return ["the title is empty"];
  if (/[\r\n]/.test(title)) return ["the title must be one line"];
  for (const [char, name] of DASHES) {
    if (title.includes(char)) {
      return [`the title must not have an ${name}. Use a comma or a new sentence`];
    }
  }
  const match = HEADER.exec(title);
  if (!match) return ['the title must start with a type, as in "fix: ..."'];
  const [, type, scope, description] = match;
  if (!TYPES.includes(type)) {
    return [`the type is not allowed. Use one of: ${TYPES.join(", ")}`];
  }
  if (scope !== undefined && !SCOPE.test(scope)) {
    return ["the scope must use only a-z, 0-9 and single hyphens"];
  }
  if (!/^ \S/.test(description)) return ["put one space after the colon, then a description"];
  if (/\s$/.test(title)) return ["the title must not end with a space"];
  // Count code points, so an emoji counts as one character.
  const chars = [...title].length;
  if (chars > MAX_CHARS) {
    return [`the title must have ${MAX_CHARS} characters or fewer, without the (#NN) suffix`];
  }
  return [];
}

// Return the warnings for a valid title. A warning does not make the title fail.
export function titleWarnings(fullTitle) {
  if (checkTitle(fullTitle).length > 0) return [];
  const [, , , description] = HEADER.exec(fullTitle.replace(SQUASH_SUFFIX, ""));
  const word = (/^ ([A-Za-z]+)/.exec(description)?.[1] ?? "").toLowerCase();
  return NOT_IMPERATIVE.test(word) && !IMPERATIVE.test(word) ? [MOOD_WARNING] : [];
}

function main() {
  const [, , first, operand] = process.argv;
  let title = (first === "--" ? operand : first) ?? "";
  if (first === "--event") {
    const pr = readPullRequest((value) => typeof value.title === "string");
    if (!pr) {
      process.exitCode = 2;
      return;
    }
    title = pr.title;
  }
  const errors = checkTitle(title);
  if (errors.length > 0) {
    console.error(`Title is not a conventional commit: ${errors[0]}`);
    process.exitCode = 1;
    return;
  }
  for (const warning of titleWarnings(title)) console.error(`title warning: ${warning}`);
  console.log("Title is a conventional commit.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
