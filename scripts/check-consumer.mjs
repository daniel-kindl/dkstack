#!/usr/bin/env node
// Check that a repository is a correct dkstack consumer. It checks the setup of
// setup-dkstack, setup-editorconfig and the supply chain rules of
// coding/dependencies.md. The check is offline.
//   1. AGENTS.md has a dkstack URL on v1 or on a vX.Y.Z tag, and an Exceptions
//      section. CLAUDE.md, if present, has the line @AGENTS.md.
//   2. .editorconfig has the keys of setup-editorconfig. .gitattributes has
//      "* text=auto eol=lf".
//   3. A package.json with dependencies has a lockfile, and the CI workflows run
//      "npm ci" and "npm audit". The Dependabot config covers npm (when there
//      is a package.json) and github-actions (when there are workflows), weekly,
//      with a commit prefix.
//   4. Each copied dkstack script matches the hash list for its tag.
// The hash list is a JSON file: { "<tag>": { "<script name>": "<sha256>" } }.
// The default path is scripts/dkstack-hashes.json. Copy it with the scripts from
// the same tag. The tag is --tag, or the vX.Y.Z tag of the URL in AGENTS.md. The
// script compares the SHA-256 of each file in scripts/ that the list names for the
// tag. CRLF line endings count as LF. A repository that copies this script
// must also copy the list.
// The CI check reads the workflow text without comment lines and looks for the
// patterns "npm ci" and "npm audit". It does not parse the workflow, so a step
// like `echo "npm ci"` would pass. A review must still read the CI steps.
// The list covers only the scripts that exist at a tag. It does not hash this
// script or the list.
// --print-hashes <dir> prints the hash entry of each .mjs file in <dir>. The
// owner adds the entry to the list at a release.
// This file has no dependencies and reads no other dkstack file, so another
// repository can copy it.
// Usage: node scripts/check-consumer.mjs [--tag <tag>] [--hashes <file>] [root]
//        node scripts/check-consumer.mjs --print-hashes <dir>
// Exit 0: pass. Exit 1: findings. Exit 2: usage or read error.

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const URL_PATTERN = /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/(v1|v\d+\.\d+\.\d+)\/AGENTS\.md/;
const TAG_PATTERN = /\/dkstack\/(v\d+\.\d+\.\d+)\/AGENTS\.md/;
const EDITORCONFIG_KEYS = [
  ["root", "true"], ["charset", "utf-8"], ["end_of_line", "lf"], ["indent_style", "space"],
  ["trim_trailing_whitespace", "true"], ["insert_final_newline", "true"],
];
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const WORKFLOWS = ".github/workflows";
const HASH_LIST = "dkstack-hashes.json";

async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function readFirst(root, names) {
  for (const name of names) {
    const text = await readText(join(root, name));
    if (text !== null) return { name, text };
  }
  return null;
}

export function sha256(text) {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");
}

function checkAgents(agents, claude, errors) {
  if (agents === null) {
    errors.push("AGENTS.md: the file is missing");
  } else {
    if (!URL_PATTERN.test(agents)) errors.push("AGENTS.md: no dkstack URL on v1 or on a vX.Y.Z tag");
    if (!/^## Exceptions\s*$/m.test(agents)) errors.push('AGENTS.md: no "## Exceptions" section');
  }
  if (claude !== null && !/^@AGENTS\.md\s*$/m.test(claude)) {
    errors.push("CLAUDE.md: the file has no @AGENTS.md line");
  }
}

function checkEditorconfig(text, attributes, errors) {
  if (text === null) {
    errors.push(".editorconfig: the file is missing");
  } else {
    const keys = new Map();
    let section = "";
    let markdown = null;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      const header = /^\[(.+)\]$/.exec(line);
      if (header) {
        section = header[1];
        continue;
      }
      const pair = /^([A-Za-z_]+)\s*=\s*(\S+)/.exec(line);
      if (!pair) continue;
      const key = pair[1].toLowerCase();
      const value = pair[2].toLowerCase();
      if (section === "" || section === "*") keys.set(key, value);
      if (/^\*\.(md|\{[^}]*\bmd\b[^}]*\})$/.test(section) && key === "trim_trailing_whitespace") markdown = value;
    }
    for (const [key, value] of EDITORCONFIG_KEYS) {
      if (keys.get(key) !== value) errors.push(`.editorconfig: missing "${key} = ${value}"`);
    }
    if (markdown !== "false") {
      errors.push('.editorconfig: the Markdown section needs "trim_trailing_whitespace = false"');
    }
  }
  if (attributes === null || !/^\* +text=auto +eol=lf\s*$/m.test(attributes)) {
    errors.push('.gitattributes: no line "* text=auto eol=lf"');
  }
}

