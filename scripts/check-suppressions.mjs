#!/usr/bin/env node
// Check the added lines of a change for suppressions and weakened gates. The
// rules are in coding/quality-gates.md, sections "Rules" and "Suppressions".
//
// It finds three things:
// - A blanket suppression: an ESLint directive with no rule, a bare noqa, a
//   ts-ignore or ts-nocheck, a type ignore with no code, pylint disable=all, a
//   NoWarn in a .NET project file, or a C# pragma warning disable with no ID.
// - A suppression with a rule ID but no reason. The reason is text after the
//   rule list on the same line, or a comment on the line above.
// - A weakened gate: in one hunk, a removed line and an added line where the
//   number next to coverage or threshold gets smaller, or the number next to
//   max-warnings gets larger.
//
// It does not check this file, its test file or Markdown files. These files
// contain the patterns as examples, and a suppression in Markdown has no effect.
//
// The diff comes from git: "git diff -U0" against the merge base of --base
// (default origin/main) and HEAD, plus each line of each untracked file. Give
// a unified diff with --diff <file> to skip git. Give files after "--" to check
// each line of these files. Both forms are for tests and for other tools.
// This file has no dependencies, so another repository can copy it.
// Usage: node scripts/check-suppressions.mjs [--base <ref>] [--diff <file>] [root] [-- <file>...]
// Exit 0: pass. Exit 1: findings. Exit 2: usage or read error.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SKIP = new Set(["scripts/check-suppressions.mjs", "test/check-suppressions.test.mjs"]);
const MARKDOWN = /\.(?:md|markdown)$/i;
const PROJECT_FILE = /\.(?:csproj|vbproj|fsproj|props|targets)$/i;
const HAS_TEXT = /[A-Za-z]/;

