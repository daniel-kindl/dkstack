import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  parseCommit,
  latestTag,
  nextVersion,
  releaseChangelog,
  releaseNotes,
  setPackageVersion,
  planSummary,
  checkEnvironment,
} from "../scripts/release.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "release.mjs");

const c = (subject, body = "") => ({ subject, body });

test("a commit title gives its type, scope, description and breaking flag", () => {
  assert.deepEqual(parseCommit(c("feat(skills): add a skill (#12)")), {
    type: "feat", scope: "skills", description: "add a skill (#12)", breaking: false,
  });
  assert.equal(parseCommit(c("fix!: drop a rule")).breaking, true);
  assert.equal(parseCommit(c("fix: drop a rule", "Text.\n\nBREAKING CHANGE: the rule is gone")).breaking, true);
  assert.equal(parseCommit(c("fix: drop a rule", "BREAKING-CHANGE: gone")).breaking, true);
  assert.equal(parseCommit(c("fix: mention a breaking change in prose")).breaking, false);
  assert.equal(parseCommit(c("update things")), null);
});

test("the latest tag is the highest v1.x.y by number, not by text", () => {
  assert.equal(latestTag(["v1.2.0", "v1.10.0", "v1.9.3", "v1", "v2.0.0", "v1.3.0-rc.1", "x"]), "v1.10.0");
  assert.equal(latestTag(["v2.0.0", "other"]), null);
});

test("feat gives minor, anything else gives patch", () => {
  assert.equal(nextVersion("1.3.0", [c("fix: a"), c("docs: b")]), "1.3.1");
  assert.equal(nextVersion("1.3.4", [c("fix: a"), c("feat(x): b")]), "1.4.0");
  assert.equal(nextVersion("1.3.4", [c("chore(deps): bump"), c("not conventional")]), "1.3.5");
});

test("the bump input can raise the version but not lower it", () => {
  assert.equal(nextVersion("1.3.4", [c("fix: a")], "minor"), "1.4.0");
  assert.equal(nextVersion("1.3.4", [c("fix: a")], "patch"), "1.3.5");
  assert.equal(nextVersion("1.3.4", [c("fix: a")], "auto"), "1.3.5");
  assert.throws(() => nextVersion("1.3.4", [c("feat: a")], "patch"), /bump "patch" is lower than the commits need \("minor"\)/);
  assert.throws(() => nextVersion("1.3.4", [c("fix: a")], "major"), /bump must be auto, patch or minor/);
});

test("a breaking change fails, because a major release needs Daniel", () => {
  assert.throws(() => nextVersion("1.3.0", [c("fix: a"), c("feat!: b")]), /breaking change in "feat!: b".*major release needs Daniel/);
  assert.throws(() => nextVersion("1.3.0", [c("fix: a", "BREAKING CHANGE: x")], "minor"), /major release needs Daniel/);
});

test("no commits since the last tag fails, and release commits do not count", () => {
  assert.throws(() => nextVersion("1.3.0", []), /no commits since v1\.3\.0/);
  assert.throws(() => nextVersion("1.3.0", [c("chore(release): prepare v1.3.0 (#134)")]), /no commits since v1\.3\.0/);
});

const CHANGELOG = [
  "# Changelog",
  "",
  "Intro.",
  "",
  "## [Unreleased]",
  "",
  "### Added",
  "",
  "- A new skill.",
  "",
  "## [1.3.0] - 2026-11-11",
  "",
  "### Removed",
  "",
  "- Old pages.",
  "",
  "[Unreleased]: https://github.com/daniel-kindl/dkstack/compare/v1.3.0...HEAD",
  "[1.3.0]: https://github.com/daniel-kindl/dkstack/compare/v1.2.0...v1.3.0",
  "",
].join("\n");

