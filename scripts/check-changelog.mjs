#!/usr/bin/env node
// Check that CHANGELOG.md has a "## [X.Y.Z]" entry for the package.json version,
// and the "## [Unreleased]" heading line and "[Unreleased]:" compare link that
// scripts/release.mjs needs.
//
// Diff mode (--diff) checks the change. A change that adds a page in a section
// folder or a skills/<name>/SKILL.md must also change the "## [Unreleased]"
// text. The base is the merge base of --base (default origin/main) and HEAD.
// A section is a top-level folder with an index.md. skills/ is not a section.
// Usage: node scripts/check-changelog.mjs [--diff [--base <ref>]] [root]
// Exit 0: pass. Exit 1: findings. Exit 2: usage or git error.

import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function checkChangelog(root) {
  const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  if (typeof version !== "string" || version === "") {
    return ["package.json: the version field is missing"];
  }
  let text;
  try {
    text = await readFile(join(root, "CHANGELOG.md"), "utf8");
  } catch {
    return ["CHANGELOG.md: the file does not exist"];
  }
  const errors = [];
  if (!text.split(/\r?\n/).includes("## [Unreleased]")) errors.push('CHANGELOG.md: add a "## [Unreleased]" heading line');
  if (!/^\[Unreleased\]: /m.test(text)) errors.push('CHANGELOG.md: add an "[Unreleased]:" compare link');
  const entry = new RegExp(`^## \\[${escape(version)}\\](?:\\s|$)`, "m");
  if (!entry.test(text)) errors.push(`CHANGELOG.md: add a "## [${version}]" entry for the package.json version ${version}`);
  return errors;
}

// Return the lines of the "## [Unreleased]" section, up to the next "## " heading.
function unreleased(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.indexOf("## [Unreleased]");
  if (start === -1) return "";
  let end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  if (end === -1) end = lines.length;
  return lines.slice(start + 1, end).join("\n").trim();
}

// Return the paths in `added` that are a page of a section or a skill.
async function addedPages(root, added) {
  const sections = new Map();
  const isSection = async (dir) => {
    if (!sections.has(dir)) {
      sections.set(dir, dir !== "skills" && (await readFile(join(root, dir, "index.md"), "utf8").then(() => true, () => false)));
    }
    return sections.get(dir);
  };
  const pages = [];
  for (const path of [...new Set(added)].sort()) {
    const parts = path.split("/");
    if (parts.length === 3 && parts[0] === "skills" && parts[2] === "SKILL.md") pages.push(path);
    else if (parts.length === 2 && parts[1].endsWith(".md") && (await isSection(parts[0]))) pages.push(path);
  }
  return pages;
}

// Diff mode. `added` is the list of added files and `baseText` is the CHANGELOG
// text at the merge base, or null. Return one message for each page that needs
// an Unreleased entry, or an empty list.
export async function checkChangelogDiff(root, added, baseText) {
  const pages = await addedPages(root, added);
  if (pages.length === 0) return [];
  let text = "";
  try {
    text = await readFile(join(root, "CHANGELOG.md"), "utf8");
  } catch {
    // A missing file counts as an empty section.
  }
  if (unreleased(text) !== unreleased(baseText ?? "")) return [];
  return pages.map((page) => `${page}: this change adds the page. Add a line under "## [Unreleased]" in CHANGELOG.md.`);
}

function parseArgs(args) {
  const options = { diff: false, base: "origin/main", root: "." };
  let rootSet = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--diff") options.diff = true;
    else if (arg === "--base" && i + 1 < args.length) options.base = args[++i];
    else if (!arg.startsWith("-") && !rootSet) {
      options.root = arg;
      rootSet = true;
    } else return null;
  }
  return options;
}

// Return the added files and the base CHANGELOG text. Throw if git fails.
function gitChange(root, base) {
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const mergeBase = git("merge-base", base, "HEAD").trim();
  const added = [...git("diff", "--name-only", "--diff-filter=A", mergeBase).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean);
  let baseText = null;
  try {
    baseText = git("show", `${mergeBase}:CHANGELOG.md`);
  } catch {
    // The base has no CHANGELOG.md.
  }
  return { added, baseText };
}

async function main(args) {
  const options = parseArgs(args);
  if (!options) {
    console.error("usage: node scripts/check-changelog.mjs [--diff [--base <ref>]] [root]");
    return 2;
  }
  const root = resolve(options.root);
  let errors;
  if (options.diff) {
    let change;
    try {
      change = gitChange(root, options.base);
    } catch (err) {
      console.error(`cannot list the changed files: ${(err.stderr || err.message).toString().trim()}`);
      return 2;
    }
    errors = await checkChangelogDiff(root, change.added, change.baseText);
  } else {
    errors = await checkChangelog(root);
  }
  for (const e of errors) console.error(e);
  if (errors.length > 0) return 1;
  console.log(options.diff
    ? "Each added page or skill comes with a change under [Unreleased]."
    : "CHANGELOG.md has the Unreleased heading, its compare link and an entry for the package.json version.");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
