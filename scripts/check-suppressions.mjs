#!/usr/bin/env node
// Check the added lines of a change for suppressions and weakened gates. The
// rules are in coding/quality-gates.md, sections "Rules" and "Suppressions".
//
// These findings fail the check:
// - A blanket suppression: an ESLint directive with no rule, a bare noqa, a
//   ts-ignore or ts-nocheck, a type ignore with no code, pylint disable=all, a
//   C# pragma warning disable with no ID, or a NoWarn with no rule ID. A NoWarn
//   in Directory.Build.props or Directory.Build.targets is global, so it is
//   always blanket.
// - A suppression with a rule ID but no reason. The reason is text after the
//   rule list on the same line, or a comment on the line above. A shebang or a
//   preprocessor line is not a comment.
//
// A possible weaker gate is only a warning, because a reviewer decides. In
// GitHub Actions, each warning is also a warning annotation. It is a
// removed line and an added line in one hunk where the number after a known
// gate key gets smaller, or the number after max-warnings gets larger. The keys
// are --test-coverage-lines, -branches and -functions, --cov-fail-under,
// fail_under, fail-under and max-warnings in each file. The keys lines,
// branches, functions and statements count only in package.json, a Jest, Vitest
// or Vite config, and an nyc or c8 config. A gate that the change removes, or a
// number that is not directly after its key, gives no warning.
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
const GLOBAL_PROJECT_FILE = /(?:^|\/)Directory\.Build\.(?:props|targets)$/i;
const COVERAGE_CONFIG = /(?:^|\/)(?:package\.json|(?:jest|vitest|vite)\.config\.[cm]?[jt]s|\.nycrc(?:\.json|\.ya?ml)?|\.c8rc(?:\.json)?)$/i;
const HAS_TEXT = /[A-Za-z]/;