test("the Unreleased notes move into the new version section and the links update", () => {
  const out = releaseChangelog(CHANGELOG, {
    version: "1.4.0", previous: "1.3.0", date: "2026-11-12", commits: [c("feat: ignored")],
  });
  assert.equal(out, [
    "# Changelog",
    "",
    "Intro.",
    "",
    "## [Unreleased]",
    "",
    "## [1.4.0] - 2026-11-12",
    "",
    "### Added",
    "",
    "- A new skill.",
    "",
    "## [1.3.0] - 2026-11-11",
    "",
    "### Removed",
    "",
    "- Old pages.",
    "",
    "[Unreleased]: https://github.com/daniel-kindl/dkstack/compare/v1.4.0...HEAD",
    "[1.4.0]: https://github.com/daniel-kindl/dkstack/compare/v1.3.0...v1.4.0",
    "[1.3.0]: https://github.com/daniel-kindl/dkstack/compare/v1.2.0...v1.3.0",
    "",
  ].join("\n"));
});

test("an empty Unreleased section gets entries from the commit titles", () => {
  const empty = CHANGELOG.replace("### Added\n\n- A new skill.\n\n", "");
  const out = releaseChangelog(empty, {
    version: "1.4.0", previous: "1.3.0", date: "2026-11-12",
    commits: [
      c("fix(links): resolve tree URLs (#140)"),
      c("feat: add the release workflow (#139)"),
      c("docs: explain releases (#141)"),
      c("chore(release): prepare v1.3.0 (#134)"),
      c("not conventional"),
    ],
  });
  const section = out.slice(out.indexOf("## [1.4.0]"), out.indexOf("## [1.3.0]"));
  assert.equal(section, [
    "## [1.4.0] - 2026-11-12",
    "",
    "### Added",
    "",
    "- add the release workflow (#139)",
    "",
    "### Changed",
    "",
    "- docs: explain releases (#141)",
    "- not conventional",
    "",
    "### Fixed",
    "",
    "- links: resolve tree URLs (#140)",
    "",
    "",
  ].join("\n"));
  assert.match(out, /^## \[Unreleased\]\n\n## \[1\.4\.0\]/m);
});

test("a CHANGELOG with no Unreleased section or an existing version fails", () => {
  const args = { version: "1.4.0", previous: "1.3.0", date: "2026-11-12", commits: [c("fix: a")] };
  assert.throws(() => releaseChangelog(CHANGELOG.replace("## [Unreleased]", "## Next"), args), /no "## \[Unreleased\]" section/);
  assert.throws(() => releaseChangelog(CHANGELOG, { ...args, version: "1.3.0" }), /already has a "## \[1\.3\.0\]" section/);
});

test("the release notes are the body of one version section", () => {
  assert.equal(releaseNotes(CHANGELOG, "1.3.0"), "### Removed\n\n- Old pages.\n");
  assert.throws(() => releaseNotes(CHANGELOG, "9.9.9"), /no "## \[9\.9\.9\]" section/);
});

test("the package version changes and the rest of package.json stays", () => {
  const text = '{\n  "name": "dkstack",\n  "version": "1.3.0",\n  "private": true\n}\n';
  assert.equal(setPackageVersion(text, "1.4.0"), text.replace("1.3.0", "1.4.0"));
});

// Git end to end: a temporary repository with tags, commits and a v1 branch.
function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

function run(cwd, ...args) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "" } });
}

async function repo() {
  const root = await makeTree({
    "package.json": '{\n  "name": "dkstack",\n  "version": "1.3.0"\n}\n',
    "CHANGELOG.md": CHANGELOG.replace("### Added\n\n- A new skill.\n\n", ""),
  });
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@example.com");
  git(root, "config", "user.name", "t");
  git(root, "config", "tag.gpgSign", "false");
  git(root, "config", "commit.gpgSign", "false");
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "chore(release): prepare v1.3.0 (#134)");
  git(root, "tag", "-a", "v1.3.0", "-m", "v1.3.0");
  git(root, "branch", "v1");
  return root;
}

async function commit(root, subject, body = "") {
  await writeFile(join(root, `f${Math.random()}.txt`), "x");
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", subject, ...(body ? ["-m", body] : []));
}

