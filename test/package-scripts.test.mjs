import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

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

test("the validate workflow runs the CHANGELOG diff mode", () => {
  assert.match(workflow, /^\s+run: node scripts\/check-changelog\.mjs --diff\s*$/m);
});

test("no script only prints text", () => {
  for (const [name, command] of Object.entries(pkg.scripts)) {
    assert.doesNotMatch(command, /^\s*echo\b/, `script "${name}" only prints text`);
  }
});

test("npm run check and the validate workflow run the map, glossary, ADR and suppression checks", () => {
  for (const name of ["maps", "context", "adrs", "suppressions"]) {
    assert.equal(pkg.scripts[`check:${name}`], `node scripts/check-${name}.mjs`);
    assert.match(pkg.scripts.check, new RegExp(`npm run check:${name} &&`));
    assert.match(workflow, new RegExp(`^\\s+run: npm run check:${name}\\s*$`, "m"));
  }
});

test("the validate workflow fetches the history that check-adrs and check-suppressions compare with", () => {
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

// The Low on #190: a git log error must fail the push title step.
function runPushStep(gitScript) {
  const step = validateSteps.find((s) => /github\.event_name == 'push'/.test(s) && /check-title/.test(s));
  const script = step.slice(step.indexOf("run: |") + "run: |".length)
    .split("\n").map((l) => l.replace(/^ {10}/, "")).join("\n");
  const bin = mkdtempSync(join(tmpdir(), "fake-git-"));
  writeFileSync(join(bin, "git"), `#!/bin/sh\n${gitScript}\n`, { mode: 0o755 });
  try {
    return spawnSync("bash", ["-c", script], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, BEFORE: "a", GITHUB_SHA: "b" },
    });
  } finally {
    rmSync(bin, { recursive: true, force: true });
  }
}

test("the push title step fails when git log fails", { skip: process.platform === "win32" }, () => {
  const result = runPushStep('[ "$1" = log ] && { echo "fatal: bad range" >&2; exit 128; }\nexit 0');
  assert.notEqual(result.status, 0);
});

test("the push title step checks each title that git log gives", { skip: process.platform === "win32" }, () => {
  const good = runPushStep('[ "$1" = log ] && printf "docs: one\\nfix: two\\n"\nexit 0');
  assert.equal(good.status, 0, good.stderr);
  const bad = runPushStep('[ "$1" = log ] && printf "docs: one\\nnot a title\\n"\nexit 0');
  assert.equal(bad.status, 1);
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
  for (const flag of ["--experimental-test-coverage", "--test-coverage-include=scripts/**",
    "--test-coverage-lines=95", "--test-coverage-branches=90"]) {
    assert.ok(command.includes(flag), flag);
  }
  assert.match(command, /test\/\*\.test\.mjs$/);
  // The Low on #242: cmd.exe passes quotes on as text, and then no file matches.
  assert.doesNotMatch(command, /['"]/);
});
