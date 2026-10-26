#!/usr/bin/env node
// Check the GitHub Actions workflows in .github/workflows:
// - Each action is pinned to a full 40-character commit SHA, with the
//   version in a comment. A tag or a branch can move to other code.
// - The workflow sets top-level permissions, so the token has least privilege.
// - The workflow does not use secrets.
// The check reads lines. It does not parse YAML.

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = ".github/workflows";
const USES = /^\s*(?:-\s+)?uses\s*:\s*(["']?)([^"'\s#]+)\1(?:\s+#\s*(.*?))?\s*$/;
const PINNED = /^\S+@[0-9a-f]{40}$/;
const VERSION_COMMENT = /^v?[0-9]+(\.[0-9]+)*\b/;
const PERMISSIONS = /^permissions\s*:/m;
const SECRETS = /\bsecrets\s*[.[]/;

// Return { checked, errors }, or null when the folder does not exist.
export async function checkWorkflows(root) {
  let names;
  try {
    names = await readdir(join(root, DIR));
  } catch {
    return null;
  }
  const files = names.filter((n) => /\.ya?ml$/.test(n)).sort();
  const errors = [];
  for (const name of files) {
    const rel = `${DIR}/${name}`;
    const text = await readFile(join(root, DIR, name), "utf8");
    if (!PERMISSIONS.test(text)) {
      errors.push(`${rel}: set top-level permissions, as in "permissions: contents: read"`);
    }
    text.split(/\r?\n/).forEach((line, i) => {
      const where = `${rel}:${i + 1}`;
      const uses = USES.exec(line);
      if (uses && !uses[2].startsWith("./")) {
        if (!PINNED.test(uses[2])) {
          errors.push(`${where}: pin "${uses[2]}" to a full 40-character commit SHA`);
        } else if (!VERSION_COMMENT.test(uses[3] ?? "")) {
          errors.push(`${where}: add the version after the SHA, as in "# v1.2.3"`);
        }
      }
      if (SECRETS.test(line)) errors.push(`${where}: do not use secrets in a workflow`);
    });
  }
  return { checked: files.length, errors };
}

async function main() {
  const root = resolve(process.argv[2] ?? ".");
  const result = await checkWorkflows(root);
  if (result === null) {
    console.error(`${DIR}: the folder does not exist.`);
    process.exitCode = 1;
    return;
  }
  if (result.errors.length > 0) {
    for (const message of result.errors) console.error(message);
    process.exitCode = 1;
    return;
  }
  console.log(`${result.checked} workflow(s) pin actions to a SHA, set permissions and use no secrets.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
