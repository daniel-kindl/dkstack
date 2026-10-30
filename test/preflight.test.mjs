import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
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

function supported() {
  return Object.fromEntries(CAPABILITIES.map((name) => [name, true]));
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
  const plan = planPreflight({ capabilities: { issues: true }, labels: [], apply: true });
  const labels = plan.unsupported.find((item) => item.capability === "labels");
  assert.ok(labels);
  assert.match(labels.fallback, /Do not create labels/);
  assert.deepEqual(plan.creates, []);
  assert.equal(plan.unsupported.length, CAPABILITIES.length - 1);
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

test("bootstrap runs the preflight and names no tracker product", async () => {
  const text = await readFile(join(repoRoot, "skills", "bootstrap", "SKILL.md"), "utf8");
  const step = /^12\. ([\s\S]*?)(?=^## )/m.exec(text);
  assert.ok(step, "bootstrap must have a preflight step");
  assert.match(step[1], /scripts\/preflight\.mjs/);
  assert.match(step[1], /dry run/);
  assert.match(step[1], /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/workflow\/preflight\.md/);
  assert.match(step[1], /Do not change protection, settings or infrastructure/);
  const bare = text.replace(/https:\/\/\S+/g, "");
  assert.doesNotMatch(bare, /github/i);
});
