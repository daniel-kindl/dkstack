#!/usr/bin/env node
// Check the body of a pull request: an issue link with a number, an Evidence
// section, one Observability line, and a valid Visual verification line.
// The rules are in skills/write-pr/SKILL.md and workflow/review-and-merge.md.
// A PR from a bot account is skipped.
// In GitHub Actions, use --event to read the body and login from GITHUB_EVENT_PATH.
// Usage: BODY="<body>" AUTHOR="<login>" node scripts/check-pr-body.mjs
//    or: node scripts/check-pr-body.mjs <file>

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { readPullRequest } from "./pr-event.mjs";

const ISSUE_LINK =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+(?:(?:[\w.-]+\/[\w.-]+)?#\d+|https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+)/i;
const EVIDENCE = /^## Evidence[ \t]*$/m;
const LINE = (name) => new RegExp(`^[ \\t]*(?:[-*][ \\t]+)?${name}:[ \\t]*(.*)$`, "gm");
const OBSERVABILITY_PLACEHOLDERS = ["<events added or changed>", "<reason>"];
const VISUAL_START = /^(?:PASS|FAIL|NOT RUN)\b/;

const ISSUE_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+$/;
// A removed code span or link becomes this mark. It is not a space, so the text
// on each side of it does not join into a new closing reference.
const GAP = "\uFFFC";
const ESCAPE = /\\[!-/:-@[-`{-~]/g;
// A code span closes on a run of backticks of the same length. It does not pass a blank line.
// An escaped backtick does not open a span. A backslash in a span is literal.
const CODE_SPAN = /(?<!(?<!\\)(?:\\\\)*\\)(?<!`)(`+)(?!`)(?:(?!\n[ \t]*\n)[\s\S])*?(?<!`)\1(?!`)/g;
// A character of a label or of link text. A link does not go across a blank line.
const INNER = String.raw`(?:(?!\n[ \t]*\n)[^\[\]])`;
const TITLE = String.raw`(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\))`;
const DEFINITION = new RegExp(
  String.raw`^[ ]{0,3}\[(${INNER}+)\]:[ \t]*(<[^>\n]*>|\S+)(?:[ \t]+${TITLE})?[ \t]*$`,
  "gm",
);
// The text of a link can hold one level of brackets, and a destination one level of parentheses.
const TEXT = String.raw`((?:${INNER}|\[${INNER}*\])*)`;
const DESTINATION = String.raw`(<[^>\n]*>|(?:[^\s()]|\([^\s()]*\))*)(?:\s+${TITLE})?\s*`;
const INLINE_LINK = new RegExp(String.raw`!?\[${TEXT}\]\(\s*${DESTINATION}\)`, "g");
const FULL_REFERENCE = new RegExp(String.raw`!?\[${TEXT}\]\[(${INNER}+)\]`, "g");
const REFERENCE_LINK = new RegExp(String.raw`!?\[(${INNER}*)\](?:\[(${INNER}*)\])?`, "g");

const label = (text) => text.trim().replace(/\s+/g, " ").toLowerCase();
const unwrap = (destination) => destination.replace(/^<(.*)>$/, "$1");
// A link to an issue keeps its URL. Another link is not prose.
const linkText = (destination) => (ISSUE_URL.test(destination) ? destination : GAP);

// Return the prose of the body for the issue link check. Inline code does not count. A link
// counts only by its destination, not by its label.
function prose(body) {
  const text = body.replace(CODE_SPAN, GAP).replace(ESCAPE, GAP);
  const definitions = new Map();
  const withoutDefinitions = text.replace(DEFINITION, (_, name, destination) => {
    if (!definitions.has(label(name))) definitions.set(label(name), unwrap(destination));
    return GAP;
  });
  return withoutDefinitions
    .replace(INLINE_LINK, (_, _text, destination) => linkText(unwrap(destination)))
    .replace(FULL_REFERENCE, (match, _text, name) =>
      definitions.has(label(name)) ? linkText(definitions.get(label(name))) : match)
    .replace(REFERENCE_LINK, (match, first, second) => {
      const name = label(second === undefined || second.trim() === "" ? first : second);
      return definitions.has(name) ? linkText(definitions.get(name)) : match;
    });
}

const values = (body, name) => [...body.matchAll(LINE(name))].map((m) => m[1].trim());

// Return the list of problems. An empty list means a valid body.
export function checkPrBody(rawBody, author = "") {
  if (author.endsWith("[bot]")) return [];
  // A template comment or a code block can hold example lines. They are not part of the body.
  const body = rawBody
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, "");
  const errors = [];
  if (!ISSUE_LINK.test(prose(body))) {
    errors.push("the body must link an issue with a number, for example \"Closes #12\"");
  }
  if (!EVIDENCE.test(body)) errors.push("the body must have an \"## Evidence\" section");

  const observability = values(body, "Observability");
  if (observability.length !== 1) {
    errors.push('the body must have one "Observability:" line');
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
  let author = process.env.AUTHOR ?? "";
  if (file === "--event") {
    const pr = readPullRequest((value) =>
      (value.body === null || typeof value.body === "string") && typeof value.user?.login === "string");
    if (!pr) {
      process.exitCode = 2;
      return;
    }
    body = pr.body ?? "";
    author = pr.user.login;
  } else if (file !== undefined) {
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
  if (author.endsWith("[bot]")) {
    console.log("PR body check skipped for a bot.");
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
