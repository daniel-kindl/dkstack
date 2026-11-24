#!/usr/bin/env node
// Check that a breaking change is marked. The classes are in
// versioning/index.md, section "Breaking changes in dkstack".
//
// The check compares the tree at the merge base of --base (default
// origin/main) and HEAD with the tree at HEAD. It reads the committed trees
// with git ls-tree and git show, so it does not see uncommitted changes. These
// are breaking items:
//
// - A removed .md page. Pages under test/ are fixtures, and a map under
//   docs/maps/ is planning state that the chart-route skill owns. No consumer
//   links them, so they do not count.
// - A removed skill folder: skills/<name>/SKILL.md is gone at HEAD.
// - A removed anchor that a skill (skills/**) or AGENTS.md links at the base,
//   with a relative link, a "#anchor" link or a repository URL. The anchor is
//   kept if HEAD has it as a heading or as an HTML id or name attribute.
//
// A renamed file counts as removed. If there is an item, the pull request
// title in the TITLE environment variable must have "!" before the colon, and
// the "## [Unreleased]" section of CHANGELOG.md at HEAD must have a line that
// starts with "Consumer action:" (after an optional "- "). The line must be
// new: a line that [Unreleased] had at the merge base does not count.
//
// The validate workflow runs this check only on pull_request, because a push
// to main has no pull request title. The title check ran on the pull request.
// In GitHub Actions, use --event to read the title from GITHUB_EVENT_PATH.
// Usage: TITLE="<title>" node scripts/check-breaking.mjs [--base <ref>] [root]
// Exit 0: pass. Exit 1: findings. Exit 2: usage or git error.

import { execFileSync } from "node:child_process";
import { posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readPullRequest } from "./pr-event.mjs";
import { REPO_URL_PATTERN, anchorsIn, fragmentOf, linksIn } from "./check-links.mjs";

const NOT_A_PAGE = /^(?:docs\/maps|test)\//;
const SKILL = /^skills\/([^/]+)\/SKILL\.md$/;
const LINKING_FILE = /^(?:AGENTS\.md|skills\/.+\.md)$/;
const MAJOR_TITLE = /^[a-z]+(?:\([^)]*\))?!:/;
const CONSUMER_ACTION = /^(?:- )?Consumer action:/;

