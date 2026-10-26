#!/usr/bin/env node
// Check that every relative Markdown link in the repository points to a file
// or folder that exists inside the repository. External links (with a URL
// scheme) and pure anchors are not checked. Links in fenced code blocks and
// inline code are ignored.

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const SKIP_DIRS = new Set([".git", "node_modules"]);
// [text](target) and ![alt](target). The target is <...> or has no spaces,
// and an optional "title" can follow.
const LINK_PATTERN = /!?\[[^\]]*\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

async function markdownFiles(root, dir = root) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...(await markdownFiles(root, full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push(full);
    }
  }
  return found.sort();
}

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
      if (SCHEME_PATTERN.test(target) || target.startsWith("#")) continue;
      let path;
      try {
        path = decodeURI(target.split("#")[0]);
      } catch {
        errors.push(`${relFile}:${line}: broken link ${target}`);
        continue;
      }
      const full = resolve(dirname(file), path);
      const resolved = relative(root, full).split(sep).join("/");
      links.push({ file: relFile, line, target, resolved });
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
  console.log(`${checked} relative link(s) resolve.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
