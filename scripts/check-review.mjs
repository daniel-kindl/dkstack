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
const VERDICT = new RegExp(`\\b(${VERDICTS.join("|")})\\b`, "g");
const HAS_VERDICT = new RegExp(VERDICT.source);
const SHA = /(?<![0-9A-Za-z])[0-9a-f]{40}(?![0-9A-Za-z])/;
// A SHA is the head SHA when the words before it name the head or the line has the verdict. A base or an earlier head does not count.
const HEAD_WORD = /\bhead\b/i;
const OTHER_COMMIT = /\b(?:earlier|old|previous|base)\b/i;
// A finding starts with its ID. A list marker, a heading marker, a severity word, "Finding",
// a bracket or bold can come before the ID. A line with none of these starts a paragraph.
const ID = /^(\s*)(?:([-*+]|\d+[.)])\s+|(#{1,6})\s+)?(?:(?:\*\*)?(?:[Bb]locking|[Hh]igh|[Mm]edium|[Ll]ow)\s+)?(?:[Ff]inding\s+)?[[(]?(?:\*\*)?`?([BHMLN]\d+)\b/;
const TABLE_ITEM = /^\s*\|\s*(?:\*\*)?`?([BHMLN]\d+)\b/;
// A path with an extension, then a colon and a line number or a range.
// A finding on the pull request text or on a commit has no file. It names that place instead.
const FILE_LINE = /[\w@./-]+\.[A-Za-z0-9]+:\d+|\b(?:pull request|PR) (?:title|body)\b|\bcommit [0-9a-f]{7,40}\b/i;
// The status of a finding is in its first sentence: "H1, title: **fixed**." or "H1 title **open**."
// Only a status word that ends the clause counts, so "fixed-size" and "to be fixed" do not.
const STATUS = /(?:[:)]\s*\**|\*\*)(fixed|open)\**(?=[.\s,;]|$)/i;
// In a table, the cell after the ID can be the status.
const TABLE_STATUS = /^\s*\|[^|]*\|\s*\**(fixed|open)\b(?![-\w])/i;
// A stated question for the owner starts a line, as in "Question: which scope?".
const QUESTION = /^\s*(?:[-*+]\s+)?\**questions?\**:/im;

// True when a 40-character SHA follows words that name the head, as in "Head SHA: <sha>".
// The words between the previous SHA and this SHA are the context.
function namesHead(line) {
  let before = 0;
  for (const match of line.matchAll(new RegExp(SHA.source, "g"))) {
    const context = line.slice(before, match.index);
    if (HEAD_WORD.test(context) && !OTHER_COMMIT.test(context)) return true;
    before = match.index + 40;
  }
  return false;
}

// Find each finding. A heading item runs to the next heading. A list item runs
// to the next line that is not indented under it. A paragraph item runs to the next
// blank line. A table item is one row.
function findFindings(lines) {
  const findings = [];
  const indentOf = (line) => line.length - line.trimStart().length;
  lines.forEach((line, start) => {
    let id;
    let end = start + 1;
    const table = TABLE_ITEM.exec(line);
    const match = table ? null : ID.exec(line);
    if (table) {
      id = table[1];
    } else if (match) {
      const [, indent, marker, heading] = match;
      id = match[4];
      if (heading) {
        while (end < lines.length && !/^#{1,6}\s/.test(lines[end])) end++;
      } else if (marker) {
        while (end < lines.length && (lines[end].trim() === "" || indentOf(lines[end]) > indent.length)) {
          end++;
        }
      } else if (start === 0 || lines[start - 1].trim() === "") {
        while (end < lines.length && lines[end].trim() !== "") end++;
      } else {
        return;
      }
    } else {
      return;
    }
    const sentence = line.slice(line.indexOf(id) + id.length).split(/\.\s/)[0];
    const status = (STATUS.exec(sentence) ?? TABLE_STATUS.exec(line))?.[1].toLowerCase();
    // The first item with an ID defines the finding. A later item only refers to it.
    // In a re-review, a new finding heading can reuse the ID of a status line.
    const reuse = !status && Boolean(match?.[3]);
    const same = findings.filter((finding) => finding.id === id);
    if (same.some((finding) => Boolean(finding.status) === Boolean(status))) return;
    if (same.length > 0 && !reuse) return;
    findings.push({ id, status, text: lines.slice(start, end).join("\n") });
  });
  return findings;
}

// Return the list of problems. An empty list means that the review is valid.
export function checkReview(text) {
  const lines = text.split(/\r?\n/);
  const head = lines.slice(0, HEAD_LINES).join("\n");
  const problems = [];

  const verdicts = [...new Set([...head.matchAll(VERDICT)].map((match) => match[1]))];
  const verdict = verdicts[0];
  if (verdicts.length !== 1) {
    problems.push(`the first ${HEAD_LINES} lines must have one verdict: ${VERDICTS.join(", ")}`);
  }
  const headLine = lines.slice(0, HEAD_LINES).some((line) => (HAS_VERDICT.test(line) && SHA.test(line)) ||
    namesHead(line));
  if (!headLine) {
    problems.push(`the first ${HEAD_LINES} lines must have the full 40-character head SHA on a line that names the head`);
  }

  const findings = findFindings(lines);
  for (const { id, status, text: item } of findings) {
    // The earlier review gave the location of a finding that a status line names.
    if (!status && !FILE_LINE.test(item)) {
      problems.push(`finding ${id} has no file:line, for example scripts/a.mjs:12`);
    }
  }

  const open = findings.filter(({ status }) => status !== "fixed");
  if (verdict === "APPROVE-RECOMMENDED") {
    for (const { id } of open) {
      problems.push(`finding ${id} is not marked fixed, so APPROVE-RECOMMENDED fails`);
    }
  } else if (verdict === "CHANGES-REQUESTED" && open.length === 0) {
    problems.push("CHANGES-REQUESTED needs at least one finding that is not marked fixed");
  } else if (verdict === "BLOCKED") {
    const blocking = findings.some(({ id }) => id.startsWith("B"));
    if (!blocking && !QUESTION.test(text)) {
      problems.push("BLOCKED needs a Blocking finding (B1) or a line that starts with Question:");
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
