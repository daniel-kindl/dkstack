#!/usr/bin/env node
// Check that every skill uses the Agent Skills layout that `npx skills` loads:
// one folder per skill, skills/<name>/SKILL.md, with YAML frontmatter that has
// a name equal to the folder name and a double-quoted description.
//
// The frontmatter parser accepts a strict subset of YAML on purpose: one
// "key: value" per line, only the keys name and description, and a
// double-quoted description. This subset is always valid YAML, so a file
// that passes this check also parses in the skills CLI. It needs no
// dependency.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const KEYS = new Set(["name", "description"]);
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME = 64;
// Plain YAML scalars that YAML 1.1 or 1.2 reads as null, a boolean, a number
// or a date. They match NAME_PATTERN, but they are not strings.
const NOT_A_STRING = [
  /^(null|true|false|yes|no|on|off|y|n)$/,
  /^[0-9]+(e[0-9]+)?$/,
  /^0x[0-9a-f]+$/,
  /^0o[0-7]+$/,
  /^0b[01]+$/,
  /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$/,
];
const MAX_DESCRIPTION = 1024;

// Parse a double-quoted YAML scalar. The JSON string grammar is a subset of
// the YAML double-quoted grammar, so JSON.parse gives the YAML value.
function parseQuoted(raw) {
  if (!/^".*"$/.test(raw)) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error("the file must start with a --- frontmatter line.");
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    throw new Error("the frontmatter has no closing --- line.");
  }
  const fields = {};
  for (let i = 1; i < end; i++) {
    const lineNo = i + 1;
    const match = /^([A-Za-z][\w-]*): (.*)$/.exec(lines[i]);
    if (!match) throw new Error(`line ${lineNo}: expected "key: value".`);
    const [, key, raw] = match;
    if (!KEYS.has(key)) {
      throw new Error(`line ${lineNo}: unknown key "${key}". Use only name and description.`);
    }
    if (Object.hasOwn(fields, key)) {
      throw new Error(`line ${lineNo}: duplicate key "${key}".`);
    }
    if (key === "description") {
      const value = parseQuoted(raw.trim());
      if (value === undefined) {
        throw new Error(`line ${lineNo}: description must be a double-quoted string.`);
      }
      if (value === null) {
        throw new Error(`line ${lineNo}: description is not a valid double-quoted string.`);
      }
      fields.description = value;
    } else {
      fields[key] = raw.trim();
    }
  }
  return fields;
}

function checkFields(fields, folder) {
  const errors = [];
  if (fields.name === undefined) {
    errors.push("name is missing.");
  } else if (!NAME_PATTERN.test(fields.name) || fields.name.length > MAX_NAME) {
    errors.push(
      `name "${fields.name}" must use only a-z, 0-9 and single hyphens, with no hyphen at the start or end, and have ${MAX_NAME} characters or fewer.`,
    );
  } else if (NOT_A_STRING.some((pattern) => pattern.test(fields.name))) {
    errors.push(
      `name "${fields.name}" is not a string in YAML. Use a word that YAML does not read as null, a boolean, a number or a date.`,
    );
  } else if (fields.name !== folder) {
    errors.push(`name "${fields.name}" must be equal to the folder name "${folder}".`);
  }
  if (fields.description === undefined) {
    errors.push("description is missing.");
  } else if (fields.description.trim() === "") {
    errors.push("description must not be empty.");
  } else if (fields.description.length > MAX_DESCRIPTION) {
    errors.push(`description must have ${MAX_DESCRIPTION} characters or fewer.`);
  }
  return errors;
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

// Return { skills, errors }. Paths in errors are relative to root and use "/".
export async function checkSkills(root) {
  const skillsDir = join(root, "skills");
  if (!(await isDirectory(skillsDir))) {
    return { skills: [], errors: ["skills: the folder does not exist."] };
  }
  const entries = (await readdir(skillsDir, { withFileTypes: true })).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  const skills = [];
  const errors = [];
  for (const entry of entries) {
    const rel = `skills/${entry.name}`;
    if (entry.isFile()) {
      if (entry.name.endsWith(".md") && entry.name !== "index.md") {
        const name = entry.name.slice(0, -".md".length);
        errors.push(
          `${rel}: a skill must be in skills/<name>/SKILL.md. Move it to skills/${name}/SKILL.md.`,
        );
      }
      continue;
    }
    if (!entry.isDirectory()) continue;
    const files = await readdir(join(skillsDir, entry.name));
    for (const file of files) {
      if (file.toLowerCase() === "skill.md" && file !== "SKILL.md") {
        errors.push(`${rel}/${file}: rename the file to SKILL.md.`);
      }
    }
    if (!files.includes("SKILL.md")) {
      errors.push(`${rel}: the folder has no SKILL.md.`);
      continue;
    }
    const text = await readFile(join(skillsDir, entry.name, "SKILL.md"), "utf8");
    let fields;
    try {
      fields = parseFrontmatter(text);
    } catch (error) {
      errors.push(`${rel}/SKILL.md: ${error.message}`);
      continue;
    }
    const fieldErrors = checkFields(fields, entry.name);
    if (fieldErrors.length === 0) {
      skills.push(entry.name);
    } else {
      for (const message of fieldErrors) errors.push(`${rel}/SKILL.md: ${message}`);
    }
  }
  return { skills, errors };
}

async function main() {
  const root = resolve(process.argv[2] ?? ".");
  const { skills, errors } = await checkSkills(root);
  if (errors.length > 0) {
    for (const message of errors) console.error(message);
    process.exitCode = 1;
    return;
  }
  console.log(`${skills.length} skill(s) valid: ${skills.join(", ")}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
