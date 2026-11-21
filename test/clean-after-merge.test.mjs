import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "./helpers.mjs";

// Issue #277: the agent that merged cleans its local workspace.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
const raw = async (file) => readFile(join(repoRoot, file), "utf8");
const flat = async (file) => (await raw(file)).replace(/\s+/g, " ");

// Return the text of the "## " section with the given heading, outside fenced code.
async function section(file, heading) {
  const lines = (await raw(file)).split("\n");
  const start = lines.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, `${file} must have a "${heading}" section`);
  let fence = false;
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && /^## /.test(line)) break;
    out.push(line);
  }
  return out.join("\n");
}

test("the review page owns the clean-up rules, each with a reason", async () => {
  const text = await section("workflow/review-and-merge.md", "After the merge");
  const prose = text.replace(/```[\s\S]*?```/g, "").replace(/\s+/g, " ");
  for (const phrase of [
    "The agent that merged cleans the local clone that it used for the merge.",
    "Switch to `main` and update it with a fast-forward only.",
    "Remove the worktree of the merged branch. Then delete the local branch.",
    "A branch is stale only when its pull request is merged into `main` and its tip is the merged head or an ancestor of it.",
    "Remove a worktree only when it has the merged branch checked out and `git status --short --ignored` shows no file that you cannot make again.",
    "`git worktree remove` also deletes ignored files, for example `.env`.",
    "Keep each other branch and worktree, and name it in your report.",
    "Never discard uncommitted changes or a commit that is not merged. Stop and tell the owner.",
    "Prune the stale remote-tracking refs and worktree records.",
  ]) {
    assert.ok(prose.includes(phrase), `missing: ${phrase}`);
  }
  const rules = prose.split(" - ").slice(1);
  assert.ok(rules.length >= 6, "each clean-up rule must be a list item");
  for (const rule of rules) assert.match(rule, /Reason: /, `no reason: ${rule}`);
});

test("the clean-up rules link the safety rule for unmerged work", async () => {
  const text = await section("workflow/review-and-merge.md", "After the merge");
  assert.ok(text.includes("(safety.md)"));
});

test("the clean-up commands are safe and verified", async () => {
  const text = await section("workflow/review-and-merge.md", "After the merge");
  const block = /```bash\n([\s\S]*?)\n```/.exec(text);
  assert.ok(block, "the section must have a bash block");
  const commands = block[1];
  for (const command of [
    "git switch main",
    "git pull --ff-only",
    "git worktree remove",
    "gh pr list --state merged --base main --head",
    "git -C <path> branch --show-current",
    "git -C <path> status --short --ignored",
    "git branch --format='%(refname:short)' | grep -vx main",
    "git merge-base --is-ancestor",
    "git branch -D",
    "git fetch --prune",
    "git worktree prune",
  ]) {
    assert.ok(commands.includes(command), `missing command: ${command}`);
  }
  assert.doesNotMatch(commands, /--force|\s-f\b|reset --hard|clean -/, "no command may discard work");
  assert.match(commands, /\[ -n "\$merged" \] && git merge-base --is-ancestor "\$b" "\$merged" && git branch -D "\$b"/,
    "delete a branch only when its tip is the merged head or an ancestor of it");
  assert.match(text, /verified with `git` 2\.\d+/);
  assert.doesNotMatch(text, /fails if the worktree has changes/, "the comment must not promise that ignored files are safe");
});

test("feature-branches and code-review link the clean-up rules and do not copy them", async () => {
  const branches = await flat("version-control/feature-branches.md");
  assert.ok(branches.includes("(../workflow/review-and-merge.md#after-the-merge)"));
  const review = await flat("skills/code-review/SKILL.md");
  assert.ok(review.includes(`(${RAW}workflow/review-and-merge.md#after-the-merge)`));
  for (const text of [branches, review]) {
    assert.doesNotMatch(text, /fast-forward only|git branch -D|worktree prune/);
  }
});