async function workflowTexts(root) {
  let names;
  try {
    names = (await readdir(join(root, WORKFLOWS))).filter((n) => /\.ya?ml$/.test(n)).sort();
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  return Promise.all(names.map((n) => readFile(join(root, WORKFLOWS, n), "utf8")));
}

function checkCi(texts, errors) {
  const code = (texts ?? []).join("\n").split(/\r?\n/).filter((l) => !/^\s*#/.test(l)).join("\n");
  if (!/\bnpm ci\b/.test(code)) errors.push(`${WORKFLOWS}: no CI step runs "npm ci"`);
  if (!/\bnpm audit\b/.test(code)) errors.push(`${WORKFLOWS}: no CI step runs "npm audit"`);
}

function checkDependabot(dependabot, ecosystems, errors) {
  if (ecosystems.length === 0) return;
  if (dependabot === null) {
    errors.push(".github/dependabot.yml: the file is missing");
    return;
  }
  const entries = dependabot.text.split(/^\s*- +package-ecosystem:/m).slice(1).map((body) => ({
    name: /^\s*["']?([\w-]+)["']?/.exec(body)?.[1],
    body,
  }));
  for (const wanted of ecosystems) {
    const entry = entries.find((e) => e.name === wanted);
    if (!entry) {
      errors.push(`${dependabot.name}: no update entry for "${wanted}"`);
      continue;
    }
    if (!/^\s*interval:\s*["']?weekly["']?\s*(#.*)?$/m.test(entry.body)) {
      errors.push(`${dependabot.name}: the "${wanted}" entry does not check weekly`);
    }
    if (!/^\s*prefix:\s*\S/m.test(entry.body)) {
      errors.push(`${dependabot.name}: the "${wanted}" entry has no commit-message prefix`);
    }
  }
}

async function checkScripts(root, agents, options, errors) {
  let names;
  try {
    names = await readdir(join(root, "scripts"));
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  const listText = await readText(options.hashes ? resolve(options.hashes) : join(root, "scripts", HASH_LIST));
  if (listText === null) {
    if (names.includes("check-consumer.mjs")) errors.push(`scripts/${HASH_LIST}: the hash list is missing`);
    return;
  }
  let list;
  try {
    list = JSON.parse(listText);
  } catch {
    errors.push("the hash list is not valid JSON");
    return;
  }
  const known = new Set(Object.values(list).flatMap((files) => Object.keys(files)));
  const copied = names.filter((n) => known.has(n)).sort();
  if (copied.length === 0) return;
  const tag = options.tag ?? TAG_PATTERN.exec(agents ?? "")?.[1];
  if (!tag) {
    errors.push("scripts: no tag. Pass --tag, or pin a vX.Y.Z tag in AGENTS.md");
    return;
  }
  const files = list[tag];
  if (!files) {
    errors.push(`scripts: the hash list has no entry for the tag ${tag}`);
    return;
  }
  for (const name of copied) {
    if (!(name in files)) {
      errors.push(`scripts/${name}: the tag ${tag} has no such script`);
    } else if (sha256(await readFile(join(root, "scripts", name), "utf8")) !== files[name]) {
      errors.push(`scripts/${name}: the hash does not match the tag ${tag}`);
    }
  }
}

// Return the problems of the repository at `root`, as "file: message".
export async function checkConsumer(root, options = {}) {
  const errors = [];
  const agents = await readText(join(root, "AGENTS.md"));
  checkAgents(agents, await readText(join(root, "CLAUDE.md")), errors);
  checkEditorconfig(await readText(join(root, ".editorconfig")), await readText(join(root, ".gitattributes")), errors);

  const manifestText = await readText(join(root, "package.json"));
  let manifest = {};
  if (manifestText !== null) {
    try {
      manifest = JSON.parse(manifestText);
    } catch {
      errors.push("package.json: not valid JSON");
    }
  }
  const workflows = await workflowTexts(root);
  if (DEPENDENCY_FIELDS.some((f) => Object.keys(manifest[f] ?? {}).length > 0)) {
    if ((await readFirst(root, ["package-lock.json", "npm-shrinkwrap.json"])) === null) {
      errors.push("package.json: has dependencies but no package-lock.json");
    }
    checkCi(workflows, errors);
  }
  const ecosystems = [...(manifestText !== null ? ["npm"] : []), ...(workflows !== null ? ["github-actions"] : [])];
  checkDependabot(await readFirst(root, [".github/dependabot.yml", ".github/dependabot.yaml"]), ecosystems, errors);

  await checkScripts(root, agents, options, errors);
  return errors;
}

// Return the hash entry of each .mjs file in `dir`, as JSON text.
export async function printHashes(dir) {
  const out = {};
  for (const name of (await readdir(dir)).filter((n) => n.endsWith(".mjs")).sort()) {
    out[name] = sha256(await readFile(join(dir, name), "utf8"));
  }
  return JSON.stringify(out, null, 2);
}

const VALUE_FLAGS = { "--tag": "tag", "--hashes": "hashes", "--print-hashes": "printHashes" };

function parseArgs(args) {
  const options = { root: "." };
  for (let i = 0; i < args.length; i++) {
    const key = VALUE_FLAGS[args[i]];
    if (key) {
      if (i + 1 >= args.length) return null;
      options[key] = args[++i];
    } else if (args[i].startsWith("--")) {
      return null;
    } else {
      options.root = args[i];
    }
  }
  return options;
}

async function main(args) {
  const options = parseArgs(args);
  if (!options) {
    console.error("usage: node scripts/check-consumer.mjs [--tag <tag>] [--hashes <file>] [root]");
    console.error("       node scripts/check-consumer.mjs --print-hashes <dir>");
    return 2;
  }
  try {
    if (options.printHashes) {
      console.log(await printHashes(resolve(options.printHashes)));
      return 0;
    }
    const errors = await checkConsumer(resolve(options.root), options);
    for (const message of errors) console.error(message);
    if (errors.length > 0) return 1;
    console.log("The repository is a correct dkstack consumer.");
    return 0;
  } catch (err) {
    console.error(`cannot read the repository: ${err.message}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