// Each rule returns null, or { name, blanket, reason } for a suppression on the line.
const RULES = [
  (line) => {
    const m = /(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?(?=\s|\*\/|$)(.*)$/.exec(line);
    if (!m) return null;
    const rest = m[1].replace(/\*\/.*$/, "");
    const split = rest.indexOf("--");
    const rules = split === -1 ? rest : rest.slice(0, split);
    const reason = split === -1 ? "" : rest.slice(split + 2);
    return { name: "eslint-disable", blanket: rules.trim() === "", reason };
  },
  (line) => {
    const m = /(?:\/\/|\/\*)\s*@ts-(ignore|nocheck)\b/.exec(line);
    return m ? { name: `@ts-${m[1]}`, blanket: true, reason: "" } : null;
  },
  (line) => {
    const m = /#\s*noqa\b(?::\s*([A-Z]+\d+(?:\s*,\s*[A-Z]+\d+)*))?(.*)$/i.exec(line);
    return m ? { name: "noqa", blanket: m[1] === undefined, reason: m[2] } : null;
  },
  (line) => {
    const m = /#\s*type:\s*ignore\b(\[[^\]]*\])?(.*)$/.exec(line);
    return m ? { name: "type: ignore", blanket: m[1] === undefined, reason: m[2] } : null;
  },
  (line) => {
    const m = /#\s*pylint:\s*disable(?:-next)?\s*=\s*([\w-]+(?:\s*,\s*[\w-]+)*)(.*)$/.exec(line);
    if (!m) return null;
    const ids = m[1].split(",").map((id) => id.trim());
    return { name: "pylint: disable", blanket: ids.includes("all"), reason: m[2] };
  },
  (line) => {
    const m = /^\s*#\s*pragma\s+warning\s+disable\b(.*)$/.exec(line);
    if (!m) return null;
    const ids = /^\s*([A-Za-z]*\d+(?:\s*,\s*[A-Za-z]*\d+)*)(.*)$/.exec(m[1]);
    return { name: "#pragma warning disable", blanket: ids === null, reason: ids ? ids[2] : "" };
  },
];

function suppression(path, line) {
  if (PROJECT_FILE.test(path) && /<NoWarn>/.test(line)) return { name: "NoWarn", blanket: true, reason: "" };
  for (const rule of RULES) {
    const found = rule(line);
    if (found) return found;
  }
  return null;
}

// A reason on the line above is a comment that is not itself a suppression.
function isReason(path, line) {
  if (line === null) return false;
  const text = line.trim();
  return /^(?:\/\/|#|\/\*|\*|<!--|--)/.test(text) && HAS_TEXT.test(text) && suppression(path, text) === null;
}

const THRESHOLD = /([\w.-]*(?:coverage|threshold|max-warnings)[\w.-]*)["']?\s*[:=]?\s*["']?(\d+(?:\.\d+)?)/gi;

// Return a map of key to { value, n } for the first number of each key in `lines`.
function thresholds(lines) {
  const found = new Map();
  for (const line of lines) {
    for (const m of line.text.matchAll(THRESHOLD)) {
      const key = m[1];
      if (!found.has(key.toLowerCase())) found.set(key.toLowerCase(), { key, value: Number(m[2]), n: line.n });
    }
  }
  return found;
}

// Parse a unified diff. Return [{ path, hunks }]. Each hunk is a list of
// { kind, text, n }: kind is "+", "-" or " ", and n is the new line number.
export function parseDiff(text) {
  const files = [];
  let file = null;
  let hunk = null;
  let n = 0;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      file = null;
      hunk = null;
    } else if (line.startsWith("+++ ")) {
      const path = line.slice(4).replace(/\t.*$/, "");
      file = path === "/dev/null" ? null : { path: path.replace(/^b\//, ""), hunks: [] };
      if (file) files.push(file);
      hunk = null;
    } else if (line.startsWith("@@ ") && file) {
      const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      hunk = [];
      file.hunks.push(hunk);
      n = m ? Number(m[1]) : 1;
    } else if (hunk && (line[0] === "+" || line[0] === " ")) {
      hunk.push({ kind: line[0], text: line.slice(1), n: n++ });
    } else if (hunk && line[0] === "-") {
      hunk.push({ kind: "-", text: line.slice(1), n: null });
    }
  }
  return files;
}

const skipped = (path) => SKIP.has(path) || MARKDOWN.test(path);

// Return the findings of one hunk. `lineAt(n)` returns new line n or null.
function checkHunk(path, hunk, lineAt) {
  const errors = [];
  const above = (n) => hunk.find((l) => l.kind !== "-" && l.n === n - 1)?.text ?? (n > 1 ? lineAt(n - 1) : null);
  for (const line of hunk.filter((l) => l.kind === "+")) {
    const found = suppression(path, line.text);
    if (!found) continue;
    if (found.blanket) errors.push(`${path}:${line.n}: blanket suppression "${found.name}". Name the rule ID`);
    else if (!HAS_TEXT.test(found.reason) && !isReason(path, above(line.n))) {
      errors.push(`${path}:${line.n}: suppression "${found.name}" has no reason. Add it on the same line or the line above`);
    }
  }
  const before = thresholds(hunk.filter((l) => l.kind === "-"));
  for (const [id, now] of thresholds(hunk.filter((l) => l.kind === "+"))) {
    const old = before.get(id);
    if (!old || old.value === now.value) continue;
    const higherIsWeaker = id.includes("max-warnings");
    if (higherIsWeaker === now.value > old.value) {
      const verb = higherIsWeaker ? "raised" : "lowered";
      errors.push(`${path}:${now.n}: "${now.key}" is ${verb} from ${old.value} to ${now.value}`);
    }
  }
  return errors;
}

function fileLines(root, path) {
  try {
    const text = readFileSync(join(root, path), "utf8");
    return text.includes("\0") ? null : text.split(/\r?\n/);
  } catch {
    return null;
  }
}

// Return the findings for the added lines of a unified diff. The line above an
// added line comes from the diff, or from the file under `root` (null: no file).
export function checkDiff(text, root) {
  const errors = [];
  for (const { path, hunks } of parseDiff(text)) {
    if (skipped(path)) continue;
    let lines;
    const lineAt = (n) => {
      if (root === null) return null;
      lines ??= fileLines(root, path) ?? [];
      return lines[n - 1] ?? null;
    };
    for (const hunk of hunks) errors.push(...checkHunk(path, hunk, lineAt));
  }
  return errors;
}

// Return the findings for each line of each file. A file that cannot be read is skipped.
export function checkFiles(root, paths) {
  const errors = [];
  for (const path of paths) {
    if (skipped(path)) continue;
    const lines = fileLines(root, path);
    if (lines === null) continue;
    const hunk = lines.map((text, i) => ({ kind: "+", text, n: i + 1 }));
    errors.push(...checkHunk(path, hunk, () => null));
  }
  return errors;
}

// Return the findings for the change from the merge base of `base` to the working tree.
function checkGit(root, base) {
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 });
  const mergeBase = git("merge-base", base, "HEAD").trim();
  const diff = git("diff", "-U0", "--no-color", "--no-ext-diff", "--relative", mergeBase);
  const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
  return [...checkDiff(diff, root), ...checkFiles(root, untracked)];
}

function parseArgs(args) {
  const options = { base: "origin/main", diff: null, root: ".", files: null };
  let rootSet = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      options.files = args.slice(i + 1);
      break;
    } else if (arg === "--base" && i + 1 < args.length) options.base = args[++i];
    else if (arg === "--diff" && i + 1 < args.length) options.diff = args[++i];
    else if (!arg.startsWith("-") && !rootSet) {
      options.root = arg;
      rootSet = true;
    } else return null;
  }
  return options;
}

function main(args) {
  const options = parseArgs(args);
  if (!options) {
    console.error("usage: node scripts/check-suppressions.mjs [--base <ref>] [--diff <file>] [root] [-- <file>...]");
    return 2;
  }
  const root = resolve(options.root);
  let errors;
  try {
    if (options.files !== null) errors = checkFiles(root, options.files);
    else if (options.diff !== null) errors = checkDiff(readFileSync(options.diff, "utf8"), root);
    else errors = checkGit(root, options.base);
  } catch (err) {
    console.error(`cannot read the diff: ${(err.stderr || err.message).toString().trim()}`);
    return 2;
  }
  if (errors.length > 0) {
    for (const message of errors) console.error(message);
    return 1;
  }
  console.log("No blanket suppression, suppression without a reason or weakened gate.");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
