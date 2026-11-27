# Tips

Short tips and tricks.

Add detailed files or short sections and link them here. A tip is not a rule. If a tip and a rule
conflict, follow the rule.

## Current tips

- [Check the exit code of each step](#check-the-exit-code-of-each-step)
- [Check for a breaking change before you push](#check-for-a-breaking-change-before-you-push)
- [Find worktrees and branches that are left](#find-worktrees-and-branches-that-are-left)

## Check the exit code of each step

The exit code of a command list is the exit code of its last command. The exit code of a pipe is
the exit code of its last command too. A failed step can hide behind a later step that passes.

```bash
false; true          # exit code 0
false | true         # exit code 0
```

- Run each check as its own command, and read its exit code before you report a result.
- In a script, start with `set -e` to stop at the first failed command. Add `set -o pipefail` so
  that a failed command in a pipe fails the pipe.
- Do not add a command after a check only to show more output, for example `npm test; ls`. The
  exit code then belongs to `ls`.

These lines were checked with bash 5.

## Check for a breaking change before you push

In dkstack, `validate` fails a pull request that removes a page, a skill or a linked anchor, unless
the title has `!`. Run the check locally after you commit and before you push:

```bash
TITLE="<title>" node scripts/check-breaking.mjs
```

The check compares HEAD with its merge base on `origin/main`. See
[CONTRIBUTING.md](../CONTRIBUTING.md#run-the-checks).

## Find worktrees and branches that are left

A worktree or a branch can stay after its pull request merges, for example a worktree that a
subagent made. List the worktrees, then each local branch whose remote branch is gone:

```bash
git fetch --prune
git worktree list
git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads \
  | awk '$2 == "[gone]" {print $1}'
```

A branch in the list can still hold a commit that is not merged. Remove a worktree or a branch
only with the checks in
[after the merge](../workflow/review-and-merge.md#after-the-merge).

These commands were checked with `git` 2.55.0.

## Isolate a regression with git bisect

When a stable test distinguishes good from bad, use `git bisect` in a clean worktree.
Start with a known good and a known bad commit. Run a deterministic test at each step.
Use `git bisect skip` for commits that cannot be tested. Verify the selected change
manually, then run `git bisect reset`. Never alter another worker's worktree.
