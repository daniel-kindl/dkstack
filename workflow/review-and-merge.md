# Review and merge

Every change goes from an issue to a reviewed pull request. No change reaches `main` without review.

The author writes the pull request body with [write-pr](../skills/write-pr/SKILL.md). This page
keeps the review and merge rules.

## Rules

- Implement from an issue with acceptance criteria. Reason: the issue states the scope that the
  review checks. The issue rules are in [issues.md](issues.md).
- Use one issue, one branch and one pull request. Link the issue in the pull request. Reason: each
  change stays small and traceable.
- The author must not review, approve or merge their own pull request. One agent can do many
  tasks, but not the review of its own work. Reason: a second agent finds errors that the author
  does not see.
- The pull request body lists the tests that prove the behavior. It names each check that did not
  run as NOT RUN. Reason: the reviewer must know what was tested.
- The review gives one verdict: APPROVE-RECOMMENDED, CHANGES-REQUESTED or BLOCKED. Reason: one
  verdict tells the author the next step.
- After a verdict that is not APPROVE-RECOMMENDED, the author fixes each finding of every severity
  with [tdd-loop](../skills/tdd-loop/SKILL.md). Then the author gets a new independent review of
  the new head. Repeat until the verdict is APPROVE-RECOMMENDED. Do not ask the owner whether to
  fix a finding. Ask the owner only for a decision that only the owner can make. If you think
  that a finding is wrong, give the evidence on the pull request. The next review decides.
  Reason: a finding that is not fixed reaches `main`, and a question about each fix stops the
  work.
- The reviewer merges only the head that they reviewed. The reviewer merges only when the review
  passes and all required checks are green. The reviewer also merges only when the code host shows
  the pull request as ready to merge with no rule bypassed. The author never merges. The
  [owner](safety.md#owner) may also merge, including a pull request that they
  authored, after the same checks pass. Reason: a later push, a failed check, an open finding or a bypassed rule
  must not reach `main`.
- Use squash merge only and keep history linear. Reason: each pull request becomes one commit on
  `main`.
- The pull request title is the commit message. It must be a
  [conventional commit](../version-control/index.md). Reason: squash merge uses the title as the
  commit title.
- To update a branch, merge `main` into it. Do not rebase a pushed branch. Reason: a rebase of a
  pushed branch needs a force-push.

## After the merge

The agent that merged cleans the local clone that it used for the merge. When the owner
merges, the owner can ask an agent to do these steps.

- Switch to `main` and update it with a fast-forward only. Reason: the next task starts from the
  merged state, and a fast-forward never makes a merge commit on `main`.
- Remove the worktree of the merged branch. Then delete the local branch. Reason: a stale
  worktree or branch can make the next agent start on old code.
- Remove a worktree only when it has the merged branch checked out and
  `git status --short --ignored` shows no file that you cannot make again. If it shows such a
  file, stop and tell the owner. A build output or `node_modules/` can be made again. Reason:
  `git worktree remove` also deletes ignored files, for example `.env`. A worktree with no
  branch checked out can hold commits that are on no branch.
- A branch is stale only when its pull request is merged into `main` and its tip is the
  merged head or an ancestor of it. Delete only stale branches. Reason: a squash merge does not
  make the branch an ancestor of `main`, so `git branch -d` refuses it. The check on the merged
  head proves that the branch has no commit that is not merged.
- Keep each other branch and worktree, and name it in your report. Reason: it can hold work that
  is not merged, for example from a pull request that was closed without a merge.
- Never discard uncommitted changes or a commit that is not merged. Stop and tell the owner.
  Reason: the work can be lost. See [safety.md](safety.md): do not delete a branch with unmerged
  work.
- Prune the stale remote-tracking refs and worktree records. Reason: a pruned clone shows which
  remote branches were deleted.

On GitHub, use `git` and `gh`. These commands were verified with `git` 2.55.0 and `gh` 2.97.0:

```bash
# Go to the main worktree. Update the remote refs and remove the deleted ones.
git fetch --prune
git switch main
git pull --ff-only

# Remove the worktree of the merged branch. The first command must print the merged
# branch. The second must print no file that you cannot make again. If not, stop and tell
# the owner. The remove also fails for a tracked change or an untracked file.
git worktree list
git -C <path> branch --show-current
git -C <path> status --short --ignored
git worktree remove <path>
git worktree prune

# Delete each local branch whose remote branch is gone, but only when its pull request is
# merged into main and its tip is the merged head or an ancestor of it.
for b in $(git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads \
    | awk '$2 == "[gone]" {print $1}'); do
  merged=$(gh pr list --state merged --base main --head "$b" --json headRefOid -q '.[0].headRefOid')
  [ -n "$merged" ] && git merge-base --is-ancestor "$b" "$merged" && git branch -D "$b" \
    || echo "kept: $b"
done

# Name each branch that is left in your report.
git branch --format='%(refname:short)' | grep -vx main
```

A branch that is checked out in a worktree is not deleted. Remove its worktree first.

## Missing review evidence after merge

The native review record of the pull request is the normal evidence. Check that an independent
review passed for the reviewed head.

An already-merged pull request can have no native review record. Then the owner can confirm that an
independent review took place. Record the confirmation on that pull request or on a linked issue.
The record names the pull request, the full reviewed head commit, the reviewer, the verdict and the
owner's words that the independent review took place. Check the owner's authority as [owner
instructions in chat](safety.md#owner-instructions-in-chat) says. Check that the reviewer was
independent of the author, and that the passing verdict covered the head that was merged. If a fact
is missing, cannot be checked or conflicts, do not treat the pull request as reviewed.

If the owner cannot confirm that a review took place, get a new independent review of the merged
change. Record its verdict and reviewed head on the pull request.

Never backdate or invent review evidence.

This exception repairs the evidence for a change that is already merged. It never allows a
self-review. It never removes the need for an independent review. It never allows a merge of an
open pull request that has no review. The usual merge gates do not change.

## Good example

The pull request title is `docs(workflow): write the team operating rules`. The body says
`Closes #8`.

## Bad example

The pull request title is `update docs`. The body does not link an issue.

Related: [issues.md](issues.md), [safety.md](safety.md),
[version-control/index.md](../version-control/index.md).
