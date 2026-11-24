// List the Markdown files in a tree. The result is sorted, so the output of
// each check is stable.
//
// In a Git work tree, the list holds the tracked files that exist and the
// untracked files that .gitignore does not ignore. So a local run reads the
// same files as CI, which checks a clean checkout (#333). Outside a Git work
// tree, the walk reads the folder and skips the .git and node_modules folders.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const SKIP_DIRS = new Set([".git", "node_modules"]);
const run = promisify(execFile);

export async function markdownFiles(dir) {
  const listed = await gitFiles(dir);
  if (listed === null) return (await walk(dir)).sort();
  return listed
    .filter((path) => path.endsWith(".md"))
    .map((path) => join(dir, path))
    .filter((full) => existsSync(full))
    .sort();
}

// Return the paths relative to dir, or null when dir is not in a Git work
// tree or Git is not available. A file with a merge conflict has one index
// entry for each stage, so the paths go through a Set.
async function gitFiles(dir) {
  try {
    const { stdout } = await run(
      "git",
      ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { cwd: dir, maxBuffer: 64 * 1024 * 1024 },
    );
    return [...new Set(stdout.split("\0").filter(Boolean))];
  } catch {
    return null;
  }
}

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push(full);
    }
  }
  return found;
}