test("prepare writes the next version and CHANGELOG from the commits since the tag", async () => {
  const root = await repo();
  try {
    await commit(root, "fix: one (#135)");
    await commit(root, "feat: two (#136)");
    const r = run(root, "prepare", "--bump", "auto", "--date", "2026-11-12");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, "version=1.4.0\nprevious=1.3.0\n");
    assert.equal(JSON.parse(await readFile(join(root, "package.json"), "utf8")).version, "1.4.0");
    const log = await readFile(join(root, "CHANGELOG.md"), "utf8");
    assert.match(log, /## \[1\.4\.0\] - 2026-11-12\n\n### Added\n\n- two \(#136\)\n\n### Fixed\n\n- one \(#135\)\n/);
  } finally {
    await removeTree(root);
  }
});

test("prepare fails and changes no file on a breaking change or no commits", async () => {
  const root = await repo();
  try {
    let r = run(root, "prepare", "--bump", "auto", "--date", "2026-11-12");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /no commits since v1\.3\.0/);
    await commit(root, "feat: x", "BREAKING CHANGE: y");
    r = run(root, "prepare", "--bump", "minor", "--date", "2026-11-12");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /major release needs Daniel/);
    assert.equal(git(root, "status", "--porcelain"), "");
  } finally {
    await removeTree(root);
  }
});

test("guard passes when the last release is complete", async () => {
  const root = await repo();
  try {
    await commit(root, "fix: one");
    const r = run(root, "guard", "--v1", "v1");
    assert.equal(r.status, 0, r.stderr);
  } finally {
    await removeTree(root);
  }
});

test("guard fails when the package version has no tag", async () => {
  const root = await repo();
  try {
    await writeFile(join(root, "package.json"), '{\n  "version": "1.4.0"\n}\n');
    git(root, "commit", "-qam", "chore(release): prepare v1.4.0 (#140)");
    const r = run(root, "guard", "--v1", "v1");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /package\.json version 1\.4\.0 has no tag v1\.4\.0/);
  } finally {
    await removeTree(root);
  }
});

test("guard fails when v1 does not contain the latest tag", async () => {
  const root = await repo();
  try {
    git(root, "branch", "-f", "v1", "HEAD");
    await commit(root, "fix: one");
    git(root, "tag", "-d", "v1.3.0");
    git(root, "tag", "-a", "v1.3.0", "-m", "v1.3.0");
    git(root, "branch", "-f", "v1", "HEAD~1");
    const r = run(root, "guard", "--v1", "v1");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /v1 does not contain v1\.3\.0/);
  } finally {
    await removeTree(root);
  }
});

test("notes prints the CHANGELOG section of a version", async () => {
  const root = await repo();
  try {
    const r = run(root, "notes", "1.3.0");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, "### Removed\n\n- Old pages.\n");
  } finally {
    await removeTree(root);
  }
});

test("the plan summary shows the version, the bump and each counted commit", () => {
  const text = planSummary({
    version: "1.4.0", previous: "1.3.0", bump: "auto",
    commits: [c("feat: two (#136)"), c("fix: one (#135)"), c("chore(release): prepare v1.3.0 (#134)")],
  });
  assert.equal(text, [
    "## Release v1.4.0",
    "",
    "- Previous release: v1.3.0",
    "- Bump input: auto",
    "- Approve the `release` environment only if v1.4.0 is the release you want.",
    "",
    "### Commits since v1.3.0",
    "",
    "- feat: two (#136)",
    "- fix: one (#135)",
    "",
  ].join("\n"));
});

// The shape of GET /repos/{owner}/{repo}/environments/{name}, trimmed.
const ENV = {
  name: "release",
  deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
  protection_rules: [
    { type: "required_reviewers", prevent_self_review: false,
      reviewers: [{ type: "User", reviewer: { login: "daniel-kindl", id: 74905817 } }] },
    { type: "branch_policy" },
  ],
};
const POLICIES = { total_count: 1, branch_policies: [{ name: "main", type: "branch" }] };

test("the release environment passes with Daniel as reviewer and main as the only branch", () => {
  assert.deepEqual(checkEnvironment(ENV, POLICIES, "daniel-kindl"), []);
});

