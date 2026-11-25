import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { spawnSync } from "node:child_process";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
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
test("bootstrap step 5 and setup-supply-chain link the supply chain rules and do not copy them", async () => {
  const link = "(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules)";
  const five = await step(5);
  assert.ok(five.includes(link));
  assert.ok(five.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-supply-chain/SKILL.md)"));
  const block = await step(1, "setup-supply-chain");
  assert.ok(block.includes(link));
  for (const text of [five, block]) {
    assert.doesNotMatch(text, /full commit SHA|lockfile|vulnerability audit/);
  }
  const text = await readFile(skillFile, "utf8");
  assert.doesNotMatch(text, /^(?:9|\d{2})\. /m, "bootstrap has eight steps");
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

// The format checks of #174. A consumer copies them from a fixed release tag.
test("setup-quality-gates copies the format checks from a pinned tag and makes them required", async () => {
  const four = (await step(4, "setup-quality-gates")).replace(/\s+/g, " ");
  for (const name of ["check-maps.mjs", "check-context.mjs", "check-adrs.mjs"]) {
    assert.ok(four.includes(`\`${name}\``), `step 4 must name ${name}`);
  }
  assert.match(four, /from a fixed dkstack release tag, for example `v1\.6\.0`/);
  assert.match(four, /Do not copy them from `main`, from `v1` or from a URL at run time\./);
  assert.match(four, /The checks are required\. A failed check blocks the merge\./);
  assert.match(four, /A missing `docs\/maps\/` folder or a missing `CONTEXT\.md` is a pass\./);
  assert.match(four, /Do not change the copied scripts\./);
  const three = await step(3);
  assert.match(three, /copy the dkstack format checks/);
});

// #304: the skill copies the title, dash and writing checks too. Each copied script must run
// from a folder with no other dkstack file, so the list names each file that a script imports.
const COPIED = [
  "check-maps.mjs", "check-context.mjs", "check-adrs.mjs",
  "check-title.mjs", "check-dashes.mjs", "check-writing.mjs",
  "check-links.mjs", "markdown-files.mjs", "pr-event.mjs",
];

test("setup-quality-gates step 4 lists each copied script and the title steps", async () => {
  const four = (await step(4, "setup-quality-gates")).replace(/\s+/g, " ");
  for (const name of COPIED) assert.ok(four.includes(`\`${name}\``), `step 4 must name ${name}`);
  assert.ok(four.includes("node scripts/check-title.mjs --event"));
  assert.match(four, /node scripts\/check-title\.mjs -- "<commit title>"/);
  const skill = await readFile(join(repoRoot, "skills", "setup-quality-gates", "SKILL.md"), "utf8");
  for (const word of [/github/i, /gitlab/i, /npm\b/i, /pnpm/i, /yarn/i, /dependabot/i, /renovate/i]) {
    assert.doesNotMatch(skill.replace(/https:\/\/\S+/g, ""), word);
  }
});

test("each copied script imports only a Node module or a copied script", async () => {
  for (const name of COPIED) {
    const text = await readFile(join(repoRoot, "scripts", name), "utf8");
    for (const [, from] of text.matchAll(/^import .* from "([^"]+)";/gm)) {
      const ok = from.startsWith("node:") || (from.startsWith("./") && COPIED.includes(from.slice(2)));
      assert.ok(ok, `${name} imports ${from}`);
    }
  }
});

test("each copied script runs alone in an empty folder", async () => {
  const dir = await mkdtemp(join(tmpdir(), "copied-"));
  try {
    for (const name of COPIED) await copyFile(join(repoRoot, "scripts", name), join(dir, name));
    for (const args of [["check-title.mjs", "feat: add a check"], ["check-dashes.mjs"], ["check-writing.mjs"]]) {
      const [script, ...rest] = args;
      const { status, stderr } = spawnSync(process.execPath, [join(dir, script), ...rest], { cwd: dir, encoding: "utf8" });
      assert.ok(status === 0 || !/ERR_MODULE_NOT_FOUND|Cannot find/.test(stderr), `${script}: ${stderr}`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ATL-9, IRIS-6, REED-4 and SCR-M7 in #154: a project has one place for its
// exceptions to dkstack rules.
// Since #290 bootstrap step 1 runs setup-dkstack, and setup-dkstack step 3 copies the sample.
test("bootstrap step 1 copies sample-AGENTS.md, which has an Exceptions section", async () => {
  assert.ok((await step(1)).includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-dkstack/SKILL.md)"));
  assert.ok((await step(3, "setup-dkstack")).includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/sample-AGENTS.md)"));
  const sample = await readFile(join(repoRoot, "sample-AGENTS.md"), "utf8");
  assert.ok(sample.includes("dkstack owns all other rules. Record project exceptions and project facts below."));
  const exceptions = sample.slice(sample.indexOf("## Exceptions\n"));
  assert.ok(sample.includes("## Exceptions\n"));
  for (const field of ["dkstack rule:", "Project rule:", "Reason:"]) assert.ok(exceptions.includes(field), field);
});

test("AGENTS.md Precedence has an example exception record, and quality gates link it", async () => {
  const agents = await readFile(join(repoRoot, "AGENTS.md"), "utf8");
  const precedence = agents.slice(agents.indexOf("## Precedence\n"), agents.indexOf("## Hard limits\n"));
  for (const field of ["- dkstack rule:", "- Project rule:", "- Reason:"]) assert.ok(precedence.includes(field), field);
  const gates = await readFile(join(repoRoot, "coding", "quality-gates.md"), "utf8");
  assert.ok(gates.includes("(../AGENTS.md#precedence)"));
});

// SEN-M4, FRG-M3 and REED-MISS-3 in #154: bootstrap protects the repository
// and checks that the README tells a new reader what they need.
test("bootstrap step 6 runs setup-repo-protection, which covers each protection", async () => {
  const six = await step(6);
  assert.ok(six.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-repo-protection/SKILL.md)"));
  const block = (await readFile(join(repoRoot, "skills", "setup-repo-protection", "SKILL.md"), "utf8")).replace(/\s+/g, " ");
  for (const phrase of ["pull request", "required checks", "squash", "linear history", "force-push", "deletion",
    "No bypass for administrators", "release tags", "release branches", "secret scanning", "push protection",
    "private vulnerability reporting", "`SECURITY.md`", "`CODEOWNERS`", "owner's OK"]) {
    assert.ok(block.includes(phrase), phrase);
  }
  assert.ok(block.includes("(https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md#ci-workflows)"));
  const names = [/github/i, /gitlab/i, /gitea/i, /\bgh\b/, /dependabot/i];
  for (const name of names) assert.doesNotMatch(block.replace(/https:\/\/\S+/g, ""), name);
});

test("bootstrap step 8 checks that the README says what the project is and how to use it", async () => {
  const eight = (await step(8)).replace(/\s+/g, " ");
  for (const phrase of ["what the project is", "who it is for", "how to install", "how to run", "how to contribute"]) {
    assert.ok(eight.includes(phrase), phrase);
  }
});