// Each rule returns null, or { name, blanket, reason } for a suppression on the line.
const RULES = [
  (line) => {
    const m = /(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?(?=\s|\*\/|$)(.*)$/.exec(line);
    if (!m) return null;
    const close = m[1].indexOf("*/");
    const rest = close === -1 ? m[1] : m[1].slice(0, close);
    const after = close === -1 ? "" : m[1].slice(close + 2);
    const split = rest.indexOf("--");
    const rules = split === -1 ? rest : rest.slice(0, split);
    const reason = (split === -1 ? "" : rest.slice(split + 2)) + (/\/\/|\/\*/.test(after) ? after : "");
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

// A NoWarn in one project file is allowed with rule IDs and a reason. The
// reason is an XML comment after the element.
function noWarn(path, line) {
  const m = /<NoWarn>(.*?)(?:<\/NoWarn>(.*))?$/.exec(line);
  if (!m) return null;
  const ids = m[1].replace(/\$\(NoWarn\)/g, "").split(/[;,\s]+/).filter(Boolean);
  const reason = /<!--/.test(m[2] ?? "") ? m[2] : "";
  return { name: "NoWarn", blanket: ids.length === 0 || GLOBAL_PROJECT_FILE.test(path), reason };
}

function suppression(path, line) {
  if (PROJECT_FILE.test(path)) {
    const found = noWarn(path, line);
    if (found) return found;
  }
  for (const rule of RULES) {
    const found = rule(line);
    if (found) return found;
  }
  return null;
}

// A directive has no space after "#". A comment such as "# if the stub changes" is a reason.
const PREPROCESSOR = /^#(?:if|ifdef|ifndef|elif|else|endif|define|undef|include|pragma|region|endregion|line|error|warning|nullable)\b/;

// A reason on the line above is a comment that is not itself a suppression.
function isReason(path, line) {
  if (line === null) return false;
  const text = line.trim();
  return /^(?:\/\/|#(?!!)|\/\*|\*|<!--|--)/.test(text) && !PREPROCESSOR.test(text) && HAS_TEXT.test(text) &&
    suppression(path, text) === null;
}

const NUMBER = `["']?\\s*[:=]?\\s*["']?(\\d+(?:\\.\\d+)?)`;
const GATE = new RegExp(`(?<![\\w-])(--test-coverage-(?:lines|branches|functions)|--cov-fail-under|--fail-under|fail[_-]under|--max-warnings|max-warnings)(?![\\w-])${NUMBER}`, "g");
const COVERAGE_GATE = new RegExp(`(?<![\\w-])["']?(--lines|--branches|--functions|--statements|lines|branches|functions|statements)(?![\\w-])${NUMBER}`, "g");

// Return a map of key to { key, value, n } for the first number of each gate key in `lines`.
function thresholds(path, lines) {
  const found = new Map();
  const patterns = COVERAGE_CONFIG.test(path) ? [GATE, COVERAGE_GATE] : [GATE];
  for (const line of lines) {
    for (const m of patterns.flatMap((pattern) => [...line.text.matchAll(pattern)])) {
      const key = m[1];
      if (!found.has(key.toLowerCase())) found.set(key.toLowerCase(), { key, value: Number(m[2]), n: line.n });
    }
  }
  return found;
}

const ESCAPES = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13 };

// Undo the C-style quotes that git puts around a path with special characters.
function unquote(path) {
  if (!path.startsWith('"') || !path.endsWith('"')) return path;
  const bytes = [];
  const body = path.slice(1, -1);
  for (let i = 0; i < body.length; i++) {
    if (body[i] !== "\\") {
      bytes.push(...Buffer.from(body[i]));
      continue;
    }
    const next = body[++i];
    if (/[0-7]/.test(next)) {
      bytes.push(parseInt(body.slice(i, i + 3), 8));
      i += 2;
    } else bytes.push(ESCAPES[next] ?? next.charCodeAt(0));
  }
  return Buffer.from(bytes).toString("utf8");
}

// Parse a unified diff. Return [{ path, hunks }]. Each hunk is a list of
// { kind, text, n }: kind is "+", "-" or " ", and n is the new line number.
export function parseDiff(text) {
  const files = [];
  let file = null;
  let hunk = null;
  let n = 0;
  let oldLeft = 0;
  let newLeft = 0;
  for (const line of text.split(/\r?\n/)) {
    if (hunk && (oldLeft > 0 || newLeft > 0)) {
      if (line[0] === "+" || line[0] === " ") {
        hunk.push({ kind: line[0], text: line.slice(1), n: n++ });
        newLeft--;
        if (line[0] === " ") oldLeft--;
      } else if (line[0] === "-") {
        hunk.push({ kind: "-", text: line.slice(1), n: null });
        oldLeft--;
      }
    } else if (line.startsWith("diff --git ")) {
      file = null;
      hunk = null;
    } else if (line.startsWith("+++ ")) {
      const path = unquote(line.slice(4).replace(/\t.*$/, ""));
      file = path === "/dev/null" ? null : { path: path.replace(/^b\//, ""), hunks: [] };
      if (file) files.push(file);
      hunk = null;
    } else if (line.startsWith("@@ ") && file) {
      const m = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (!m) continue;
      hunk = [];
      file.hunks.push(hunk);
      oldLeft = Number(m[1] ?? 1);
      n = Number(m[2]);
      newLeft = Number(m[3] ?? 1);
    }
  }
  return files;
}

const skipped = (path) => SKIP.has(path) || MARKDOWN.test(path);

// Return line i, joined with the next lines up to "</NoWarn>" when the line
// opens a NoWarn element and does not close it. With no end tag, return line i.
function withEndTag(lines, i) {
  const text = lines[i].text;
  if (!/<NoWarn>/.test(text) || /<\/NoWarn>/.test(text)) return text;
  const end = lines.findIndex((l, j) => j > i && /<\/NoWarn>/.test(l.text));
  return end === -1 ? text : lines.slice(i, end + 1).map((l) => l.text).join(" ");
}

// Add the findings and the warnings of one hunk to `result`. `lineAt(n)` returns new line n or null.
function checkHunk(result, path, hunk, lineAt) {
  const { errors, warnings } = result;
  const above = (n) => hunk.find((l) => l.kind !== "-" && l.n === n - 1)?.text ?? (n > 1 ? lineAt(n - 1) : null);
  const lines = hunk.filter((l) => l.kind !== "-");
  for (const [i, line] of lines.entries()) {
    if (line.kind !== "+") continue;
    result.lines++;
    const found = suppression(path, PROJECT_FILE.test(path) ? withEndTag(lines, i) : line.text);
    if (!found) continue;
    if (found.blanket) errors.push(`${path}:${line.n}: blanket suppression "${found.name}". Name the rule ID`);
    else if (!HAS_TEXT.test(found.reason) && !isReason(path, above(line.n))) {
      errors.push(`${path}:${line.n}: suppression "${found.name}" has no reason. Add it on the same line or the line above`);
    }
  }
  const before = thresholds(path, hunk.filter((l) => l.kind === "-"));
  for (const [id, now] of thresholds(path, hunk.filter((l) => l.kind === "+"))) {
    const old = before.get(id);
    if (!old || old.value === now.value) continue;
    const higherIsWeaker = id.includes("max-warnings");
    if (higherIsWeaker === now.value > old.value) {
      const verb = higherIsWeaker ? "raised" : "lowered";
      const message = `"${now.key}" is ${verb} from ${old.value} to ${now.value}`;
      warnings.push(`${path}:${now.n}: ${message}`);
      result.gates.push({ path, n: now.n, message });
    }
  }
}

const emptyResult = () => ({ errors: [], warnings: [], gates: [], lines: 0, files: 0 });

// Escape a value for a CI workflow command, as GitHub Actions reads it.
const escapeData = (text) => text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escapeProperty = (text) => escapeData(text).replace(/:/g, "%3A").replace(/,/g, "%2C");

function fileLines(root, path) {
  try {
    const text = readFileSync(join(root, path), "utf8");
    return text.includes("\0") ? null : text.split(/\r?\n/);
  } catch {
    return null;
  }
}

// Return { errors, warnings, lines, files } for the added lines of a unified
// diff. `lines` and `files` count what the check read. The line above an added
// line comes from the diff, or from the file under `root` (null: no file).
export function checkDiff(text, root, result = emptyResult()) {
  for (const { path, hunks } of parseDiff(text)) {
    if (skipped(path)) continue;
    result.files++;
    let lines;
    const lineAt = (n) => {
      if (root === null) return null;
      lines ??= fileLines(root, path) ?? [];
      return lines[n - 1] ?? null;
    };
    for (const hunk of hunks) checkHunk(result, path, hunk, lineAt);
  }
  return result;
}

// Return { errors, warnings, lines, files } for each line of each file. A file
// that cannot be read, or a binary file, is skipped.
export function checkFiles(root, paths, result = emptyResult()) {
  for (const path of paths) {
    if (skipped(path)) continue;
    const lines = fileLines(root, path);
    if (lines === null) continue;
    result.files++;
    const hunk = lines.map((text, i) => ({ kind: "+", text, n: i + 1 }));
    checkHunk(result, path, hunk, () => null);
  }
  return result;
}

// Return the findings for the change from the merge base of `base` to the working tree.
function checkGit(root, base) {
  const git = (...args) => execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 });
  const mergeBase = git("merge-base", base, "HEAD").trim();
  const diff = git("diff", "-U0", "--no-color", "--no-ext-diff", "--relative", mergeBase);
  const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
  return checkFiles(root, untracked, checkDiff(diff, root));
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
  let result;
  try {
    if (options.files !== null) result = checkFiles(root, options.files);
    else if (options.diff !== null) result = checkDiff(readFileSync(options.diff, "utf8"), root);
    else result = checkGit(root, options.base);
  } catch (err) {
    console.error(`cannot read the diff: ${(err.stderr || err.message).toString().trim()}`);
    return 2;
  }
  if (result.warnings.length > 0) console.log(["Review these possible weaker gates:", ...result.warnings].join("\n"));
  // In GitHub Actions, an annotation shows each warning on the change. Other systems print the text only.
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const { path, n, message } of result.gates) {
      console.log(`::warning file=${escapeProperty(path)},line=${n}::${escapeData(message)}`);
    }
  }
  if (result.errors.length > 0) {
    for (const message of result.errors) console.error(message);
    return 1;
  }
  if (result.lines === 0) console.log("No added lines. Nothing to check.");
  else {
    console.log(`${result.lines} added line(s) in ${result.files} file(s) have no blanket suppression and no suppression without a reason.`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
