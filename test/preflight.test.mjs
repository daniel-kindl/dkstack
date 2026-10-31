import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG, CAPABILITIES, planPreflight } from "../scripts/preflight.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const PALETTE = {
  "type:feature": "1F6FEB",
  "type:bug": "D1242F",
  "type:refactor": "8250DF",
  "type:chore": "64748B",
  "type:docs": "0E8A93",
  "type:research": "C86B12",
  "status:triage": "B6BDC7",
  "status:planning": "A371F7",
  "status:ready": "238636",
  "status:active": "0969DA",
  "status:review": "BF8700",
  "agent:ready": "2DA44E",
  "agent:human-only": "CF222E",
  "priority:p0": "B60205",
  "priority:p1": "E8590C",
  "priority:p2": "D4A72C",
  "priority:p3": "6F879D",
  "needs:decision": "C69026",
  "needs:clarification": "D876E3",
};

function supported(overrides = {}) {
  return { ...Object.fromEntries(CAPABILITIES.map((name) => [name, true])), ...overrides };
}

function label(entry) {
  return { name: entry.name, color: entry.color, description: entry.description };
}

test("the catalog has the portable names, colors and descriptions", () => {
  assert.deepEqual(CATALOG.map((entry) => entry.name), Object.keys(PALETTE));
  for (const entry of CATALOG) {
    assert.equal(entry.color, PALETTE[entry.name]);
    assert.match(entry.description, /\S/);
  }
  assert.deepEqual(CAPABILITIES, [
    "issues",
    "labels",
    "milestones",
    "parent/sub-issues",
    "blocking links",
    "assignment",
    "comments",
    "PRs/reviews",
    "checks",
    "protection",
  ]);
});

test("the default preflight is a dry run and does not write", () => {
  const plan = planPreflight({ capabilities: supported(), labels: [] });
  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.creates.length, CATALOG.length);
  assert.deepEqual(plan.updates, []);
  assert.deepEqual(plan.removes, []);
  assert.match(plan.instruction, /Do not create labels/);
});

test("a second preflight after the creates has no new create", () => {
  const first = planPreflight({ capabilities: supported(), labels: [], apply: true });
  assert.equal(first.mode, "apply");
  assert.match(first.instruction, /create only the labels in creates/i);
  const second = planPreflight({
    capabilities: supported(),
    labels: first.creates,
    apply: true,
  });
  assert.deepEqual(second.creates, []);
  assert.deepEqual(second.updates, []);
  assert.deepEqual(second.removes, []);
  const third = planPreflight({
    capabilities: supported(),
    labels: first.creates,
    apply: true,
  });
  assert.deepEqual(third.creates, second.creates);
});

test("a different color or description is reported and not changed", () => {
  const current = CATALOG.map(label);
  current[0] = { ...current[0], color: "000000", description: "Custom text" };
  const plan = planPreflight({ capabilities: supported(), labels: current, apply: true });
  assert.deepEqual(plan.creates, []);
  assert.deepEqual(plan.updates, []);
  assert.deepEqual(plan.differs.map((item) => item.field).sort(), ["color", "description"]);
  assert.equal(plan.differs[0].name, "type:feature");
});

test("a label outside the catalog is kept", () => {
  const plan = planPreflight({
    capabilities: supported(),
    labels: [{ name: "team-bug", color: "AAAAAA", description: "Local" }],
    apply: true,
  });
  assert.deepEqual(plan.removes, []);
  assert.deepEqual(plan.kept, ["team-bug"]);
});

test("unsupported capabilities name a fallback and do not create labels", () => {
  const plan = planPreflight({ capabilities: supported({ labels: false }), labels: [], apply: true });
  const labels = plan.unsupported.find((item) => item.capability === "labels");
  assert.ok(labels);
  assert.match(labels.fallback, /Do not create labels/);
  assert.deepEqual(plan.creates, []);
  assert.equal(plan.unsupported.length, 1);
  assert.deepEqual(plan.unverified, []);
});

