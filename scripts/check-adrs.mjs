#!/usr/bin/env node
// Check the ADRs in docs/adr/. The rules are in architecture/adrs.md, section
// "Status and Affects".
//
// Format mode checks only the ADRs that the change adds. A new ADR has a
// "Status:" line (Proposed, Accepted or Superseded by NNNN) and an "Affects:"
// line with paths or globs. Each glob matches at least one file, and a
// Superseded by target exists. An old ADR without these lines never fails.
//
// Format mode also checks the names and the changes. A new ADR file name is
// "NNNN-short-title.md", and no two ADRs share a number. A change to an
// Accepted ADR (or an ADR with no Status line) only adds lines, and each added
// line is under a "### Amendment YYYY-MM-DD" heading. Deleting such an ADR
// fails. Changing only the Status line to "Superseded by NNNN" is allowed. A
// Proposed ADR can change freely. The diff of docs/adr/ comes from git.
//
// Review mode (--review) lists the ADRs that a reviewer must read for the
// changed files: each Accepted ADR whose Affects match a changed file, and each
// old ADR with no Affects line. It always exits 0. It does not decide whether
// the code contradicts a decision. The reviewer decides that.
//
// The changed files come from git: the files that differ from the merge base
// of --base (default origin/main) and HEAD, plus untracked files. Give the list
// after "--" to skip git. Give the diff with "--diff <file>" (unified diff, as
// "git diff -U0 --no-renames" prints it) to skip git for the amendment check.
// Without "--", the added files then come from the diff. A missing docs/adr/ folder is a pass.
// This file has no dependencies, so another repository can copy it.
// Usage: node scripts/check-adrs.mjs [--review] [--base <ref>] [--diff <file>] [root] [-- <file>...]
// Exit 0: pass. Exit 1: findings (format mode only). Exit 2: usage or read error.

import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = "docs/adr";
const ADR_FILE = /^docs\/adr\/[^/]+\.md$/;
const SKIP_DIRS = new Set([".git", "node_modules"]);
const ADR_NAME = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const AMENDMENT = /^### Amendment \d{4}-\d{2}-\d{2}\s*$/;
const SUPERSEDED = /^(?:[-*] )?Status:\s*Superseded by \d{4}\s*$/;
const STATUS = /^(Proposed|Accepted|Superseded by (\d{4}))$/;

// Return the value and the line index of a "Name:" or "- Name:" line, or null.
function field(lines, name) {
  const pattern = new RegExp(`^(?:[-*] )?${name}:(.*)$`);
  for (let i = 0; i < lines.length; i++) {
    const m = pattern.exec(lines[i].trim());
    if (m) return { value: m[1].trim(), index: i };
  }
  return null;
}

const globs = (value) => value.split(",").map((g) => g.trim().replace(/^`|`$/g, "")).filter(Boolean);

// Turn a glob into a test. "**" matches across folders, "*" and "?" do not.
// A path with no wildcard matches the file, or each file under the folder.
export function globMatcher(glob) {
  const clean = glob.replace(/^\.\//, "").replace(/\/$/, "");
  if (!/[*?]/.test(clean)) return (path) => path === clean || path.startsWith(`${clean}/`);
  let source = "";
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === "*" && clean[i + 1] === "*") {
      source += clean[i + 2] === "/" ? "(?:.*/)?" : ".*";
      i += clean[i + 2] === "/" ? 2 : 1;
    } else if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  const pattern = new RegExp(`^${source}$`);
  return (path) => pattern.test(path);
}

async function listFiles(root, dir = "") {
  const found = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const path = dir === "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...(await listFiles(root, path)));
    } else if (entry.isFile()) {
      found.push(path);
    }
  }
  return found;
}

