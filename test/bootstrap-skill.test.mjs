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
test("the bootstrap skill names no tool or platform", async () => {
  // The dkstack links use the raw v1 URL form, so remove the URLs first.
  const text = (await readFile(skillFile, "utf8")).replace(/https:\/\/\S+/g, "");
  const names = [/github/i, /\.github\//, /\bgh\b/, /\bnpm\b/, /package-lock/, /package\.json/,
    /dependabot/i, /\byarn\b/i, /\bpnpm\b/i, /\bcargo\b/i, /\bdotnet\b/i, /\.NET\b/,
    /pip-audit/, /\bnuget\b/i, /```ya?ml/];
  for (const name of names) assert.doesNotMatch(text, name);
});

test("the bootstrap steps cover each supply chain rule", async () => {
  assert.match(await step(7), /full commit SHA/);
  assert.match(await step(7), /version in a comment/);
  assert.match(await step(8), /least privilege/);
  assert.match(await step(9), /[Cc]ommit the lockfile/);
  assert.match(await step(9), /fails when the lockfile does not agree/);
  assert.match(await step(10), /vulnerability audit/);
  assert.match(await step(10), /every pull request/);
  assert.match(await step(10), /fail on high or critical/);
  assert.match(await step(11), /dependency update proposals and vulnerability alerts/);
  assert.match(await step(11), /pinned CI actions/);
});

test("the bootstrap CI step runs on every pull request", async () => {
  assert.match(await step(3), /every pull request/);
});
