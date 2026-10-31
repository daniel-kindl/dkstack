import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkSkills, parseFrontmatter } from "../scripts/check-skills.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-skills.mjs");

const skill = (name, description) =>
  `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`;

async function errorsFor(files) {
  const root = await makeTree(files);
  try {
    return await checkSkills(root);
  } finally {
    await removeTree(root);
  }
}

test("the repository skills use the folder layout and valid frontmatter", async () => {
  const result = await checkSkills(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.skills, [
    "apply-architecture",
    "bootstrap",
    "clarify-intent",
    "code-review",
    "map-work",
    "plan-work",
    "release",
    "tdd-loop",
    "triage",
    "write-adr",
    "write-pr",
    "writing-check",
  ]);
});

test("a valid skill folder passes", async () => {
  const result = await errorsFor({
    "skills/index.md": "# Skills\n",
    "skills/my-skill/SKILL.md": skill("my-skill", '"Use when you test: a colon is fine in quotes."'),
    "skills/my-skill/notes.md": "extra files next to SKILL.md are allowed\n",
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.skills, ["my-skill"]);
});

test("a flat skill file is rejected with the expected new path", async () => {
  const result = await errorsFor({
    "skills/index.md": "# Skills\n",
    "skills/triage.md": skill("triage", '"Read first."'),
  });
  assert.deepEqual(result.errors, [
    "skills/triage.md: a skill must be in skills/<name>/SKILL.md. Move it to skills/triage/SKILL.md.",
  ]);
});

test("a folder without SKILL.md is rejected", async () => {
  const result = await errorsFor({ "skills/empty/README.md": "x\n" });
  assert.deepEqual(result.errors, ["skills/empty: the folder has no SKILL.md."]);
});

test("a lowercase skill.md is rejected, because the CLI needs SKILL.md", async () => {
  const result = await errorsFor({ "skills/low/skill.md": skill("low", '"Use when low."') });
  assert.deepEqual(result.errors, [
    "skills/low/skill.md: rename the file to SKILL.md.",
    "skills/low: the folder has no SKILL.md.",
  ]);
});

test("a name that is not equal to the folder name is rejected", async () => {
  const result = await errorsFor({ "skills/alpha/SKILL.md": skill("beta", '"Use when alpha."') });
  assert.deepEqual(result.errors, [
    'skills/alpha/SKILL.md: name "beta" must be equal to the folder name "alpha".',
  ]);
});

test("a name with characters other than lowercase letters, digits and hyphens is rejected", async () => {
  const result = await errorsFor({ "skills/Bad_Name/SKILL.md": skill("Bad_Name", '"Use when bad."') });
  assert.deepEqual(result.errors, [
    'skills/Bad_Name/SKILL.md: name "Bad_Name" must use only a-z, 0-9 and single hyphens, with no hyphen at the start or end, and have 64 characters or fewer.',
  ]);
});

test("an unquoted description with a second colon is rejected (the code-review bug)", async () => {
  const result = await errorsFor({
    "skills/code-review/SKILL.md": skill(
      "code-review",
      "Review a change on two axes: standards compliance and specification fidelity.",
    ),
  });
  assert.deepEqual(result.errors, [
    "skills/code-review/SKILL.md: line 3: description must be a double-quoted string.",
  ]);
});

test("missing frontmatter, missing keys and empty values are rejected", async () => {
  const result = await errorsFor({
    "skills/no-front/SKILL.md": "# No frontmatter\n",
    "skills/no-desc/SKILL.md": "---\nname: no-desc\n---\n",
    "skills/no-name/SKILL.md": '---\ndescription: "Use when x."\n---\n',
    "skills/empty-desc/SKILL.md": '---\nname: empty-desc\ndescription: ""\n---\n',
    "skills/unclosed/SKILL.md": '---\nname: unclosed\ndescription: "Use when x."\n',
  });
  assert.deepEqual(result.errors, [
    "skills/empty-desc/SKILL.md: description must not be empty.",
    "skills/no-desc/SKILL.md: description is missing.",
    "skills/no-front/SKILL.md: the file must start with a --- frontmatter line.",
    "skills/no-name/SKILL.md: name is missing.",
    "skills/unclosed/SKILL.md: the frontmatter has no closing --- line.",
  ]);
});

test("parseFrontmatter reads a double-quoted value with escapes", () => {
  const text = '---\nname: a\ndescription: "Say \\"hi\\": now."\n---\nbody\n';
  assert.deepEqual(parseFrontmatter(text), { name: "a", description: 'Say "hi": now.' });
});

test("parseFrontmatter rejects an invalid escape, a duplicate key and an unknown key", () => {
  assert.throws(
    () => parseFrontmatter('---\nname: a\ndescription: "bad \\q escape"\n---\n'),
    { message: "line 3: description is not a valid double-quoted string." },
  );
  assert.throws(
    () => parseFrontmatter('---\nname: a\nname: b\ndescription: "x"\n---\n'),
    { message: 'line 3: duplicate key "name".' },
  );
  assert.throws(
    () => parseFrontmatter('---\nname: a\ndescription: "x"\nversion: 1\n---\n'),
    { message: 'line 4: unknown key "version". Use only name and description.' },
  );
  assert.throws(
    () => parseFrontmatter('---\nname: a\n  continued\ndescription: "x"\n---\n'),
    { message: 'line 3: expected "key: value".' },
  );
});

test("parseFrontmatter accepts CRLF line endings", () => {
  const text = '---\r\nname: a\r\ndescription: "x"\r\n---\r\n';
  assert.deepEqual(parseFrontmatter(text), { name: "a", description: "x" });
});

test("the CLI exits 1 and prints each error for a bad tree", async () => {
  const root = await makeTree({ "skills/flat.md": skill("flat", '"x"') });
  try {
    const run = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /skills\/flat\.md: a skill must be in skills\/<name>\/SKILL\.md/);
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 0 and prints the skill count for a good tree", async () => {
  const root = await makeTree({ "skills/one/SKILL.md": skill("one", '"x"') });
  try {
    const run = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    assert.equal(run.stderr, "");
    assert.equal(run.status, 0);
    assert.equal(run.stdout, "1 skill(s) valid: one\n");
  } finally {
    await removeTree(root);
  }
});

test("the CLI exits 1 when the skills folder does not exist", async () => {
  const root = await makeTree({ "README.md": "x\n" });
  try {
    const run = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /skills: the folder does not exist\./);
  } finally {
    await removeTree(root);
  }
});

