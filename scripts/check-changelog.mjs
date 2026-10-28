#!/usr/bin/env node
// Check that CHANGELOG.md has a "## [X.Y.Z]" entry for the package.json version.

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
  const entry = new RegExp(`^## \\[${escape(version)}\\](?:\\s|$)`, "m");
  if (entry.test(text)) return [];
  return [`CHANGELOG.md: add a "## [${version}]" entry for the package.json version ${version}`];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = await checkChangelog(resolve(process.argv[2] ?? "."));
  for (const e of errors) console.error(e);
  if (errors.length > 0) {
    process.exitCode = 1;
  } else {
    console.log("CHANGELOG.md has an entry for the package.json version.");
  }
}
