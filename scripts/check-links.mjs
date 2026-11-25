#!/usr/bin/env node
// Check that every Markdown link in the repository points to a file or folder
// that exists inside the repository. Relative links resolve against the file
// that contains them. Absolute links to a file in this repository (raw and
// blob or tree URLs on GitHub, with any ref) resolve against the local tree,
// as Markdown links, reference definitions or bare URLs. Other URLs are not
// checked, because a network check is not deterministic. Links in fenced code
// blocks and inline code are ignored. An anchor in a link to a Markdown file,
// or a pure "#anchor", must match a heading in that file, with the GitHub
// rules for the anchor text and the "-1" suffix of a duplicate heading. An
// HTML id or name attribute is an anchor too. An HTML <a href> is a link, and
// links in an indented code block are ignored. Setext headings are not read. In a skill folder, a relative link must
// stay in that folder, and a link to another dkstack file must be a raw URL on
// the ref v1. The check still maps each such URL to a file at HEAD.
// In another repository, a dkstack URL is skipped. Pass "--dkstack-root <dir>",
// a clone of the dkstack branch, to check each dkstack URL and anchor there.

import { readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { markdownFiles } from "./markdown-files.mjs";

// [text](target) and ![alt](target). The target is <...> or has no spaces,
// and an optional "title" can follow.
const LINK_PATTERN = /!?\[[^\]]*\]\(\s*(<[^>]*>|(?:[^\s()]|\([^\s()]*\))+)(?:\s+"[^"]*")?\s*\)/g;
// <a href="target"> in HTML. The value is in double quotes, in single quotes
// or has no quotes.
const HTML_HREF_PATTERN = /<a\s[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/gi;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
// A bare URL in prose. Trailing punctuation is not part of the URL.
const BARE_URL_PATTERN = /https?:\/\/[^\s<>()[\]"'`]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;
// [label]: target, with an optional title.
const REFERENCE_PATTERN = /^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/;
const HEADING_PATTERN = /^ {0,3}#{1,6}\s+(.*?)(?:\s+#+)?\s*$/;
const HTML_ANCHOR_PATTERN = /<a\s[^>]*\b(?:id|name)\s*=\s*"([^"]+)"/gi;
// A file or folder in this repository on GitHub. Group 1 is the path.
export const REPO_URL_PATTERN =
  /^https?:\/\/(?:raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/[^/?#]+|github\.com\/daniel-kindl\/dkstack\/(?:blob|tree)\/[^/?#]+)(\/[^?#]*)?/i;

// The skills CLI copies only a skill folder. A file in a skill folder can link
// to its own folder with a relative link, and to other dkstack files only with
// a raw URL on the release ref (ADR 0001).
const REF_WITH_SLASH = /\/dkstack\/(?:(?:blob|tree)\/)?(?:release|feat|fix|docs|chore|ci|test|refactor|prototype)\//;
const SKILL_FILE_PATTERN = /^skills\/[^/]+\//;
const SKILL_URL_PREFIX = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
const INDENTED = /^(?: {4}|\t)/;

// Yield each line outside code as { index, line }. Code is a fenced block, or
// an indented block (4 spaces or a tab) after a blank line that is not part
// of a list. In a list, an indented line is a nested paragraph, not code.
function* proseLines(text) {
  let fence = null;
  let inList = false;
  let inIndentedCode = false;
  let previousBlank = true;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const blank = line.trim() === "";
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      previousBlank = false;
      continue;
    }
    if (fence !== null) continue;
    if (!blank) {
      if (INDENTED.test(line) && !inList && (previousBlank || inIndentedCode)) {
        inIndentedCode = true;
        previousBlank = false;
        continue;
      }
      inIndentedCode = false;
      if (LIST_ITEM.test(line)) inList = true;
      else if (!/^\s/.test(line)) inList = false;
    }
    previousBlank = blank;
    yield { index: i, line };
  }
}

// The GitHub anchor of a heading: the rendered text in lower case, without
// punctuation, with each space as a hyphen.
export function headingAnchor(heading) {
  const rendered = heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
  return rendered.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "").replace(/ /g, "-");
}

// Return the set of anchors in a Markdown text.
export function anchorsIn(text) {
  const anchors = new Set();
  const counts = new Map();
  for (const { line } of proseLines(text)) {
    for (const m of line.matchAll(HTML_ANCHOR_PATTERN)) anchors.add(m[1]);
    const heading = HEADING_PATTERN.exec(line);
    if (!heading) continue;
    const base = headingAnchor(heading[1]);
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    anchors.add(n === 0 ? base : `${base}-${n}`);
  }
  return anchors;
}

