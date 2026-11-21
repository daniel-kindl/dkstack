#!/usr/bin/env node
// Check the ADRs in docs/adr/. The rules are in architecture/adrs.md, section
// "Status and Affects".
//
// Format mode checks only the ADRs that the change adds. A new ADR has a
// "Status:" line (Proposed, Accepted or Superseded by NNNN) and an "Affects:"
// line with paths or globs. Each glob matches at least one file, and a
// Superseded by target exists. An old ADR without these lines never fails.
//
// Review mode (--review) lists the ADRs that a reviewer must read for the
// changed files: each Accepted ADR whose Affects match a changed file, and each
// old ADR with no Affects line. It always exits 0. It does not decide whether
// the code contradicts a decision. The reviewer decides that.
//
// The changed files come from git: the files that differ from the merge base
// of --base (default origin/main) and HEAD, plus untracked files. Give the list
// after "--" to skip git. A missing docs/adr/ folder is a pass.
// This file has no dependencies, so another repository can copy it.
// Usage: node scripts/check-adrs.mjs [--review] [--base <ref>] [root] [-- <file>...]
// Exit 0: pass. Exit 1: findings (format mode only). Exit 2: usage or read error.

import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = "docs/adr";
const ADR_FILE = /^docs\/adr\/[^/]+\.md$/;
const SKIP_DIRS = new Set([".git", "node_modules"]);
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
export async function checkNewAdrs(root, added) {
  const names = await adrNames(root);
  if (names === null) return { checked: 0, errors: [] };
  const paths = [...new Set(added)].filter((path) => ADR_FILE.test(path) && names.includes(path.slice(DIR.length + 1))).sort();
  const errors = [];
  let files = null;
  for (const path of paths) {
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
function changedFiles(root, base, addedOnly) {
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const mergeBase = git("merge-base", base, "HEAD").trim();
  const diff = git("diff", "--name-only", ...(addedOnly ? ["--diff-filter=A"] : []), mergeBase);
  const untracked = git("ls-files", "--others", "--exclude-standard");
  return [...diff.split("\n"), ...untracked.split("\n")].filter(Boolean);
}

function parseArgs(args) {
  const options = { review: false, base: "origin/main", root: ".", files: null };
  let rootSet = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      options.files = args.slice(i + 1);
      break;
    } else if (arg === "--review") options.review = true;
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
    console.error("usage: node scripts/check-adrs.mjs [--review] [--base <ref>] [root] [-- <file>...]");
    return 2;
  }
  const root = resolve(options.root);
  let files = options.files;
  if (files === null) {
    try {
      files = changedFiles(root, options.base, !options.review);
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
    const { checked, errors } = await checkNewAdrs(root, files);
    if (errors.length > 0) {
      for (const message of errors) console.error(message);
      return 1;
    }
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