// Return the ADR file names in docs/adr/, or null if the folder does not exist.
async function adrNames(root) {
  try {
    return (await readdir(join(root, DIR))).filter((name) => name.endsWith(".md")).sort();
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

// Format mode. Return { checked, errors } for the added ADR files in `added`.
// Only a new ADR can fail the shared-number check.
export async function checkNewAdrs(root, added) {
  const names = await adrNames(root);
  if (names === null) return { checked: 0, errors: [] };
  const paths = [...new Set(added)].filter((path) => ADR_FILE.test(path) && names.includes(path.slice(DIR.length + 1))).sort();
  const errors = [];
  const owners = new Map();
  for (const name of names) {
    const number = ADR_NAME.exec(name)?.[1] ?? /^\d{4}(?=-)/.exec(name)?.[0];
    if (number) owners.set(number, [...(owners.get(number) ?? []), name]);
  }
  const addedNames = new Set(paths.map((path) => path.slice(DIR.length + 1)));
  for (const [number, list] of owners) {
    if (list.length > 1 && list.some((name) => addedNames.has(name))) errors.push(`${DIR}: ADRs ${list.join(" and ")} share the number ${number}`);
  }
  let files = null;
  for (const path of paths) {
    if (!ADR_NAME.test(path.slice(DIR.length + 1))) {
      errors.push(`${path}:1: the file name must be NNNN-short-title.md (four digits, lowercase words joined by hyphens)`);
    }
    const lines = (await readFile(join(root, path), "utf8")).split(/\r?\n/);
    const error = (index, message) => errors.push(`${path}:${index + 1}: ${message}`);
    const status = field(lines, "Status");
    if (!status) error(0, 'a new ADR must have a "Status:" line');
    else {
      const m = STATUS.exec(status.value);
      if (!m) error(status.index, `unknown Status "${status.value}". Use Proposed, Accepted or Superseded by NNNN`);
      else if (m[2] && !names.some((name) => name.startsWith(`${m[2]}-`))) {
        error(status.index, `Status names ADR ${m[2]}, which does not exist`);
      }
    }
    const affects = field(lines, "Affects");
    if (!affects) {
      error(0, 'a new ADR must have an "Affects:" line');
      continue;
    }
    const list = globs(affects.value);
    if (list.length === 0) {
      error(affects.index, '"Affects:" is empty');
      continue;
    }
    files ??= await listFiles(root);
    for (const glob of list) {
      const matches = globMatcher(glob);
      if (!files.some(matches)) error(affects.index, `the Affects glob "${glob}" matches no file`);
    }
  }
  return { checked: paths.length, errors };
}

// Split a unified diff into one entry for each file. A hunk header gives the line
// counts, so a content line that starts with "--" or "++" is not a file header.
export function parseDiff(text) {
  const entries = [];
  let entry = null;
  let line = 0;
  let oldLeft = 0;
  let newLeft = 0;
  for (const raw of text.split(/\r?\n/)) {
    if ((oldLeft > 0 || newLeft > 0) && !raw.startsWith("diff --git ")) {
      if (raw.startsWith("+")) entry.added.push({ line: line++, text: raw.slice(1) }), newLeft--;
      else if (raw.startsWith("-")) entry.removed.push(raw.slice(1)), oldLeft--;
      else if (raw === "" || raw.startsWith(" ")) line++, oldLeft--, newLeft--;
      continue;
    }
    if (raw.startsWith("diff --git ")) {
      oldLeft = newLeft = 0;
      entry = { path: raw.slice(raw.lastIndexOf(" b/") + 3), kind: "modified", added: [], removed: [] };
      entries.push(entry);
    } else if (!entry) continue;
    else if (raw.startsWith("new file mode") || raw === "--- /dev/null") entry.kind = "added";
    else if (raw.startsWith("deleted file mode") || raw === "+++ /dev/null") entry.kind = "deleted";
    else if (raw.startsWith("@@")) {
      const m = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(raw);
      oldLeft = Number(m?.[1] ?? 1);
      line = Number(m?.[2] ?? 1);
      newLeft = Number(m?.[3] ?? 1);
    }
  }
  return entries;
}

// Return the status value of the ADR before the change: a removed Status line, or the current one.
function oldStatus(entry, lines) {
  const removed = entry.removed.map((text) => field([text], "Status")).find(Boolean);
  if (removed) return removed.value;
  return entry.added.some((a) => /^(?:[-*] )?Status:/.test(a.text.trim())) ? null : (field(lines, "Status")?.value ?? null);
}

// Return the nearest heading at or above a line (1-based), ignoring deeper headings.
function headingAt(lines, line) {
  for (let i = line - 1; i >= 0; i--) {
    const m = /^(#{1,6}) /.exec(lines[i]);
    if (m && m[1].length <= 3) return lines[i];
  }
  return "";
}

// Format mode. Return { checked, errors } for the changes to existing ADRs in `diffText`.
export async function checkAdrChanges(root, diffText) {
  const errors = [];
  let checked = 0;
  for (const entry of parseDiff(diffText)) {
    if (!ADR_FILE.test(entry.path) || entry.kind === "added") continue;
    if (entry.kind === "deleted") {
      // The old text is not on disk. Read its Status from the removed lines.
      const status = oldStatus(entry, []);
      if (status !== null && status !== "Accepted") continue;
      checked++;
      errors.push(`${entry.path}:1: do not delete an Accepted ADR. Set it to "Superseded by NNNN" in place of this`);
      continue;
    }
    const lines = (await readFile(join(root, entry.path), "utf8")).split(/\r?\n/);
    const status = oldStatus(entry, lines);
    if (status !== null && status !== "Accepted") continue;
    checked++;
    const statusOnly = entry.added.length > 0 && entry.added.every((a) => SUPERSEDED.test(a.text.trim()))
      && entry.removed.every((text) => /^(?:[-*] )?Status:/.test(text.trim()));
    if (statusOnly) continue;
    for (const text of entry.removed) {
      errors.push(`${entry.path}:1: do not remove or change the line "${text.trim()}" of an Accepted ADR. Add an amendment`);
    }
    for (const added of entry.added.filter((a) => a.text.trim() !== "")) {
      if (!AMENDMENT.test(headingAt(lines, added.line))) {
        errors.push(`${entry.path}:${added.line}: an added line of an Accepted ADR must be under a "### Amendment YYYY-MM-DD" heading`);
      }
    }
  }
  return { checked, errors };
}

// Review mode. Return one line for each ADR that a reviewer must read for `changed`.
export async function adrsToRead(root, changed) {
  const names = await adrNames(root);
  if (names === null) return [];
  const result = [];
  for (const name of names) {
    const path = `${DIR}/${name}`;
    const lines = (await readFile(join(root, path), "utf8")).split(/\r?\n/);
    const status = field(lines, "Status");
    if (status && status.value !== "Accepted") continue;
    const affects = field(lines, "Affects");
    if (!affects) {
      result.push(`${path}: no Affects line. Read the title and the Decision section.`);
      continue;
    }
    const matchers = globs(affects.value).map(globMatcher);
    const hits = changed.filter((file) => matchers.some((matches) => matches(file)));
    if (hits.length > 0) result.push(`${path}: Accepted. Affects matches ${hits.join(", ")}.`);
  }
  return result;
}

// Return the files that differ from the merge base of `base` and HEAD.
function changedFiles(root, base, addedOnly, withDiff) {
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const mergeBase = git("merge-base", base, "HEAD").trim();
  const diff = git("diff", "--name-only", ...(addedOnly ? ["--diff-filter=A"] : []), "--no-renames", mergeBase);
  const untracked = git("ls-files", "--others", "--exclude-standard");
  const files = [...diff.split("\n"), ...untracked.split("\n")].filter(Boolean);
  if (!withDiff) return { files };
  return { files, diff: git("diff", "-U0", "--no-color", "--no-renames", mergeBase, "--", DIR) };
}

function parseArgs(args) {
  const options = { review: false, base: "origin/main", root: ".", files: null, diff: null };
  let rootSet = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      options.files = args.slice(i + 1);
      break;
    } else if (arg === "--review") options.review = true;
    else if (arg === "--diff" && i + 1 < args.length) options.diff = args[++i];
    else if (arg === "--base" && i + 1 < args.length) options.base = args[++i];
    else if (!arg.startsWith("-") && !rootSet) {
      options.root = arg;
      rootSet = true;
    } else return null;
  }
  return options;
}

async function main(args) {
  const options = parseArgs(args);
  if (!options) {
    console.error("usage: node scripts/check-adrs.mjs [--review] [--base <ref>] [--diff <file>] [root] [-- <file>...]");
    return 2;
  }
  const root = resolve(options.root);
  let files = options.files;
  let diff = "";
  if (options.diff !== null) {
    try {
      diff = await readFile(resolve(options.diff), "utf8");
    } catch (err) {
      console.error(`cannot read the diff: ${err.message}`);
      return 2;
    }
    const entries = parseDiff(diff);
    files ??= entries.filter((e) => options.review || e.kind === "added").map((e) => e.path);
  }
  if (files === null) {
    try {
      const changed = changedFiles(root, options.base, !options.review, !options.review);
      files = changed.files;
      diff = changed.diff ?? "";
    } catch (err) {
      console.error(`cannot list the changed files: ${(err.stderr || err.message).toString().trim()}`);
      return 2;
    }
  }
  try {
    if (options.review) {
      const lines = await adrsToRead(root, files);
      console.log(lines.length > 0 ? lines.join("\n") : "No ADR to read for these changes.");
      return 0;
    }
    const names = await checkNewAdrs(root, files);
    const changes = await checkAdrChanges(root, diff);
    const checked = names.checked;
    const errors = [...names.errors, ...changes.errors];
    if (errors.length > 0) {
      for (const message of errors) console.error(message);
      return 1;
    }
    if (options.files !== null && options.diff === null) {
      console.log("Amendment check NOT RUN. Give the diff with --diff <file>.");
    }
    if (changes.checked > 0) console.log(`${changes.checked} changed ADR(s) only add amendments.`);
    console.log(checked > 0 ? `${checked} new ADR(s) have Status and Affects.` : "No new ADR. Nothing to check.");
    return 0;
  } catch (err) {
    console.error(`cannot read ${DIR}: ${err.message}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