test("an unverified capability is not reported as unsupported", () => {
  const plan = planPreflight({
    capabilities: supported({
      "parent/sub-issues": "unverified",
      "blocking links": "unverified",
    }),
    labels: [],
  });
  assert.deepEqual(plan.unsupported, []);
  assert.deepEqual(plan.unverified.map((item) => item.capability), ["parent/sub-issues", "blocking links"]);
  assert.match(plan.unverified[0].fallback, /probe did not run/);
  assert.match(plan.unverified[0].fallback, /Do not report the capability as unsupported/);
  assert.match(plan.unverified[0].fallback, /fails closed/);
});

test("malformed input is rejected", () => {
  assert.throws(
    () => planPreflight({ capabilities: { issues: true }, labels: [] }),
    /capability record must set every capability to true, false or unverified/,
  );
  assert.throws(
    () => planPreflight({ capabilities: supported({ labels: "yes" }), labels: [] }),
    /capability record must set every capability to true, false or unverified/,
  );
  assert.throws(
    () => planPreflight({
      capabilities: supported(),
      labels: [
        { name: "type:bug", color: "D1242F", description: "A defect." },
        { name: "type:bug", color: "000000", description: "Other" },
      ],
    }),
    /duplicate label/,
  );
  assert.throws(
    () => planPreflight({
      capabilities: supported(),
      labels: [],
      issues: [{ id: "1", labels: ["type:bug", 2] }],
    }),
    /each issue label must be a non-empty string/,
  );
});

test("protection, settings and infrastructure stay owner-gated", () => {
  const plan = planPreflight({ capabilities: supported(), labels: [], apply: true });
  const actions = plan.ownerGated.map((item) => item.action);
  assert.deepEqual(actions, ["protection", "settings", "infrastructure"]);
  const encoded = JSON.stringify(plan.creates) + JSON.stringify(plan.updates) + JSON.stringify(plan.removes);
  assert.doesNotMatch(encoded, /protection|settings|infrastructure/);
});

test("cardinality and incomplete prerequisites are findings, not label edits", () => {
  const plan = planPreflight({
    capabilities: supported(),
    labels: CATALOG.map(label),
    apply: true,
    issues: [
      { id: "1", labels: ["type:bug", "type:docs", "status:ready", "agent:ready", "agent:human-only"] },
      { id: "2", labels: ["type:bug"], prerequisites: [{ id: "9", complete: false }] },
      { id: "3", labels: ["type:docs", "status:planning", "needs:decision", "needs:clarification"] },
    ],
  });
  assert.deepEqual(plan.updates, []);
  assert.deepEqual(plan.removes, []);
  assert.ok(plan.conflicts.some((item) => item.issue === "1" && item.group === "type"));
  assert.ok(plan.conflicts.some((item) => item.issue === "1" && item.group === "agent"));
  assert.ok(plan.missing.some((item) => item.issue === "2" && item.group === "status"));
  assert.deepEqual(plan.blocked, [{ issue: "2", reason: "a prerequisite is not complete" }]);
  assert.equal(plan.conflicts.some((item) => item.issue === "3"), false);
});

test("the command prints a dry-run plan and does not write the report", async () => {
  const dir = await mkdtemp(join(tmpdir(), "preflight-"));
  const report = join(dir, "report.json");
  await writeFile(report, JSON.stringify({ capabilities: supported(), labels: [] }));
  const run = spawnSync(process.execPath, ["scripts/preflight.mjs", report], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  const plan = JSON.parse(run.stdout);
  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.creates.length, CATALOG.length);
  assert.equal(await readFile(report, "utf8"), JSON.stringify({ capabilities: supported(), labels: [] }));
});

