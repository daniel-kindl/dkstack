#!/usr/bin/env node
// Check the review file that the code-review skill writes before it posts.
// The reviewer runs this script on the file. The file is not in the repository,
// so the validate workflow does not run it.
// Each finding names a file:line. A finding on the pull request text or on a commit
// names "pull request title", "pull request body" (or "PR title", "PR body") or "commit <sha>".
// A re-review can list an earlier finding as a status line, "H1, title: fixed." or
// "H1, title: open.". That line needs no file:line, and an open line is an open finding.
// Usage: node scripts/check-review.mjs <file>
// Exit code: 0 for a valid review, 1 for problems, 2 for a usage or read error.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const VERDICTS = ["APPROVE-RECOMMENDED", "CHANGES-REQUESTED", "BLOCKED"];
// The verdict and the head SHA must be in the first lines of the file.
const HEAD_LINES = 10;
const VERDICT = new RegExp(`\\b(${VERDICTS.join("|")})\\b`);
const SHA = /(?<![0-9A-Za-z])[0-9a-f]{40}(?![0-9A-Za-z])/;
// A finding ID starts a list item, a heading or a table row.
const ID = "(?:\\*\\*)?`?([BHML]\\d+)\\b";
const HEADING_ITEM = new RegExp(`^#{1,6}\\s+${ID}`);
const LIST_ITEM = new RegExp(`^(\\s*)(?:[-*+]|\\d+[.)])\\s+${ID}`);
const TABLE_ITEM = new RegExp(`^\\s*\\|\\s*${ID}`);
// A path with an extension, then a colon and a line number or a range.
// A finding on the pull request text or on a commit has no file. It names that place instead.
const FILE_LINE = /[\w@./-]+\.[A-Za-z0-9]+:\d+|\b(?:pull request|PR) (?:title|body)\b|\bcommit [0-9a-f]{7,40}\b/i;
const FIXED = /\bfixed\b/i;
// A re-review gives the status of an earlier finding in its first sentence: "H1, title: **fixed**."
const STATUS = /[:)]\s*\**(fixed|open)\b/i;
// In a table, the cell after the ID can be the status.
const TABLE_STATUS = /^\s*\|[^|]*\|\s*\**(fixed|open)\**\s*\|/i;
const NOT_FIXED = /\b(?:not|never)\s+fixed\b/i;
const QUESTION = /\bquestion\b|\?\s*$/im;

// Find each finding. A heading item runs to the next heading. A list item runs
// to the next line that is not indented under it. A table item is one row.
function findFindings(lines) {
  const findings = [];
  const indentOf = (line) => line.length - line.trimStart().length;
  lines.forEach((line, start) => {
    let match;
    let end = start + 1;
    if ((match = HEADING_ITEM.exec(line))) {
      while (end < lines.length && !/^#{1,6}\s/.test(lines[end])) end++;
    } else if ((match = LIST_ITEM.exec(line))) {
      const indent = match[1].length;
      while (end < lines.length && (lines[end].trim() === "" || indentOf(lines[end]) > indent)) {
        end++;
      }
      match = [match[0], match[2]];
    } else if (!(match = TABLE_ITEM.exec(line))) {
      return;
    }
    const id = match[match.length - 1];
    // The first item with an ID defines the finding. A later item only refers to it.
    if (findings.some((finding) => finding.id === id)) return;
    const sentence = line.slice(line.indexOf(id) + id.length).split(/\.\s/)[0];
    const status = (STATUS.exec(sentence) ?? TABLE_STATUS.exec(line))?.[1].toLowerCase();
    findings.push({
      id,
      status,
      first: line,
      text: lines.slice(start, end).join("\n"),
    });
  });
  return findings;
}

// Return the list of problems. An empty list means that the review is valid.
export function checkReview(text) {
  const lines = text.split(/\r?\n/);
  const head = lines.slice(0, HEAD_LINES).join("\n");
  const problems = [];

  const verdict = VERDICT.exec(head)?.[1];
  if (!verdict) {
    problems.push(`the first ${HEAD_LINES} lines must have one verdict: ${VERDICTS.join(", ")}`);
  }
  if (!SHA.test(head)) {
    problems.push(`the first ${HEAD_LINES} lines must have the full 40-character head SHA`);
  }

  const findings = findFindings(lines);
  for (const { id, status, text: item } of findings) {
    // The earlier review gave the location of a finding that a status line names.
    if (!status && !FILE_LINE.test(item)) {
      problems.push(`finding ${id} has no file:line, for example scripts/a.mjs:12`);
    }
  }

  if (verdict === "APPROVE-RECOMMENDED") {
    for (const { id, status, first } of findings) {
      const fixed = status ? status === "fixed" : FIXED.test(first) && !NOT_FIXED.test(first);
      if (!fixed) {
        problems.push(`finding ${id} is not marked fixed, so APPROVE-RECOMMENDED fails`);
      }
    }
  } else if (verdict === "CHANGES-REQUESTED" && findings.length === 0) {
    problems.push("CHANGES-REQUESTED needs at least one finding");
  } else if (verdict === "BLOCKED") {
    const blocking = findings.some(({ id }) => id.startsWith("B"));
    if (!blocking && !QUESTION.test(text)) {
      problems.push("BLOCKED needs a Blocking finding (B1) or a stated question");
    }
  }
  return problems;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/check-review.mjs <file>");
    process.exitCode = 2;
    return;
  }
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    console.error(`cannot read ${file}: ${error.message}`);
    process.exitCode = 2;
    return;
  }
  const problems = checkReview(text);
  for (const problem of problems) console.error(`${file}: ${problem}`);
  if (problems.length > 0) {
    process.exitCode = 1;
    return;
  }
  console.log(`${file}: the review file is valid.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
