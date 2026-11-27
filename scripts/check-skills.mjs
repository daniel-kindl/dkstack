#!/usr/bin/env node
// Validate DKSTACK skill layout, frontmatter, and client invocation policy.
// This parser supports common YAML scalars and metadata mappings; the upstream
// skills-ref validator is authoritative for the full Agent Skills specification.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const INVOCATION_KEYS = new Set(["disable-model-invocation", "user-invocable"]);
const KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools", ...INVOCATION_KEYS]);
// Codex reads agents/openai.yaml. The key policy.allow_implicit_invocation:
// false turns off implicit invocation. The key must be in the policy block.
export function codexPolicyOff(text) {
  let inPolicy = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inPolicy = /^policy:\s*$/.test(line);
    } else if (inPolicy && /^\s+allow_implicit_invocation:\s*false\s*$/.test(line)) {
      return true;
    }
  }
  return false;
}
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME = 64;
// Plain YAML scalars that YAML 1.1 or 1.2 reads as null, a boolean, a number
// or a date. They match NAME_PATTERN, but they are not strings.
const NOT_A_STRING = [
  /^(null|true|false|yes|no|on|off|y|n)$/,
  /^[0-9]+(e-?[0-9]+)?$/,
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

// Parse the supported frontmatter fields without pretending to implement all of YAML.
// Block scalars and nested metadata require a YAML parser. Reject unsupported forms
// explicitly; the upstream skills-ref validator remains the format authority.
export function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") throw new Error("the file must start with a --- frontmatter line.");
  const end = lines.indexOf("---", 1);
  if (end === -1) throw new Error("the frontmatter has no closing --- line.");
  const fields = {};
  for (let i = 1; i < end; i++) {
    const lineNo = i + 1;
    const match = /^([A-Za-z][\w-]*):(?:\s+(.*))?$/.exec(lines[i]);
    if (!match) throw new Error(`line ${lineNo}: expected "key: value".`);
    const [, key, rawValue = ""] = match;
    if (!KEYS.has(key)) {
      throw new Error(`line ${lineNo}: unknown key "${key}".`);
    }
    if (Object.hasOwn(fields, key)) throw new Error(`line ${lineNo}: duplicate key "${key}".`);
    if (key === "metadata") {
      if (rawValue.trim()) throw new Error(`line ${lineNo}: metadata must be a mapping.`);
      const map = {};
      while (i + 1 < end && /^\s/.test(lines[i + 1])) {
        i++;
        const entry = /^  ([A-Za-z0-9_.-]+):\s*(.*)$/.exec(lines[i]);
        if (!entry) throw new Error(`line ${i + 1}: expected a two-space indented metadata entry.`);
        if (Object.hasOwn(map, entry[1])) throw new Error(`line ${i + 1}: duplicate metadata key "${entry[1]}".`);
        map[entry[1]] = parseScalar(entry[2], i + 1);
      }
      fields.metadata = map;
      continue;
    }
    const value = rawValue.trim();
    if (INVOCATION_KEYS.has(key)) {
      if (value !== "true" && value !== "false") throw new Error(`line ${lineNo}: ${key} must be true or false.`);
      fields[key] = value === "true";
    } else if (value === "|" || value === ">") {
      const blocks = [];
      while (i + 1 < end && /^  /.test(lines[i + 1])) blocks.push(lines[++i].slice(2));
      if (!blocks.length) throw new Error(`line ${lineNo}: empty block scalar.`);
      fields[key] = value === "|" ? blocks.join("\n") + "\n" : blocks.join(" ") + "\n";
    } else {
      fields[key] = parseScalar(value, lineNo);
    }
  }
  return fields;
}

function parseScalar(raw, lineNo) {
  if (raw.startsWith('"')) {
    const value = parseQuoted(raw);
    if (value === null || value === undefined) throw new Error(`line ${lineNo}: invalid double-quoted string.`);
    return value;
  }
  if (raw.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(raw)) throw new Error(`line ${lineNo}: invalid single-quoted string.`);
    return raw.slice(1, -1).replace(/''/g, "'");
  }
  if (!raw || /:\s|\s#|[\[\]{}]/.test(raw)) throw new Error(`line ${lineNo}: unsupported or invalid plain scalar.`);
  return raw;
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
  if (fields.compatibility !== undefined && (fields.compatibility.length === 0 || fields.compatibility.length > 500)) {
    errors.push("compatibility must have 1-500 characters.");
  }
  if (fields.description === undefined) {
    errors.push("description is missing.");
  } else if (fields.description.trim() === "") {
    errors.push("description must not be empty.");
  } else if (fields.description.length > MAX_DESCRIPTION) {
    errors.push(`description must have ${MAX_DESCRIPTION} characters or fewer.`);
  }
  if (fields["disable-model-invocation"] === true && fields["user-invocable"] === false) {
    errors.push(
      "disable-model-invocation: true and user-invocable: false together leave no way to invoke the skill.",
    );
  }
  return errors;
}

// A user-only skill must also be user-only in Codex, and the reverse.
async function checkCodexPolicy(fields, skillDir) {
  let policy = "";
  try {
    policy = await readFile(join(skillDir, "agents", "openai.yaml"), "utf8");
  } catch {
    policy = "";
  }
  const codexOff = codexPolicyOff(policy);
  const userOnly = fields["disable-model-invocation"] === true;
  if (userOnly && !codexOff) {
    return ["a user-only skill needs agents/openai.yaml with allow_implicit_invocation: false."];
  }
  if (!userOnly && codexOff) {
    return ["agents/openai.yaml turns off implicit use, so set disable-model-invocation: true."];
  }
  return [];
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
      fieldErrors.push(...(await checkCodexPolicy(fields, join(skillsDir, entry.name))));
    }
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