// Yield { line, target } for each link outside code.
export function* linksIn(text) {
  for (const { index: i, line } of proseLines(text)) {
    const prose = line.replace(/`[^`]*`/g, "");
    const reference = REFERENCE_PATTERN.exec(prose);
    if (reference) {
      let target = reference[1];
      if (target.startsWith("<")) target = target.slice(1, -1);
      yield { line: i + 1, target };
      continue;
    }
    for (const match of prose.matchAll(LINK_PATTERN)) {
      let target = match[1];
      if (target.startsWith("<")) target = target.slice(1, -1);
      yield { line: i + 1, target };
    }
    for (const match of prose.matchAll(HTML_HREF_PATTERN)) {
      yield { line: i + 1, target: match[1] ?? match[2] ?? match[3] };
    }
    for (const match of prose.replace(LINK_PATTERN, "").replace(HTML_HREF_PATTERN, "").matchAll(BARE_URL_PATTERN)) {
      yield { line: i + 1, target: match[0].replace(TRAILING_PUNCTUATION, "") };
    }
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// Return the fragment of a target, decoded, or null when it has none.
export function fragmentOf(target) {
  const at = target.indexOf("#");
  if (at === -1 || at === target.length - 1) return null;
  try {
    return decodeURIComponent(target.slice(at + 1));
  } catch {
    return target.slice(at + 1);
  }
}

// Return { checked, links, errors }. Paths use "/" and are relative to root.
// A dkstack URL resolves against options.dkstackRoot. It defaults to root, which
// is right in dkstack. A consumer passes a clone of the dkstack branch, or null
// to skip each dkstack URL.
export async function checkLinks(root, { dkstackRoot = root } = {}) {
  const links = [];
  const errors = [];
  const anchorCache = new Map();
  const anchorsOf = async (full) => {
    if (!anchorCache.has(full)) anchorCache.set(full, anchorsIn(await readFile(full, "utf8")));
    return anchorCache.get(full);
  };
  for (const file of await markdownFiles(root)) {
    const relFile = relative(root, file).split(sep).join("/");
    const text = await readFile(file, "utf8");
    for (const { line, target } of linksIn(text)) {
      const repoUrl = REPO_URL_PATTERN.exec(target);
      if (repoUrl && dkstackRoot === null) continue;
      const base = repoUrl ? dkstackRoot : root;
      if (!repoUrl && target.startsWith("#")) {
        const fragment = fragmentOf(target);
        if (fragment !== null && !(await anchorsOf(file)).has(fragment)) {
          errors.push(`${relFile}:${line}: missing anchor ${target}`);
        }
        continue;
      }
      if (!repoUrl && SCHEME_PATTERN.test(target)) continue;
      let path;
      try {
        path = decodeURI(repoUrl ? (repoUrl[1] ?? "").replace(/^\//, "") : target.split("#")[0]);
      } catch {
        errors.push(`${relFile}:${line}: broken link ${target}`);
        continue;
      }
      let full = resolve(repoUrl ? base : dirname(file), path);
      // A ref with a slash, such as release/v1.5.0, puts its second part in
      // the path. Drop it when the ref starts with a branch type.
      if (repoUrl && REF_WITH_SLASH.test(target) && !(await exists(full))) {
        const shorter = resolve(base, path.split("/").slice(1).join("/"));
        if (await exists(shorter)) full = shorter;
      }
      const resolved = relative(base, full).split(sep).join("/");
      links.push({ file: relFile, line, target, resolved });
      const skillDir = SKILL_FILE_PATTERN.exec(relFile)?.[0];
      if (skillDir && repoUrl && !target.startsWith(SKILL_URL_PREFIX)) {
        errors.push(`${relFile}:${line}: skill link must use ${SKILL_URL_PREFIX}<path>: ${target}`);
      } else if (skillDir && !repoUrl && !`${resolved}/`.startsWith(skillDir)) {
        errors.push(`${relFile}:${line}: relative link leaves the skill folder ${target}`);
        continue;
      }
      if (resolved === ".." || resolved.startsWith("../")) {
        // GitHub and an installed copy do not have files outside the repository.
        errors.push(`${relFile}:${line}: link leaves the repository ${target}`);
      } else if (!(await exists(full))) {
        errors.push(`${relFile}:${line}: broken link ${target}`);
      } else {
        const fragment = fragmentOf(target);
        if (fragment !== null && /\.md$/i.test(full) && !(await anchorsOf(full)).has(fragment)) {
          errors.push(`${relFile}:${line}: missing anchor ${target}`);
        }
      }
    }
  }
  return { checked: links.length, links, errors };
}

// Parse "[dir] [--dkstack-root <dir>]". Return { root, dkstackRoot }. Without
// the option, a repository that is not dkstack skips each dkstack URL.
export class UsageError extends Error {}

export async function parseArgs(argv) {
  const args = [...argv];
  let option = null;
  const at = args.indexOf("--dkstack-root");
  if (at !== -1) {
    option = args[at + 1];
    if (!option) throw new UsageError("--dkstack-root needs a folder");
    args.splice(at, 2);
  }
  const root = resolve(args[0] ?? ".");
  if (option !== null) {
    const dkstackRoot = resolve(option);
    if (!(await exists(resolve(dkstackRoot, "AGENTS.md")))) {
      throw new UsageError(`--dkstack-root ${option} is not a clone of dkstack: it has no AGENTS.md`);
    }
    return { root, dkstackRoot };
  }
  const isDkstack = await exists(resolve(root, "skills", "triage", "SKILL.md"));
  return { root, dkstackRoot: isDkstack ? root : null };
}

async function main() {
  let parsed;
  try {
    parsed = await parseArgs(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(error.message);
    process.exitCode = 2;
    return;
  }
  const { checked, errors } = await checkLinks(parsed.root, { dkstackRoot: parsed.dkstackRoot });
  if (errors.length > 0) {
    for (const message of errors) console.error(message);
    process.exitCode = 1;
    return;
  }
  console.log(`${checked} link(s) resolve.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
