import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");

test("npm run check runs the CHANGELOG check", () => {
  assert.equal(pkg.scripts["check:changelog"], "node scripts/check-changelog.mjs");
  assert.match(pkg.scripts.check, /npm run check:changelog &&/);
});

test("the validate workflow runs the CHANGELOG check", () => {
  assert.match(workflow, /^\s+run: npm run check:changelog\s*$/m);
});

test("no script only prints text", () => {
  for (const [name, command] of Object.entries(pkg.scripts)) {
    assert.doesNotMatch(command, /^\s*echo\b/, `script "${name}" only prints text`);
  }
});

test("npm run check and the validate workflow run the map, glossary and ADR checks", () => {
  for (const name of ["maps", "context", "adrs"]) {
    assert.equal(pkg.scripts[`check:${name}`], `node scripts/check-${name}.mjs`);
    assert.match(pkg.scripts.check, new RegExp(`npm run check:${name} &&`));
    assert.match(workflow, new RegExp(`^\\s+run: npm run check:${name}\\s*$`, "m"));
  }
});

test("the validate workflow fetches the history that check-adrs compares with", () => {
  const checkout = /- name: Check out the repository\n([\s\S]*?)(?=\n\s+- name: )/.exec(workflow);
  assert.ok(checkout, "the validate workflow must have a checkout step");
  assert.match(checkout[1], /uses: actions\/checkout@[0-9a-f]{40}/);
  assert.match(checkout[1], /^\s+fetch-depth: 0$/m);
});

// FRG-2 in #154: a check that is in package.json but not wired into
// "npm run check" or the validate workflow does not protect main.
const validateSteps = workflow.split(/\n(?= {6}- name: )/).slice(1);
const ALWAYS = "if: ${{ !cancelled() && steps.node.outcome == 'success' }}";
const stepFor = (command) => validateSteps.find((s) => new RegExp(`^\\s+run: ${command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m").test(s));

test("each check script is in npm run check and has a validate step that runs after a failure", () => {
  const names = Object.keys(pkg.scripts).filter((n) => n.startsWith("check:") && n !== "check:title");
  assert.ok(names.length >= 8, "the check scripts");
  const chain = pkg.scripts.check.split(" && ");
  for (const name of names) {
    assert.ok(chain.includes(`npm run ${name}`), `"npm run check" runs ${name}`);
    const step = stepFor(`npm run ${name}`);
    assert.ok(step, `a validate step runs ${name}`);
    assert.ok(step.includes(ALWAYS), `the ${name} step runs after an earlier failure`);
  }
  assert.equal(chain.at(-1), "npm test");
  assert.ok(stepFor("npm test")?.includes(ALWAYS), "the validate workflow runs the tests");
});

test("validate checks the pull request title and each pushed commit title", () => {
  const pr = validateSteps.find((s) => /node scripts\/check-title\.mjs "\$TITLE"/.test(s));
  assert.ok(pr, "a pull request title step");
  assert.match(pr, /github\.event_name == 'pull_request'/);
  assert.match(pr, /TITLE: \$\{\{ github\.event\.pull_request\.title \}\}/);
  const push = validateSteps.find((s) => /github\.event_name == 'push'/.test(s) && /check-title/.test(s));
  assert.ok(push, "a push title step");
  assert.match(push, /BEFORE: \$\{\{ github\.event\.before \}\}/);
  assert.match(push, /git log --format=%s "\$BEFORE\.\.\$GITHUB_SHA"/);
  assert.match(push, /node scripts\/check-title\.mjs "\$title"/);
});

// FRG-11, SEN-19 and SCR-16 in #154: one Node version in package.json and in
// each workflow, and no dependency without a lockfile.
test("engines.node matches the node-version of each workflow", async () => {
  assert.equal(pkg.engines?.node, ">=24");
  for (const file of ["validate.yml", "release.yml"]) {
    const text = await readFile(join(repoRoot, ".github/workflows", file), "utf8");
    const versions = [...text.matchAll(/node-version: (\S+)/g)].map((m) => m[1]);
    assert.ok(versions.length > 0, `${file} sets node-version`);
    for (const v of versions) assert.equal(`>=${v}`, pkg.engines.node, `${file}: node-version ${v}`);
  }
});

test("a dependency needs a lockfile, and CONTRIBUTING.md records the exception until then", async () => {
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(repoRoot);
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  if (deps.length > 0) assert.ok(files.includes("package-lock.json"), "add package-lock.json with the first dependency");
  const contributing = (await readFile(join(repoRoot, "CONTRIBUTING.md"), "utf8")).replace(/\s+/g, " ");
  for (const fact of ["no npm dependencies", "no lockfile and no audit", "Add both with the first dependency."]) {
    assert.ok(contributing.includes(fact), fact);
  }
});

test("the repository has an .editorconfig with LF line endings", async () => {
  const text = await readFile(join(repoRoot, ".editorconfig"), "utf8");
  assert.match(text, /^root = true$/m);
  assert.match(text, /^end_of_line = lf$/m);
});

// FRG-M6 in #154: npm test fails when the scripts lose coverage. Node reads
// each threshold as a whole number.
test("npm test gates the coverage of scripts/ at 95% of lines and 90% of branches", () => {
  const command = pkg.scripts.test;
  for (const flag of ["--experimental-test-coverage", "--test-coverage-include='scripts/**'",
    "--test-coverage-lines=95", "--test-coverage-branches=90"]) {
    assert.ok(command.includes(flag), flag);
  }
  assert.match(command, /test\/\*\.test\.mjs$/);
});
