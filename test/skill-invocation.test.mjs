import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseFrontmatter } from "../scripts/check-skills.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/";
const raw = (path) => readFile(join(repoRoot, path), "utf8");
const front = async (name) => parseFrontmatter(await raw(`skills/${name}/SKILL.md`));

// Issue #167: building blocks and invocation classes.
const REVIEW_ATOMS = ["review-spec", "review-standards", "review-blast-radius", "verify-claim"];
const SETUP_ATOMS = ["setup-editorconfig", "setup-quality-gates", "setup-versioning", "setup-supply-chain", "setup-labels"];

function classOf(fields) {
  if (fields["disable-model-invocation"] === true) return "user";
  if (fields["user-invocable"] === false) return "agent";
  return "both";
}

test("each building block is agent-only", async () => {
  for (const name of [...REVIEW_ATOMS, ...SETUP_ATOMS]) {
    assert.equal(classOf(await front(name)), "agent", name);
  }
});

test("release is user-only, because only the owner releases", async () => {
  assert.equal(classOf(await front("release")), "user");
});

test("code-review runs each review building block and bootstrap runs each setup building block", async () => {
  const review = await raw("skills/code-review/SKILL.md");
  for (const name of REVIEW_ATOMS) assert.ok(review.includes(`(${RAW}${name}/SKILL.md)`), name);
  const bootstrap = await raw("skills/bootstrap/SKILL.md");
  for (const name of SETUP_ATOMS) assert.ok(bootstrap.includes(`(${RAW}${name}/SKILL.md)`), name);
});

test("code-review keeps the anchors that other skills link", async () => {
  const review = await raw("skills/code-review/SKILL.md");
  for (const heading of ["## 2. Sources", "## 4. Specification axis", "## 5. Standards axis",
    "## 6. Blast radius", "## 8. Verify", "## Severity", "## Verdict", "## Output", "## Self-review"]) {
    assert.match(review, new RegExp(`^${heading}$`, "m"), heading);
  }
});

test("the review building blocks use the code-review severities and do not copy the table", async () => {
  for (const name of ["review-spec", "review-standards", "review-blast-radius"]) {
    const text = await raw(`skills/${name}/SKILL.md`);
    assert.ok(text.includes(`(${RAW}code-review/SKILL.md#severity)`), name);
    assert.doesNotMatch(text, /^\| Severity \|/m, `${name} copies the severity table`);
  }
});

test("verify-claim owns the five evidence levels", async () => {
  const text = (await raw("skills/verify-claim/SKILL.md")).replace(/\s+/g, " ");
  for (const level of ["1. Stated:", "2. Located:", "3. Reasoned:", "4. Run:", "5. Reproduced:"]) {
    assert.ok(text.includes(level), level);
  }
  assert.ok(text.includes("A required behavior below level 4 is unproven."));
});

test("the setup building blocks name no code host, package manager or update bot", async () => {
  for (const name of SETUP_ATOMS) {
    const text = (await raw(`skills/${name}/SKILL.md`)).replace(/https:\/\/\S+/g, "");
    for (const word of [/github/i, /\bgh\b/, /\bnpm\b/, /dependabot/i, /```ya?ml/]) {
      assert.doesNotMatch(text, word, `${name} names ${word}`);
    }
  }
});

test("skills/index.md gives each skill its invocation class", async () => {
  const index = await raw("skills/index.md");
  assert.match(index, /^## Invocation$/m);
  const folders = (await readdir(join(repoRoot, "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  for (const name of folders) {
    const want = classOf(await front(name));
    const line = index.split("\n").find((entry) => entry.trimStart().startsWith(`- [${name}](${name}/SKILL.md)`));
    assert.ok(line, `skills/index.md does not list ${name}`);
    assert.ok(line.includes(`(${want})`), `${name} must be marked (${want})`);
  }
});
