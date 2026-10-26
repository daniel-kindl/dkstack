// List the Markdown files in a tree. The .git and node_modules folders are
// skipped. The result is sorted, so the output of each check is stable.

import { readdir } from "node:fs/promises";
import { join } from "node:path";

const SKIP_DIRS = new Set([".git", "node_modules"]);

export async function markdownFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...(await markdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push(full);
    }
  }
  return found.sort();
}