test("a name with 64 characters passes and a name with 65 characters fails", async () => {
  const ok = "a".repeat(64);
  const long = "a".repeat(65);
  const result = await errorsFor({
    [`skills/${ok}/SKILL.md`]: skill(ok, '"Use when long."'),
    [`skills/${long}/SKILL.md`]: skill(long, '"Use when long."'),
  });
  assert.deepEqual(result.skills, [ok]);
  assert.deepEqual(result.errors, [
    `skills/${long}/SKILL.md: name "${long}" must use only a-z, 0-9 and single hyphens, with no hyphen at the start or end, and have 64 characters or fewer.`,
  ]);
});

test("a description with 1024 characters passes and one with 1025 characters fails", async () => {
  const result = await errorsFor({
    "skills/fits/SKILL.md": skill("fits", `"${"d".repeat(1024)}"`),
    "skills/over/SKILL.md": skill("over", `"${"d".repeat(1025)}"`),
  });
  assert.deepEqual(result.skills, ["fits"]);
  assert.deepEqual(result.errors, [
    "skills/over/SKILL.md: description must have 1024 characters or fewer.",
  ]);
});

test("a name that YAML reads as null, a boolean, a number or a date is rejected", async () => {
  const bad = ["null", "true", "false", "yes", "no", "on", "off", "y", "n", "123", "0x1f", "0o17", "0b101", "1e3", "1e-3", "10e-10", "9e-9", "1e9", "2026-10-26"];
  const files = { "skills/null-check/SKILL.md": skill("null-check", '"Use when x."') };
  for (const name of bad) files[`skills/${name}/SKILL.md`] = skill(name, '"Use when x."');
  const result = await errorsFor(files);
  assert.deepEqual(result.skills, ["null-check"]);
  assert.deepEqual(
    result.errors,
    [...bad]
      .sort()
      .map((name) => `skills/${name}/SKILL.md: name "${name}" is not a string in YAML. Use a word that YAML does not read as null, a boolean, a number or a date.`),
  );
});
