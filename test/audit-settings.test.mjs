import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { auditSettings, fetchSettings, formatReport, codeownersRule } from "../scripts/audit-settings.mjs";
import { readFile } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "audit-settings.mjs");

// Recorded API responses of dkstack on 2026-11-22 (#302), cut to the fields
// that the audit reads.
const DKSTACK_REPO = {
  default_branch: "main",
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  delete_branch_on_merge: true,
  security_and_analysis: {
    secret_scanning: { status: "enabled" },
    secret_scanning_push_protection: { status: "enabled" },
  },
};
const PROTECT_MAIN = {
  id: 25879680,
  name: "protect-main",
  target: "branch",
  enforcement: "active",
  conditions: { ref_name: { exclude: [], include: ["~DEFAULT_BRANCH"] } },
  rules: [
    { type: "deletion" },
    { type: "non_fast_forward" },
    { type: "required_linear_history" },
    { type: "pull_request", parameters: { allowed_merge_methods: ["squash"] } },
    {
      type: "required_status_checks",
      parameters: { required_status_checks: [{ context: "validate", integration_id: 15368 }] },
    },
  ],
  bypass_actors: [{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" }],
};
const PROTECT_TAGS = {
  id: 26017783,
  name: "protect-release-tags",
  target: "tag",
  enforcement: "active",
  conditions: { ref_name: { exclude: [], include: ["refs/tags/v*"] } },
  rules: [{ type: "deletion" }, { type: "non_fast_forward" }, { type: "update" }],
  bypass_actors: [],
};
const PROTECT_V1 = {
  id: 26018688,
  name: "protect-v1",
  target: "branch",
  enforcement: "active",
  conditions: { ref_name: { exclude: [], include: ["refs/heads/v1"] } },
  rules: [{ type: "deletion" }, { type: "non_fast_forward" }],
  bypass_actors: [],
};

const ok = (body) => ({ status: 200, body });
const NOT_FOUND = { status: 404, error: "gh: Not Found (HTTP 404)" };
const FORBIDDEN = { status: 403, error: "gh: Resource not accessible by integration (HTTP 403)" };

function dkstackToday() {
  return {
    repo: ok(structuredClone(DKSTACK_REPO)),
    rulesets: ok(structuredClone([PROTECT_MAIN, PROTECT_TAGS, PROTECT_V1])),
    privateReporting: ok({ enabled: true }),
    files: {
      "SECURITY.md": ok("# Security policy\n"),
      ".github/SECURITY.md": NOT_FOUND,
      "docs/SECURITY.md": NOT_FOUND,
      ".github/CODEOWNERS": NOT_FOUND,
      CODEOWNERS: NOT_FOUND,
      "docs/CODEOWNERS": NOT_FOUND,
    },
  };
}

function allGood() {
  const data = dkstackToday();
  data.rulesets.body[0].bypass_actors = [];
  data.files[".github/CODEOWNERS"] = ok("# Owners\n/.github/workflows/ @daniel-kindl\n");
  return data;
}

const byName = (items) => Object.fromEntries(items.map((i) => [i.name, i]));

test("the audit of dkstack today reports the admin bypass and the missing CODEOWNERS", () => {
  const items = auditSettings(dkstackToday());
  const failed = items.filter((i) => i.status === "FAIL").map((i) => i.name);
  assert.deepEqual(failed, ["No bypass for administrators", "CODEOWNERS covers .github/workflows/"]);
  const named = byName(items);
  assert.equal(named["No bypass for administrators"].found, "protect-main: RepositoryRole 5 (always)");
  assert.match(named["CODEOWNERS covers .github/workflows/"].found, /no CODEOWNERS file/);
  assert.ok(items.every((i) => i.status !== "NOT RUN"));
});

test("a repository with all settings passes each item", () => {
  const items = auditSettings(allGood());
  assert.equal(items.length, 14);
  for (const item of items) assert.equal(item.status, "PASS", item.name);
  assert.equal(
    byName(items)["CODEOWNERS covers .github/workflows/"].found,
    ".github/CODEOWNERS: /.github/workflows/ @daniel-kindl",
  );
});

test("each finding says what was expected and what was found", () => {
  const data = allGood();
  Object.assign(data.repo.body, { allow_merge_commit: true, delete_branch_on_merge: false });
  data.repo.body.security_and_analysis.secret_scanning.status = "disabled";
  data.repo.body.security_and_analysis.secret_scanning_push_protection.status = "disabled";
  data.privateReporting = ok({ enabled: false });
  for (const path of ["SECURITY.md", ".github/SECURITY.md", "docs/SECURITY.md"]) data.files[path] = NOT_FOUND;
  const named = byName(auditSettings(data));
  assert.deepEqual(named["Squash merge only"], {
    name: "Squash merge only",
    status: "FAIL",
    expected: "squash on, merge commit off, rebase off",
    found: "squash on, merge commit on, rebase off",
  });
  assert.equal(named["Delete branch on merge"].found, "off");
  assert.equal(named["Secret scanning"].found, "disabled");
  assert.equal(named["Push protection"].found, "disabled");
  assert.equal(named["Private vulnerability reporting"].found, "off");
  assert.equal(named["SECURITY.md"].status, "FAIL");
  assert.equal(named["SECURITY.md"].found, "no file at SECURITY.md, .github/SECURITY.md or docs/SECURITY.md");
  for (const item of Object.values(named)) {
    assert.ok(item.expected && item.found, `${item.name} has expected and found`);
  }
});

test("a missing default branch ruleset fails each branch rule", () => {
  const data = allGood();
  data.rulesets.body = [PROTECT_TAGS, PROTECT_V1];
  const items = auditSettings(data);
  const branchItems = ["Pull request required", "Required status checks", "Required linear history",
    "No force-push", "No branch deletion", "No bypass for administrators"];
  for (const name of branchItems) {
    const item = byName(items)[name];
    assert.equal(item.status, "FAIL", name);
    assert.equal(item.found, "no active ruleset on the default branch");
  }
});

test("a ruleset that is not active, or a status check rule with no check, does not count", () => {
  const data = allGood();
  data.rulesets.body[0].enforcement = "evaluate";
  assert.equal(byName(auditSettings(data))["Pull request required"].status, "FAIL");
  const empty = allGood();
  empty.rulesets.body[0].rules[4].parameters.required_status_checks = [];
  assert.equal(byName(auditSettings(empty))["Required status checks"].found, "no rule");
});

test("a ruleset on refs/heads/<default> or ~ALL counts, and an exclude removes it", () => {
  const named = allGood();
  named.rulesets.body[0].conditions.ref_name.include = ["refs/heads/main"];
  assert.equal(byName(auditSettings(named))["No force-push"].status, "PASS");
  const all = allGood();
  all.rulesets.body[0].conditions.ref_name.include = ["~ALL"];
  assert.equal(byName(auditSettings(all))["No force-push"].status, "PASS");
  const excluded = allGood();
  excluded.rulesets.body[0].conditions.ref_name.include = ["~ALL"];
  excluded.rulesets.body[0].conditions.ref_name.exclude = ["refs/heads/main"];
  assert.equal(byName(auditSettings(excluded))["No force-push"].status, "FAIL");
  const noConditions = allGood();
  delete noConditions.rulesets.body[0].conditions;
  assert.equal(byName(auditSettings(noConditions))["No force-push"].status, "FAIL");
});

test("rules from two default branch rulesets add up", () => {
  const data = allGood();
  const [main] = data.rulesets.body;
  const second = { ...main, name: "extra", rules: main.rules.slice(3), bypass_actors: [] };
  main.rules = main.rules.slice(0, 3);
  data.rulesets.body.push(second);
  for (const item of auditSettings(data)) assert.equal(item.status, "PASS", item.name);
});

test("the tag ruleset must block update and deletion", () => {
  const data = allGood();
  data.rulesets.body[1].rules = [{ type: "deletion" }];
  const item = byName(auditSettings(data))["Release tags blocked from update and deletion"];
  assert.equal(item.status, "FAIL");
  assert.equal(item.found, "protect-release-tags: deletion");
  const none = allGood();
  none.rulesets.body = [none.rulesets.body[0]];
  assert.equal(byName(auditSettings(none))["Release tags blocked from update and deletion"].found, "no active tag ruleset");
});

test("an item with an unreadable response is NOT RUN, never PASS", () => {
  const data = allGood();
  data.repo = FORBIDDEN;
  data.rulesets = FORBIDDEN;
  data.privateReporting = FORBIDDEN;
  data.files["SECURITY.md"] = FORBIDDEN;
  data.files[".github/CODEOWNERS"] = FORBIDDEN;
  const items = auditSettings(data);
  for (const item of items) {
    assert.equal(item.status, "NOT RUN", item.name);
    assert.match(item.found, /HTTP 403/);
  }
});

test("the bypass list and the security fields are NOT RUN when the token cannot read them", () => {
  const data = allGood();
  delete data.rulesets.body[0].bypass_actors;
  delete data.repo.body.security_and_analysis;
  const named = byName(auditSettings(data));
  for (const name of ["No bypass for administrators", "Secret scanning", "Push protection"]) {
    assert.equal(named[name].status, "NOT RUN", name);
    assert.match(named[name].found, /not in the response/);
  }
  assert.equal(named["Pull request required"].status, "PASS");
});

test("a missing first file does not hide a later file that is not readable", () => {
  const data = allGood();
  data.files["SECURITY.md"] = NOT_FOUND;
  data.files[".github/SECURITY.md"] = FORBIDDEN;
  assert.equal(byName(auditSettings(data))["SECURITY.md"].status, "NOT RUN");
  data.files["docs/SECURITY.md"] = ok("policy");
  assert.equal(byName(auditSettings(data))["SECURITY.md"].status, "PASS");
});

test("codeownersRule finds the last rule that matches a workflow file", () => {
  const cases = [
    ["* @a", "* @a"],
    [".github/ @a", ".github/ @a"],
    ["/.github/workflows/** @a", "/.github/workflows/** @a"],
    [".github/workflows/*.yml @a", ".github/workflows/*.yml @a"],
    ["*.yml @a", "*.yml @a"],
    ["/.github/workflows/validate.yml @a\n# comment\n\n/docs/ @b", "/.github/workflows/validate.yml @a"],
    ["* @a\n/.github/workflows/", undefined],
    ["/docs/ @a\n/src/** @b", undefined],
    ["/.git @a", undefined],
    ["workflows/ @a", "workflows/ @a"],
  ];
  for (const [text, rule] of cases) assert.equal(codeownersRule(text), rule, JSON.stringify(text));
});

test("a CODEOWNERS file with no rule for the workflows fails", () => {
  const data = allGood();
  data.files[".github/CODEOWNERS"] = ok("/docs/ @a\n");
  const item = byName(auditSettings(data))["CODEOWNERS covers .github/workflows/"];
  assert.equal(item.status, "FAIL");
  assert.equal(item.found, ".github/CODEOWNERS: no rule with an owner covers .github/workflows/");
});

test("formatReport prints a line for each item and expected and found for each finding", () => {
  const text = formatReport(auditSettings(dkstackToday()));
  assert.match(text, /^PASS {5}Squash merge only$/m);
  assert.match(text, /^FAIL {5}No bypass for administrators\n {9}expected: no bypass actor in a default branch ruleset\n {9}found: protect-main: RepositoryRole 5 \(always\)$/m);
  assert.match(text, /^12 pass, 2 fail, 0 not run\.$/m);
});

// A fake gh records each call and answers from a map of API path to response.
function fakeGh(responses) {
  const calls = [];
  const get = (path) => {
    calls.push(path);
    return responses[path] ?? NOT_FOUND;
  };
  return { get, calls };
}

test("fetchSettings reads each endpoint with GET and decodes the files", () => {
  const r = "repos/o/r";
  const { get, calls } = fakeGh({
    [r]: ok(DKSTACK_REPO),
    [`${r}/rulesets?per_page=100`]: ok([{ id: 1 }, { id: 2 }]),
    [`${r}/rulesets/1`]: ok(PROTECT_MAIN),
    [`${r}/rulesets/2`]: ok(PROTECT_TAGS),
    [`${r}/private-vulnerability-reporting`]: ok({ enabled: true }),
    [`${r}/contents/SECURITY.md`]: ok({ content: Buffer.from("policy").toString("base64") }),
  });
  const data = fetchSettings("o/r", get);
  assert.equal(data.repo.body.default_branch, "main");
  assert.deepEqual(data.rulesets.body.map((s) => s.name), ["protect-main", "protect-release-tags"]);
  assert.deepEqual(data.files["SECURITY.md"], ok("policy"));
  assert.deepEqual(data.files.CODEOWNERS, NOT_FOUND);
  assert.equal(calls.length, 11);
});

test("fetchSettings gives the error when one ruleset is not readable", () => {
  const r = "repos/o/r";
  const { get } = fakeGh({
    [`${r}/rulesets?per_page=100`]: ok([{ id: 1 }, { id: 2 }]),
    [`${r}/rulesets/1`]: ok(PROTECT_MAIN),
    [`${r}/rulesets/2`]: FORBIDDEN,
  });
  assert.deepEqual(fetchSettings("o/r", get).rulesets, FORBIDDEN);
  assert.deepEqual(fetchSettings("o/x", get).rulesets, NOT_FOUND);
});

// The CLI tests put a fake gh first on PATH. It answers from files in a
// folder and logs each argument list.
function runCli(args, files = {}) {
  const bin = mkdtempSync(join(tmpdir(), "fake-gh-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(bin, name), JSON.stringify(content));
  const gh = [
    "#!/bin/sh",
    `echo "$*" >> "${bin}/calls.log"`,
    'eval "last=\\${$#}"',
    `file="${bin}/$(printf %s "$last" | tr '/?=' '___').json"`,
    'if [ -f "$file" ]; then cat "$file"; exit 0; fi',
    'echo \'{"message":"Not Found"}\'',
    'echo "gh: Not Found (HTTP 404)" >&2',
    "exit 1",
  ].join("\n");
  writeFileSync(join(bin, "gh"), `${gh}\n`, { mode: 0o755 });
  try {
    const run = spawnSync(process.execPath, [script, ...args], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });
    let calls = "";
    try {
      calls = spawnSync("cat", [join(bin, "calls.log")], { encoding: "utf8" }).stdout;
    } catch {
      calls = "";
    }
    return { ...run, calls };
  } finally {
    rmSync(bin, { recursive: true, force: true });
  }
}

const skipWin = { skip: process.platform === "win32" };

test("the CLI exits 2 with the usage when the repository argument is wrong", () => {
  for (const args of [[], ["dkstack"], ["a/b/c"], ["a/b", "extra"]]) {
    const run = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    assert.equal(run.status, 2, JSON.stringify(args));
    assert.equal(run.stderr, "usage: node scripts/audit-settings.mjs <owner/repo>\n");
  }
});

test("the CLI exits 1 for dkstack today and calls gh api with GET only", skipWin, () => {
  const p = "repos_daniel-kindl_dkstack";
  const run = runCli(["daniel-kindl/dkstack"], {
    [`${p}.json`]: DKSTACK_REPO,
    [`${p}_rulesets_per_page_100.json`]: [{ id: 1 }, { id: 2 }, { id: 3 }],
    [`${p}_rulesets_1.json`]: PROTECT_MAIN,
    [`${p}_rulesets_2.json`]: PROTECT_TAGS,
    [`${p}_rulesets_3.json`]: PROTECT_V1,
    [`${p}_private-vulnerability-reporting.json`]: { enabled: true },
    [`${p}_contents_SECURITY.md.json`]: { content: Buffer.from("policy").toString("base64") },
  });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /^Audit of daniel-kindl\/dkstack\n/);
  assert.match(run.stdout, /^FAIL {5}No bypass for administrators$/m);
  assert.match(run.stdout, /^12 pass, 2 fail, 0 not run\.$/m);
  const calls = run.calls.trim().split("\n");
  assert.equal(calls.length, 12);
  for (const call of calls) assert.match(call, /^api --method GET repos\/daniel-kindl\/dkstack(\/|$)/);
});

test("the CLI exits 2 when no item fails but an item is NOT RUN", skipWin, () => {
  const run = runCli(["o/r"]);
  assert.equal(run.status, 2);
  assert.match(run.stdout, /^NOT RUN  Squash merge only\n {9}expected: .*\n {9}found: HTTP 404/m);
  assert.match(run.stdout, /^0 pass, 0 fail, 14 not run\.$/m);
});

test("the CLI exits 0 when each item passes", skipWin, () => {
  const p = "repos_o_r";
  const run = runCli(["o/r"], {
    [`${p}.json`]: DKSTACK_REPO,
    [`${p}_rulesets_per_page_100.json`]: [{ id: 1 }, { id: 2 }],
    [`${p}_rulesets_1.json`]: { ...PROTECT_MAIN, bypass_actors: [] },
    [`${p}_rulesets_2.json`]: PROTECT_TAGS,
    [`${p}_private-vulnerability-reporting.json`]: { enabled: true },
    [`${p}_contents_SECURITY.md.json`]: { content: Buffer.from("policy").toString("base64") },
    [`${p}_contents_.github_CODEOWNERS.json`]: { content: Buffer.from("* @o\n").toString("base64") },
  });
  assert.equal(run.status, 0, run.stdout);
  assert.match(run.stdout, /^14 pass, 0 fail, 0 not run\.$/m);
});

test("the CLI says NOT RUN when gh is not installed", skipWin, () => {
  const run = spawnSync(process.execPath, [script, "o/r"], {
    encoding: "utf8",
    env: { ...process.env, PATH: "/nonexistent" },
  });
  assert.equal(run.status, 2);
  assert.match(run.stdout, /found: gh failed: /);
});

test("package.json has audit:settings, and npm run check and validate do not run it", async () => {
  const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
  const workflow = await readFile(join(repoRoot, ".github/workflows/validate.yml"), "utf8");
  assert.equal(pkg.scripts["audit:settings"], "node scripts/audit-settings.mjs");
  assert.doesNotMatch(pkg.scripts.check, /audit/);
  assert.doesNotMatch(workflow, /audit/);
});

test("setup-repo-protection step 1 links the audit tool", async () => {
  const text = await readFile(join(repoRoot, "skills/setup-repo-protection/SKILL.md"), "utf8");
  const step = text.split("\n").find((l) => l.startsWith("1. "));
  assert.ok(step.includes("https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/scripts/audit-settings.mjs"));
  assert.match(step, /The tool changes nothing\./);
});
