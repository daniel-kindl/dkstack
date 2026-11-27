import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("git ignores the agent worktrees", () => {
  const out = execFileSync("git", ["check-ignore", "--no-index", "-v", ".claude/worktrees/agent-x/AGENTS.md"], { cwd: root, encoding: "utf8" });
  assert.match(out, /^\.gitignore:\d+:\.claude\/worktrees\//);
});

test("git does not ignore the project settings of Claude Code", () => {
  assert.throws(() => execFileSync("git", ["check-ignore", "--no-index", "-q", ".claude/settings.json"], { cwd: root, stdio: "ignore" }));
});

test("git ignores the Python cache that the Agent Skills tests make", () => {
  for (const path of ["test/__pycache__/test_ref_spec.cpython-312.pyc", "scripts/__pycache__/x.pyc"]) {
    const out = execFileSync("git", ["check-ignore", "--no-index", "-v", path], { cwd: root, encoding: "utf8" });
    assert.match(out, /^\.gitignore:\d+:__pycache__\//);
  }
});
