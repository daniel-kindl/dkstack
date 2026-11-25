// List the Markdown files in a tree. The result is sorted, so the output of
// each check is stable.
//
// In a Git work tree, the list holds the tracked files that exist and the
// untracked files that .gitignore does not ignore. So a local run reads the
// same files as CI, which checks a clean checkout (#333). Outside a Git work
// tree, or in a folder that .gitignore ignores, the walk reads the folder and
// skips the .git and node_modules folders.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const SKIP_DIRS = new Set([".git", "node_modules"]);
const run = promisify(execFile);

// extensions lists the file name endings to keep. The default is Markdown.
export async function markdownFiles(dir, extensions = [".md"]) {
  const keep = (name) => extensions.some((ext) => name.endsWith(ext));
  const listed = await gitFiles(dir);
  if (listed === null) return (await walk(dir, keep)).sort();
  return listed
    .filter(keep)
    .map((path) => join(dir, path))
    .filter((full) => existsSync(full))
    .sort();
}

// Return the paths relative to dir, or null when dir is not in a Git work
// tree, Git is not available, or .gitignore ignores dir. Git lists no file in
// an ignored folder, and a check of zero files must not pass. A file with a
// merge conflict has one index entry for each stage, so the paths go through
// a Set.
async function gitFiles(dir) {
  if (await isIgnored(dir)) return null;
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

// git check-ignore exits 0 when the path is ignored and 1 when it is not.
async function isIgnored(dir) {
  try {
    await run("git", ["check-ignore", "-q", "."], { cwd: dir });
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, keep) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...(await walk(full, keep)));
    } else if (entry.isFile() && keep(entry.name)) {
      found.push(full);
    }
  }
  return found;
}
