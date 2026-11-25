#!/usr/bin/env node
// Check the diagram rules of the make-diagram skill, section "Format":
//   - Each mermaid block has a paragraph of text directly above it (error).
//   - A diagram with more than 12 nodes gets a warning. The warning does not
//     change the exit code.
//   - A .png or .svg file in docs/ is an error. Use a mermaid block.
// A mermaid block inside an outer fence, for example an example in a
// ````markdown block, is not a diagram and is skipped.
// This file has no dependencies, so another repository can copy it.
// Usage: node scripts/check-diagrams.mjs [root]
// Exit 0: pass, with or without warnings. Exit 1: findings. Exit 2: usage or read error.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const MAX_NODES = 12;
const SKIP_DIRS = new Set([".git", "node_modules"]);
const FENCE = /^\s{0,3}(`{3,}|~{3,})\s*(\S*)/;
// A line that is not a paragraph of text: heading, list item, table, quote, fence, HTML.
const NOT_TEXT = /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|\||>|`{3,}|~{3,}|<)/;
const ARROW = /\s*[<xo]?(?:-{2,}|={2,}|-\.+-)[>xo]?(?:\|[^|]*\|)?\s*/;
const SKIP_WORDS = /^\s*(subgraph|end|style|classDef|class|click|linkStyle|direction|state|note|title|%%|accTitle|accDescr)\b/i;
const ID = /^\s*([A-Za-z_]\w*)/;

// Return the number of nodes in the body of one diagram. A kind that the
// function does not know has 0 nodes, so it gives no warning.
export function countNodes(body) {
  const [first, ...rest] = body.split(/\r?\n/);
  const kind = first.trim().split(/\s+/)[0];
  const ids = new Set();
  if (kind === "flowchart" || kind === "graph" || kind === "stateDiagram" || kind === "stateDiagram-v2") {
    const isState = kind.startsWith("state");
    for (const line of rest) {
      if (SKIP_WORDS.test(line) || line.trim() === "" || line.trim() === "}") continue;
      const text = isState ? line.replace(/\s*:.*$/, "") : line;
      for (const segment of text.split(ARROW)) {
        for (const part of segment.split(/\s&\s/)) {
          const m = ID.exec(part);
          if (m) ids.add(m[1]);
        }
      }
    }
  } else if (kind === "sequenceDiagram") {
    for (const line of rest) {
      const p = /^\s*(?:participant|actor)\s+(\w+)/.exec(line);
      if (p) ids.add(p[1]);
      const m = /^\s*(\w+)\s*(?:--?>>|--?>|--?x|--?\))[+-]?\s*(\w+)\s*:/.exec(line);
      if (m) {
        ids.add(m[1]);
        ids.add(m[2]);
      }
    }
  } else if (kind === "erDiagram") {
    for (const line of rest) {
      const m = /^\s*(\w+)\s+\S+\s+(\w+)\s*:/.exec(line);
      if (m) {
        ids.add(m[1]);
        ids.add(m[2]);
      }
      const e = /^\s*(\w+)\s*\{/.exec(line);
      if (e) ids.add(e[1]);
    }
  }
  return ids.size;
}

// Return { errors, warnings, diagrams } for one Markdown text, as "path:line: message".
export function checkDiagramText(path, text) {
  const lines = text.split(/\r?\n/);
  const errors = [];
  const warnings = [];
  let diagrams = 0;
  let outer = null; // { char, length } of the open fence
  let current = null; // { index, body } of the open mermaid block
  const finish = () => {
    diagrams += 1;
    const count = countNodes(current.body.join("\n"));
    if (count > MAX_NODES) {
      warnings.push(`${path}:${current.index + 1}: the diagram has ${count} nodes. Split a diagram of more than ${MAX_NODES} nodes`);
    }
    current = null;
  };
  lines.forEach((line, i) => {
    const m = FENCE.exec(line);
    if (outer === null) {
      if (!m) return;
      outer = { char: m[1][0], length: m[1].length };
      if (m[2] !== "mermaid") return;
      let j = i - 1;
      while (j >= 0 && lines[j].trim() === "") j -= 1;
      if (j < 0 || NOT_TEXT.test(lines[j])) {
        errors.push(`${path}:${i + 1}: a mermaid diagram needs a paragraph of text directly above it`);
      }
      current = { index: i, body: [] };
      return;
    }
    const closes = m && m[1][0] === outer.char && m[1].length >= outer.length && m[2] === "";
    if (closes) {
      outer = null;
      if (current) finish();
    } else if (current) {
      current.body.push(line);
    }
  });
  if (current) finish();
  return { errors, warnings, diagrams };
}

// List the files under root as paths relative to root with "/". In a Git work
// tree, use the tracked and the not ignored files. Else walk the folder.
async function listFiles(root) {
  try {
    const { stdout } = await run("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    return [...new Set(stdout.split("\0").filter(Boolean))].filter((p) => existsSync(join(root, p)));
  } catch {
    return walk(root, "");
  }
}

async function walk(root, dir) {
  const found = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const path = dir === "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) found.push(...(await walk(root, path)));
    } else if (entry.isFile()) {
      found.push(path);
    }
  }
  return found;
}

// Return { diagrams, errors, warnings } for the repository at root.
export async function checkDiagrams(root) {
  const files = (await listFiles(root)).sort();
  const errors = [];
  const warnings = [];
  let diagrams = 0;
  for (const path of files) {
    if (/^docs\/.*\.(png|svg)$/i.test(path)) {
      errors.push(`${path}: do not commit a binary image of a diagram. Use a mermaid block`);
    } else if (path.endsWith(".md")) {
      const result = checkDiagramText(path, await readFile(join(root, path), "utf8"));
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      diagrams += result.diagrams;
    }
  }
  return { diagrams, errors, warnings };
}

async function main(args) {
  if (args.length > 1 || args.some((arg) => arg.startsWith("-"))) {
    console.error("usage: node scripts/check-diagrams.mjs [root]");
    return 2;
  }
  let result;
  try {
    result = await checkDiagrams(resolve(args[0] ?? "."));
  } catch (err) {
    console.error(`cannot read the files: ${err.message}`);
    return 2;
  }
  for (const message of result.warnings) console.error(`warning: ${message}`);
  if (result.errors.length > 0) {
    for (const message of result.errors) console.error(message);
    return 1;
  }
  console.log(result.diagrams > 0 ? `${result.diagrams} mermaid diagram(s) follow the format rules.`
    : "No mermaid diagram found. Nothing to check.");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
