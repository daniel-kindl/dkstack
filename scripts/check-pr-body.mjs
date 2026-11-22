#!/usr/bin/env node
// Check the body of a pull request: an issue link with a number, an Evidence
// section, one Observability line, and a valid Visual verification line.
// The rules are in skills/write-pr/SKILL.md and workflow/review-and-merge.md.
// A PR from a bot account is skipped.
// Usage: BODY="<body>" AUTHOR="<login>" node scripts/check-pr-body.mjs
//    or: node scripts/check-pr-body.mjs <file>

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ISSUE_LINK =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+(?:(?:[\w.-]+\/[\w.-]+)?#\d+|https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+)/i;
const EVIDENCE = /^## Evidence[ \t]*$/m;
const LINE = (name) => new RegExp(`^[ \\t]*(?:[-*][ \\t]+)?${name}:[ \\t]*(.*)$`, "gm");
const OBSERVABILITY_PLACEHOLDERS = ["<events added or changed>", "<reason>"];
const VISUAL_START = /^(?:PASS|FAIL|NOT RUN)\b/;

const values = (body, name) => [...body.matchAll(LINE(name))].map((m) => m[1].trim());

// Return the list of problems. An empty list means a valid body.
export function checkPrBody(rawBody, author = "") {
  if (author.endsWith("[bot]")) return [];
  // A template comment or a code block can hold example lines. They are not part of the body.
  const body = rawBody
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, "");
  const errors = [];
  if (!ISSUE_LINK.test(body)) {
    errors.push("the body must link an issue with a number, for example \"Closes #12\"");
  }
  if (!EVIDENCE.test(body)) errors.push("the body must have an \"## Evidence\" section");

  const observability = values(body, "Observability");
  if (observability.length !== 1) {
    errors.push(
      `the body must have one "Observability:" line, and it has ${observability.length}`,
    );
  } else {
    const [value] = observability;
    if (value === "" || OBSERVABILITY_PLACEHOLDERS.some((p) => value.includes(p))) {
      errors.push("the \"Observability:\" line must name the events or say \"none, <reason>\"");
    } else if (/^none\b/i.test(value) && !/^none,\s*\S/i.test(value)) {
      errors.push("the \"Observability:\" line must give a reason after \"none,\"");
    }
  }

  for (const value of values(body, "Visual verification")) {
    if (!VISUAL_START.test(value)) {
      errors.push("the \"Visual verification:\" line must start with PASS, FAIL or NOT RUN");
    }
  }
  return errors;
}

function main() {
  const file = process.argv[2];
  let body = process.env.BODY;
  if (file !== undefined) {
    try {
      body = readFileSync(file, "utf8");
    } catch (error) {
      console.error(`cannot read ${file}: ${error.message}`);
      process.exitCode = 2;
      return;
    }
  }
  if (body === undefined) {
    console.error("usage: BODY=<body> AUTHOR=<login> node scripts/check-pr-body.mjs, or give a file");
    process.exitCode = 2;
    return;
  }
  const author = process.env.AUTHOR ?? "";
  if (author.endsWith("[bot]")) {
    console.log(`PR body check skipped: the author ${author} is a bot.`);
    return;
  }
  const errors = checkPrBody(body, author);
  if (errors.length > 0) {
    for (const error of errors) console.error(`PR body: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("PR body is valid.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