test("the preflight page documents the catalog, the mapping and the rules", async () => {
  const text = await readFile(join(repoRoot, "workflow", "preflight.md"), "utf8");
  const flat = text.replace(/\s+/g, " ");
  for (const [name, color] of Object.entries(PALETTE)) {
    assert.match(text, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(text, new RegExp(color));
  }
  assert.match(flat, /does not require GitHub/);
  assert.match(flat, /GitHub/);
  assert.match(flat, /dry run/);
  assert.match(flat, /discovers the tracker/);
  assert.match(flat, /--apply/);
  assert.match(flat, /creates only the missing catalog labels/);
  assert.match(flat, /Do not pass a report file with --apply/);
  assert.match(flat, /unverified/);
  assert.match(flat, /Do not report an unverified capability as unsupported/);
  assert.match(flat, /Do not change an existing label/);
  assert.match(flat, /Do not remove a label/);
  assert.match(flat, /one type label/);
  assert.match(flat, /one status label/);
  assert.match(flat, /agent:ready and agent:human-only exclude each other/);
  assert.match(flat, /Blocked is not a label/);
  assert.match(flat, /needs the owner/);
  assert.match(text, /\[work\.md\]\(work\.md\)/);
  assert.match(text, /\[safety\.md\]\(safety\.md\)/);
  const index = await readFile(join(repoRoot, "workflow", "index.md"), "utf8");
  assert.match(index, /\[preflight\.md\]\(preflight\.md\)/);
});

async function fakeTracker() {
  const dir = await mkdtemp(join(tmpdir(), "preflight-gh-"));
  const state = join(dir, "labels.json");
  const log = join(dir, "gh.log");
  await writeFile(state, "[]");
  await writeFile(log, "");
  const fake = join(dir, "fake-gh.mjs");
  await writeFile(fake, `
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
appendFileSync(process.env.GH_LOG, JSON.stringify(args) + "\\n");
const state = JSON.parse(readFileSync(process.env.GH_STATE, "utf8"));
if (args[0] === "repo") {
  process.stdout.write(JSON.stringify({
    nameWithOwner: "acme/demo",
    hasIssuesEnabled: true,
    defaultBranchRef: { name: "main" },
  }));
} else if (args[0] === "label" && args[1] === "list") {
  process.stdout.write(JSON.stringify(state));
} else if (args[0] === "label" && args[1] === "create") {
  if (args.includes("--force")) process.exit(2);
  const name = args[2];
  const color = args[args.indexOf("--color") + 1];
  const description = args[args.indexOf("--description") + 1];
  state.push({ name, color, description });
  writeFileSync(process.env.GH_STATE, JSON.stringify(state));
} else if (args[0] === "issue") {
  process.stdout.write(process.env.GH_ISSUES ?? JSON.stringify([{ number: 1 }]));
} else if (args[0] === "pr") {
  process.stdout.write("[]");
} else if (args[0] === "api" && args[1].endsWith("/dependencies")) {
  process.stderr.write("gh: Not Found (HTTP 404)");
  process.exit(1);
} else if (args[0] === "api" && args[1].endsWith("/protection")) {
  process.stderr.write("gh: Branch not protected (HTTP 404)");
  process.exit(1);
} else if (args[0] === "api") {
  process.stdout.write("[]");
} else {
  process.stderr.write("unexpected");
  process.exit(1);
}
`);
  const bin = join(dir, "bin");
  await writeFile(join(dir, "bin-dir"), "");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(bin);
  const gh = join(bin, "gh");
  await writeFile(gh, `#!/bin/sh\nexec node ${JSON.stringify(fake)} "$@"\n`);
  await chmod(gh, 0o755);
  return { dir, state, log, bin };
}

function runPreflight(args, bin, env = {}) {
  return spawnSync(process.execPath, ["scripts/preflight.mjs", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      GH_STATE: join(bin, "..", "labels.json"),
      GH_LOG: join(bin, "..", "gh.log"),
      ...env,
    },
  });
}

