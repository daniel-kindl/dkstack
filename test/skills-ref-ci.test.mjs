import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");
const steps = workflow.split(/\n(?= {6}- name: )/).slice(1);
const REQUIREMENTS = ".github/skills-ref-requirements.txt";
const COMMIT = "83021e2be457a9b6679148719c1f6074f0ad975e";

test("each Python package for the reference check has an exact version and a hash", async () => {
  const text = await readFile(join(repoRoot, REQUIREMENTS), "utf8");
  const lines = text.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
  assert.ok(lines.length >= 4, "the requirements list the packages");
  for (const line of lines) {
    assert.match(line, /^[a-z0-9-]+==[0-9][0-9A-Za-z.]* --hash=sha256:[0-9a-f]{64}$/, line);
  }
  const names = lines.map((line) => line.split("==")[0]);
  for (const name of ["click", "strictyaml", "python-dateutil", "hatchling"]) {
    assert.ok(names.includes(name), `${REQUIREMENTS} pins ${name}`);
  }
});

test("CI installs the reference check only from hashed pins and the pinned commit", () => {
  const step = steps.find((s) => s.includes("skills-ref-venv"));
  assert.ok(step, "a validate step makes the skills-ref environment");
  assert.match(step, new RegExp(`--require-hashes --only-binary :all: -r ${REQUIREMENTS.replace(/\./g, "\\.")}`));
  assert.match(step, new RegExp(`--no-deps --no-build-isolation\\s*\\\\?\\s*'git\\+https://github\\.com/agentskills/agentskills\\.git@${COMMIT}#subdirectory=skills-ref'`));
  const installs = step.match(/pip install/g) ?? [];
  assert.equal(installs.length, 2, "only the two pinned installs");
  assert.match(step, /npm run validate:skills-ref$/m);
});

test("one npm script runs the Python tests and the reference check, in CI and locally", () => {
  assert.equal(
    pkg.scripts["validate:skills-ref"],
    "python3 -m unittest discover -s test -p test_ref_spec.py && python3 scripts/check-agent-skills-ref.py",
  );
  assert.ok(!workflow.includes("python3 -m unittest"), "CI uses the npm script, not a second command");
});

const AUDIT_REQUIREMENTS = ".github/pip-audit-requirements.txt";
const AUDIT_STEP = "Audit the Python packages for known vulnerabilities";

test("each Python package for the audit tool has an exact version and a hash", async () => {
  const text = await readFile(join(repoRoot, AUDIT_REQUIREMENTS), "utf8");
  const lines = text.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
  for (const line of lines) {
    assert.match(line, /^[a-z0-9-]+==[0-9][0-9A-Za-z.]*( --hash=sha256:[0-9a-f]{64})+$/, line);
  }
  assert.ok(lines.some((line) => line.startsWith("pip-audit==")), `${AUDIT_REQUIREMENTS} pins pip-audit`);
});

test("CI audits the pinned Python packages and fails on a known vulnerability", () => {
  const step = steps.find((s) => s.startsWith(`      - name: ${AUDIT_STEP}\n`));
  assert.ok(step, `validate has the step "${AUDIT_STEP}"`);
  assert.match(step, new RegExp(`--require-hashes --only-binary :all: -r ${AUDIT_REQUIREMENTS.replace(/\./g, "\\.")}`));
  assert.match(step, new RegExp(`pip-audit --strict --require-hashes --disable-pip -r ${REQUIREMENTS.replace(/\./g, "\\.")}$`, "m"));
  // Nothing may hide a finding: no ignore list, no forced success and no soft failure.
  assert.doesNotMatch(step, /--ignore-vuln|\|\| *true|continue-on-error|set \+e/);
  assert.equal((step.match(/pip install/g) ?? []).length, 1, "only the one pinned install");
});

test("Dependabot proposes updates for the pinned Python packages", async () => {
  const text = await readFile(join(repoRoot, ".github/dependabot.yml"), "utf8");
  const entries = text.split(/\n(?=  - package-ecosystem: )/).slice(1);
  const pip = entries.find((e) => e.includes('package-ecosystem: "pip"'));
  assert.ok(pip, "dependabot.yml has a pip entry");
  assert.match(pip, /directory: "\/\.github"/);
  assert.match(pip, /interval: "weekly"/);
});
