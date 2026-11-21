import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillFile = join(repoRoot, "skills", "bootstrap", "SKILL.md");

// Return the text of step <n> in the Steps list of the bootstrap skill.
async function step(n) {
  const text = await readFile(skillFile, "utf8");
  const m = new RegExp(`^${n}\\. ([\\s\\S]*?)(?=^\\d+\\. |^## )`, "m").exec(text);
  assert.ok(m, `the bootstrap skill must have step ${n}`);
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
test("bootstrap step 7 links the supply chain rules and does not copy them", async () => {
  const seven = await step(7);
  assert.ok(seven.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules)"));
  assert.doesNotMatch(seven, /full commit SHA|lockfile|vulnerability audit/);
  const text = await readFile(skillFile, "utf8");
  assert.doesNotMatch(text, /^8\. /m, "the supply chain steps 8 to 11 are now one step");
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

test("bootstrap step 1 sets LF line endings in .gitattributes", async () => {
  assert.match(await step(1), /`\.gitattributes` with `\* text=auto eol=lf`/);
});

test("the bootstrap CI step runs on every pull request", async () => {
  assert.match(await step(3), /every pull request/);
});