test("the command discovers the tracker and a dry run creates nothing", async () => {
  const tracker = await fakeTracker();
  const run = runPreflight([], tracker.bin);
  assert.equal(run.status, 0, run.stderr);
  const plan = JSON.parse(run.stdout);
  assert.equal(plan.mode, "dry-run");
  assert.deepEqual(plan.created, []);
  assert.equal(plan.unsupported.some((item) => item.capability === "labels"), false);
  assert.equal(plan.unsupported.some((item) => item.capability === "blocking links"), true);
  assert.equal(plan.unverified.some((item) => item.capability === "blocking links"), false);
  assert.equal(plan.unverified.some((item) => item.capability === "parent/sub-issues"), false);
  const calls = (await readFile(tracker.log, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.ok(calls.some((args) => args[0] === "repo" && args[1] === "view"));
  assert.ok(calls.some((args) => args[0] === "label" && args[1] === "list"));
  assert.equal(calls.some((args) => args[0] === "label" && args[1] === "create"), false);
});

test("an empty issue list leaves relation capabilities unverified", async () => {
  const tracker = await fakeTracker();
  const run = runPreflight([], tracker.bin, { GH_ISSUES: "[]" });
  assert.equal(run.status, 0, run.stderr);
  const plan = JSON.parse(run.stdout);
  assert.equal(plan.unsupported.some((item) => item.capability === "parent/sub-issues"), false);
  assert.equal(plan.unsupported.some((item) => item.capability === "blocking links"), false);
  assert.deepEqual(
    plan.unverified.map((item) => item.capability),
    ["parent/sub-issues", "blocking links"],
  );
  const calls = (await readFile(tracker.log, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(calls.some((args) => args[0] === "api" && /sub_issues|dependencies/.test(args[1] ?? "")), false);
});

test("apply rejects a report file and does not create labels", async () => {
  const tracker = await fakeTracker();
  const existing = JSON.stringify([{ name: "type:feature", color: "1F6FEB", description: "A new behavior." }]);
  await writeFile(tracker.state, existing);
  const report = join(tracker.dir, "report.json");
  await writeFile(report, JSON.stringify({ capabilities: supported(), labels: [] }));
  const run = runPreflight(["--apply", report], tracker.bin);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Do not apply a report file/);
  assert.equal(await readFile(tracker.state, "utf8"), existing);
  const log = await readFile(tracker.log, "utf8");
  const calls = log.trim() === "" ? [] : log.trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(calls.some((args) => args[1] === "create"), false);
});

test("apply creates only missing catalog labels and the second run creates none", async () => {
  const tracker = await fakeTracker();
  const first = runPreflight(["--apply"], tracker.bin);
  assert.equal(first.status, 0, first.stderr);
  const plan = JSON.parse(first.stdout);
  assert.equal(plan.mode, "apply");
  assert.deepEqual(plan.created, CATALOG.map((entry) => entry.name));
  const calls = (await readFile(tracker.log, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  const creates = calls.filter((args) => args[0] === "label" && args[1] === "create");
  assert.equal(creates.length, CATALOG.length);
  assert.equal(creates.some((args) => args.includes("--force")), false);
  assert.equal(creates.some((args) => args[1] === "edit" || args.includes("delete")), false);
  const stored = JSON.parse(await readFile(tracker.state, "utf8"));
  assert.equal(stored.length, CATALOG.length);
  const second = runPreflight(["--apply"], tracker.bin);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(JSON.parse(second.stdout).created, []);
  const later = (await readFile(tracker.log, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(later.filter((args) => args[1] === "create").length, CATALOG.length);
});

test("bootstrap runs the preflight and names no tracker product", async () => {
  const text = await readFile(join(repoRoot, "skills", "bootstrap", "SKILL.md"), "utf8");
  const step = /^12\. ([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(step, "bootstrap must have a preflight step");
  assert.match(step[1], /scripts\/preflight\.mjs/);
  assert.match(step[1], /discovers the tracker/);
  assert.match(step[1], /--apply/);
  assert.match(step[1], /creates only the missing catalog labels/);
  assert.match(step[1], /Do not pass a report file with --apply/);
  assert.match(step[1], /unverified/);
  assert.match(step[1], /dry run/);
  assert.match(step[1], /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/workflow\/preflight\.md/);
  assert.match(step[1], /Do not change protection, settings or infrastructure/);
  const bare = text.replace(/https:\/\/\S+/g, "");
  assert.doesNotMatch(bare, /github/i);
});