test("the release environment fails with no reviewer, another reviewer or self-review blocked", () => {
  const rules = (r) => ({ ...ENV, protection_rules: r });
  assert.deepEqual(checkEnvironment(rules([{ type: "branch_policy" }]), POLICIES, "daniel-kindl"),
    ['the release environment must have "daniel-kindl" as a required reviewer']);
  assert.deepEqual(checkEnvironment(rules([{ ...ENV.protection_rules[0], reviewers: [{ type: "User", reviewer: { login: "someone" } }] }]), POLICIES, "daniel-kindl"),
    ['the release environment must have "daniel-kindl" as a required reviewer']);
  assert.deepEqual(checkEnvironment(rules([{ ...ENV.protection_rules[0], prevent_self_review: true }]), POLICIES, "daniel-kindl"),
    ['turn off "Prevent self-review" in the release environment, or daniel-kindl cannot approve a run that he started']);
});

test("the release environment fails unless main is the only deployment branch", () => {
  const open = { ...ENV, deployment_branch_policy: null };
  assert.deepEqual(checkEnvironment(open, POLICIES, "daniel-kindl"),
    ["the release environment must allow only the branch main (Deployment branches: Selected branches)"]);
  const prot = { ...ENV, deployment_branch_policy: { protected_branches: true, custom_branch_policies: false } };
  assert.deepEqual(checkEnvironment(prot, POLICIES, "daniel-kindl"),
    ["the release environment must allow only the branch main (Deployment branches: Selected branches)"]);
  const none = { ...ENV, deployment_branch_policy: { protected_branches: false, custom_branch_policies: false } };
  assert.deepEqual(checkEnvironment(none, POLICIES, "daniel-kindl"),
    ["the release environment must allow only the branch main (Deployment branches: Selected branches)"]);
  for (const policies of [
    { branch_policies: [] },
    { branch_policies: [{ name: "main", type: "branch" }, { name: "release/*", type: "branch" }] },
    { branch_policies: [{ name: "*", type: "branch" }] },
    { branch_policies: [{ name: "main", type: "tag" }] },
  ]) {
    assert.deepEqual(checkEnvironment(ENV, policies, "daniel-kindl"),
      ["the release environment must allow only the branch main (Deployment branches: Selected branches)"],
      JSON.stringify(policies));
  }
});

test("plan prints the version, writes the summary and changes no file", async () => {
  const root = await repo();
  try {
    await commit(root, "feat: two (#136)");
    const summary = join(root, "..", `summary-${Math.random()}.md`);
    const r = spawnSync(process.execPath, [script, "plan", "--bump", "auto"],
      { cwd: root, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "", GITHUB_STEP_SUMMARY: summary } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, "version=1.4.0\nprevious=1.3.0\n");
    assert.match(await readFile(summary, "utf8"), /^## Release v1\.4\.0\n[\s\S]*- feat: two \(#136\)\n/);
    assert.equal(git(root, "status", "--porcelain"), "");
  } finally {
    await removeTree(root);
  }
});

test("prepare fails and changes no file when the version is not the planned version", async () => {
  const root = await repo();
  try {
    await commit(root, "feat: two (#136)");
    let r = run(root, "prepare", "--bump", "auto", "--date", "2026-11-12", "--expect", "1.3.1");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /the version is 1\.4\.0, but the plan approved 1\.3\.1/);
    assert.equal(git(root, "status", "--porcelain"), "");
    r = run(root, "prepare", "--bump", "auto", "--date", "2026-11-12", "--expect", "1.4.0");
    assert.equal(r.status, 0, r.stderr);
  } finally {
    await removeTree(root);
  }
});

test("the environment command reads the two API files and exits 1 with each error", async () => {
  const root = await makeTree({
    "env.json": JSON.stringify({ ...ENV, protection_rules: [] }),
    "policies.json": JSON.stringify(POLICIES),
    "good.json": JSON.stringify(ENV),
  });
  try {
    let r = run(root, "environment", "env.json", "policies.json", "--reviewer", "daniel-kindl");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /must have "daniel-kindl" as a required reviewer/);
    r = run(root, "environment", "good.json", "policies.json", "--reviewer", "daniel-kindl");
    assert.equal(r.status, 0, r.stderr);
  } finally {
    await removeTree(root);
  }
});