// Return the page path and the anchor of a link in `file`, or null when the
// link has no anchor or does not point to a Markdown file in the repository.
function anchorTarget(file, target) {
  const fragment = fragmentOf(target);
  if (fragment === null) return null;
  const repoUrl = REPO_URL_PATTERN.exec(target);
  if (target.startsWith("#")) return { page: file, anchor: fragment };
  let path;
  try {
    path = decodeURI(repoUrl ? (repoUrl[1] ?? "").replace(/^\//, "") : target.split("#")[0]);
  } catch {
    return null;
  }
  const page = posix.normalize(repoUrl ? path : posix.join(posix.dirname(file), path));
  // A URL to another site or a path outside the repository is not in the
  // base tree, so breakingItems skips it.
  if (!/\.md$/i.test(page)) return null;
  return { page, anchor: fragment };
}

// Return the breaking items between two trees. A tree is { paths, read },
// where read(path) returns the text of a file in that tree.
export function breakingItems(base, head) {
  const headPaths = new Set(head.paths);
  const items = [];
  const removedSkills = new Set();
  for (const path of base.paths) {
    const skill = SKILL.exec(path);
    if (skill && !headPaths.has(path)) removedSkills.add(`skills/${skill[1]}/`);
  }
  for (const dir of [...removedSkills].sort()) items.push(`removed skill ${dir.slice(0, -1)}`);
  for (const path of [...base.paths].sort()) {
    if (!path.endsWith(".md") || headPaths.has(path) || NOT_A_PAGE.test(path)) continue;
    if ([...removedSkills].some((dir) => path.startsWith(dir))) continue;
    items.push(`removed page ${path}`);
  }
  const cache = new Map();
  const anchors = (tree, page) => {
    const key = `${tree === base ? "base" : "head"}:${page}`;
    if (!cache.has(key)) cache.set(key, anchorsIn(tree.read(page)));
    return cache.get(key);
  };
  const basePaths = new Set(base.paths);
  const seen = new Set();
  for (const file of [...base.paths].filter((p) => LINKING_FILE.test(p)).sort()) {
    for (const { line, target } of linksIn(base.read(file))) {
      const link = anchorTarget(file, target);
      // A link that was broken at the base, or a page that is gone, is not an anchor item.
      if (!link || !basePaths.has(link.page) || !headPaths.has(link.page)) continue;
      if (!anchors(base, link.page).has(link.anchor) || anchors(head, link.page).has(link.anchor)) continue;
      const item = `removed anchor ${link.page}#${link.anchor}`;
      if (seen.has(item)) continue;
      seen.add(item);
      items.push(`${item} (linked from ${file}:${line})`);
    }
  }
  return items;
}

// Return the text of the "## [Unreleased]" section, or null if there is none.
function unreleased(changelog) {
  const lines = (changelog ?? "").split(/\r?\n/);
  const start = lines.indexOf("## [Unreleased]");
  if (start === -1) return null;
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

// Return the "Consumer action:" lines under [Unreleased].
const consumerActions = (changelog) =>
  (unreleased(changelog) ?? []).map((line) => line.trimStart()).filter((line) => CONSUMER_ACTION.test(line));

// Return what a breaking change still needs: "!" in the title and a
// "Consumer action:" line under [Unreleased] that the base did not have.
export function missingPieces(title, changelog, baseChangelog = null) {
  const missing = [];
  if (!MAJOR_TITLE.test(title)) missing.push('the pull request title has no "!" before the colon');
  const earlier = new Set(consumerActions(baseChangelog));
  if (!consumerActions(changelog).some((line) => !earlier.has(line))) {
    missing.push('the ## [Unreleased] section of CHANGELOG.md has no new line that starts with "Consumer action:"');
  }
  return missing;
}

// Read the trees at the merge base of `ref` and HEAD, and at HEAD.
function gitTrees(root, ref) {
  const git = (...args) => execFileSync("git", args,
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  const tree = (commit) => ({
    paths: git("ls-tree", "-r", "-z", "--name-only", commit).split("\0").filter(Boolean),
    read: (path) => git("show", `${commit}:${path}`),
  });
  const mergeBase = git("merge-base", ref, "HEAD").trim();
  return { base: tree(mergeBase), head: tree("HEAD") };
}

function parseArgs(args) {
  const options = { base: "origin/main", root: ".", event: false };
  let rootSet = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--event") options.event = true;
    else if (arg === "--base" && i + 1 < args.length) options.base = args[++i];
    else if (!arg.startsWith("-") && !rootSet) {
      options.root = arg;
      rootSet = true;
    } else return null;
  }
  return options;
}

async function main(args, title) {
  const options = parseArgs(args);
  if (!options || (!options.event && !title)) {
    console.error('usage: TITLE="<title>" node scripts/check-breaking.mjs [--base <ref>] [root]');
    return 2;
  }
  if (options.event) {
    const pr = readPullRequest((value) => typeof value.title === "string" && value.title.length > 0);
    if (!pr) return 2;
    title = pr.title;
  }
  let items;
  let changelog;
  let baseChangelog;
  try {
    const { base, head } = gitTrees(resolve(options.root), options.base);
    items = breakingItems(base, head);
    changelog = head.paths.includes("CHANGELOG.md") ? head.read("CHANGELOG.md") : null;
    baseChangelog = base.paths.includes("CHANGELOG.md") ? base.read("CHANGELOG.md") : null;
  } catch (err) {
    console.error(`cannot read the git trees: ${(err.stderr || err.message).toString().trim()}`);
    return 2;
  }
  if (items.length === 0) {
    console.log("No breaking change.");
    return 0;
  }
  const missing = missingPieces(title, changelog, baseChangelog);
  const report = missing.length > 0 ? console.error : console.log;
  for (const item of items) report(`breaking: ${item}`);
  if (missing.length > 0) {
    for (const piece of missing) report(`missing: ${piece}`);
    return 1;
  }
  report('The title has "!" and CHANGELOG.md has a Consumer action line.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (process.env.PR_BASE) args.unshift("--base", process.env.PR_BASE);
  process.exitCode = await main(args, process.env.TITLE);
}
