#!/usr/bin/env node
// Check that every Markdown link in the repository points to a file or folder
// that exists inside the repository. Relative links resolve against the file
// that contains them. Absolute links to a file in this repository (raw and
// blob or tree URLs on GitHub, with any ref) resolve against the local tree,
// as Markdown links or as bare URLs. Other URLs and pure anchors are not
// checked, because a network check is not deterministic. Links in fenced code
// blocks and inline code are ignored. In a skill folder, a relative link must
// stay in that folder, and a link to another dkstack file must be a raw URL on
// the ref v1. The check still maps each such URL to a file at HEAD.

import { readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { markdownFiles } from "./markdown-files.mjs";

// [text](target) and ![alt](target). The target is <...> or has no spaces,
// and an optional "title" can follow.
const LINK_PATTERN = /!?\[[^\]]*\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
// A bare URL in prose. Trailing punctuation is not part of the URL.
const BARE_URL_PATTERN = /https?:\/\/[^\s<>()[\]"'`]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;
// A file or folder in this repository on GitHub. Group 1 is the path.
const REPO_URL_PATTERN =
  /^https?:\/\/(?:raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/[^/?#]+|github\.com\/daniel-kindl\/dkstack\/(?:blob|tree)\/[^/?#]+)(\/[^?#]*)?/i;

// The skills CLI copies only a skill folder. A file in a skill folder can link
// to its own folder with a relative link, and to other dkstack files only with
// a raw URL on the release ref (ADR 0001).
const SKILL_FILE_PATTERN = /^skills\/[^/]+\//;
const SKILL_URL_PREFIX = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

// Yield { line, target } for each link outside code.
function* linksIn(text) {
  let fence = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(lines[i]);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const prose = lines[i].replace(/`[^`]*`/g, "");
    for (const match of prose.matchAll(LINK_PATTERN)) {
      let target = match[1];
      if (target.startsWith("<")) target = target.slice(1, -1);
      yield { line: i + 1, target };
    }
    for (const match of prose.replace(LINK_PATTERN, "").matchAll(BARE_URL_PATTERN)) {
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

// Return { checked, links, errors }. Paths use "/" and are relative to root.
export async function checkLinks(root) {
  const links = [];
  const errors = [];
  for (const file of await markdownFiles(root)) {
    const relFile = relative(root, file).split(sep).join("/");
    const text = await readFile(file, "utf8");
    for (const { line, target } of linksIn(text)) {
      const repoUrl = REPO_URL_PATTERN.exec(target);
      if (!repoUrl && (SCHEME_PATTERN.test(target) || target.startsWith("#"))) continue;
      let path;
      try {
        path = decodeURI(repoUrl ? (repoUrl[1] ?? "").replace(/^\//, "") : target.split("#")[0]);
      } catch {
        errors.push(`${relFile}:${line}: broken link ${target}`);
        continue;
      }
      const full = resolve(repoUrl ? root : dirname(file), path);
      const resolved = relative(root, full).split(sep).join("/");
      links.push({ file: relFile, line, target, resolved });
      const skillDir = SKILL_FILE_PATTERN.exec(relFile)?.[0];
      if (skillDir && repoUrl && !target.startsWith(SKILL_URL_PREFIX)) {
        errors.push(`${relFile}:${line}: skill link must use ${SKILL_URL_PREFIX}<path>: ${target}`);
      } else if (skillDir && !repoUrl && !resolved.startsWith(skillDir)) {
        errors.push(`${relFile}:${line}: relative link leaves the skill folder ${target}`);
        continue;
      }
      if (resolved === ".." || resolved.startsWith("../")) {
        // GitHub and an installed copy do not have files outside the repository.
        errors.push(`${relFile}:${line}: link leaves the repository ${target}`);
      } else if (!(await exists(full))) {
        errors.push(`${relFile}:${line}: broken link ${target}`);
      }
    }
  }
  return { checked: links.length, links, errors };
}

async function main() {
  const root = resolve(process.argv[2] ?? ".");
  const { checked, errors } = await checkLinks(root);
  if (errors.length > 0) {
    for (const message of errors) console.error(message);
    process.exitCode = 1;
    return;
  }
  console.log(`${checked} link(s) resolve.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
