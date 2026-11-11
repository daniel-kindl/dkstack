#!/usr/bin/env node
// Check the GitHub Actions workflows in .github/workflows:
// - Each action is pinned to a full 40-character commit SHA, with the
//   version in a comment. A tag or a branch can move to other code.
// - The workflow sets top-level permissions, so the token has least privilege.
//   "write-all" is not permitted. A top-level permission cannot be "write".
//   Give a write permission to the one job that needs it.
// - The workflow does not use secrets. There is one exception: the job with
//   "environment: release" in release.yml may pass secrets.RELEASE_APP_ID as
//   "app-id" and secrets.RELEASE_APP_PRIVATE_KEY as "private-key" to
//   actions/create-github-app-token, in the "with:" block of that step only,
//   one key per line. Daniel decided this on 2026-11-11 (#135).
// The check reads lines. It does not parse YAML.

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = ".github/workflows";
const USES = /^\s*(?:-\s+)?uses\s*:\s*(["']?)([^"'\s#]+)\1(?:\s+#\s*(.*?))?\s*$/;
const PINNED = /^\S+@[0-9a-f]{40}$/;
const VERSION_COMMENT = /^v?[0-9]+(\.[0-9]+)*\b/;
const PERMISSIONS = /^permissions\s*:/m;
const WRITE_ALL = /^\s*permissions\s*:\s*(["']?)write-all\1\s*(#.*)?$/;
const WRITE = /:\s*(["']?)write\1\s*(?:[,}#]|$)/;
const SECRETS = /\bsecrets\s*[.[]/;
const APP_SECRET = [
  /^\s+app-id: \$\{\{ secrets\.RELEASE_APP_ID \}\}$/,
  /^\s+private-key: \$\{\{ secrets\.RELEASE_APP_PRIVATE_KEY \}\}$/,
];
const APP_TOKEN_ACTION = "actions/create-github-app-token@";

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
    let inTopPermissions = false;
    let releaseJob = false;
    // The state of the current step: its action and its "with:" block.
    let stepUses = "";
    let withIndent = -1;
    text.split(/\r?\n/).forEach((line, i) => {
      const where = `${rel}:${i + 1}`;
      if (/^\S/.test(line) && !line.startsWith("#")) {
        inTopPermissions = /^permissions\s*:/.test(line);
      }
      const indent = line.search(/\S/);
      if (/^  \S/.test(line)) {
        releaseJob = false;
        stepUses = "";
      }
      // A step starts at "- ". A line at the indent of "with:" or less ends
      // the "with:" block.
      if (/^\s+- /.test(line)) stepUses = "";
      if (withIndent !== -1 && indent !== -1 && indent <= withIndent) withIndent = -1;
      if (/^\s+with:\s*$/.test(line)) withIndent = indent;
      if (/^    environment:\s*release\s*$/.test(line)) releaseJob = true;
      if (WRITE_ALL.test(line)) {
        errors.push(`${where}: do not use "permissions: write-all"`);
      } else if (inTopPermissions && WRITE.test(line)) {
        errors.push(`${where}: do not give "write" at the top level; give it to one job`);
      }
      const uses = USES.exec(line);
      if (uses) stepUses = uses[2];
      if (uses && !uses[2].startsWith("./")) {
        if (!PINNED.test(uses[2])) {
          errors.push(`${where}: pin "${uses[2]}" to a full 40-character commit SHA`);
        } else if (!VERSION_COMMENT.test(uses[3] ?? "")) {
          errors.push(`${where}: add the version after the SHA, as in "# v1.2.3"`);
        }
      }
      const appSecret =
        name === "release.yml" &&
        releaseJob &&
        stepUses.startsWith(APP_TOKEN_ACTION) &&
        withIndent !== -1 &&
        indent === withIndent + 2 &&
        APP_SECRET.some((re) => re.test(line));
      if (SECRETS.test(line) && !appSecret) errors.push(`${where}: do not use secrets in a workflow`);
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
