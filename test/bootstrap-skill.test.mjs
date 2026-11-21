import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillFile = join(repoRoot, "skills", "bootstrap", "SKILL.md");

// Return the text of step <n> in the Steps list of a skill. Since #167 the
// bootstrap steps live in the setup-* building blocks.
async function step(n, skill = "bootstrap") {
  const text = await readFile(join(repoRoot, "skills", skill, "SKILL.md"), "utf8");
  const m = new RegExp(`^${n}\\. ([\\s\\S]*?)(?=^\\d+\\. |^## |(?![\\s\\S]))`, "m").exec(text);
  assert.ok(m, `the ${skill} skill must have step ${n}`);
  return m[1];
}

// Skills are agent- and tool-agnostic (issue #57).
test("the bootstrap skill names no code host, package manager or update bot", async () => {
  // The dkstack links use the raw v1 URL form, so remove the URLs first.
  const text = (await readFile(skillFile, "utf8")).replace(/https:\/\/\S+/g, "");
  const names = [/github/i, /\.github\//, /\bgh\b/, /\bnpm\b/, /package-lock/, /package\.json/,
    /dependabot/i, /\byarn\b/i, /\bpnpm\b/i, /\bcargo\b/i, /\bdotnet\b/i, /\.NET\b/,
    /pip-audit/, /\bnuget\b/i, /```ya?ml/];
  for (const name of names) assert.doesNotMatch(text, name);
});

// The supply chain rules have one owner page. Bootstrap links it (#154).
test("bootstrap step 4 and setup-supply-chain link the supply chain rules and do not copy them", async () => {
  const link = "(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules)";
  const four = await step(4);
  assert.ok(four.includes(link));
  assert.ok(four.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-supply-chain/SKILL.md)"));
  const block = await step(1, "setup-supply-chain");
  assert.ok(block.includes(link));
  for (const text of [four, block]) {
    assert.doesNotMatch(text, /full commit SHA|lockfile|vulnerability audit/);
  }
  const text = await readFile(skillFile, "utf8");
  assert.doesNotMatch(text, /^[5-9]\. /m, "bootstrap has four steps, one for each building block");
});

test("the supply chain rules cover each rule that bootstrap applies", async () => {
  const page = await readFile(join(repoRoot, "coding", "dependencies.md"), "utf8");
  const rules = page.slice(page.indexOf("## Supply chain rules"), page.indexOf("## Good example")).replace(/\s+/g, " ");
  for (const phrase of [
    "full commit SHA",
    "Put the version in a comment",
    "Commit the lockfile",
    "fails when the lockfile does not agree with the dependency list",
    "vulnerability audit of the dependencies in CI on every pull request",
    "fail on high or critical findings",
    "dependency update proposals and vulnerability alerts",
    "the pinned CI actions",
    "at least weekly",
    "titles pass the title check",
    "least privilege",
  ]) {
    assert.ok(rules.includes(phrase), `missing: ${phrase}`);
  }
});

test("setup-editorconfig sets LF line endings in .gitattributes", async () => {
  assert.match(await step(1, "setup-editorconfig"), /`\.gitattributes` with `\* text=auto eol=lf`/);
});

test("the setup-quality-gates CI step runs on every pull request", async () => {
  assert.match(await step(2, "setup-quality-gates"), /every pull request/);
});
