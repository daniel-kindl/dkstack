# Review and merge

Every change goes from an issue to a reviewed pull request. No change reaches `main` without review.

The author writes the pull request body with [write-pr](../skills/write-pr/SKILL.md). This page
keeps the review and merge rules.

## Rules

- Implement from an issue with acceptance criteria. Reason: the issue states the scope that the
  review checks. The issue rules are in [issues.md](issues.md).
- Use one issue, one branch and one pull request. Link the issue in the pull request. Reason: each
  change stays small and traceable.
- The pull request body lists the tests that prove the behavior. It names each check that did not
  run as NOT RUN. Reason: the reviewer must know what was tested.
- The review gives one verdict: APPROVE-RECOMMENDED, CHANGES-REQUESTED or BLOCKED. Reason: one
  verdict tells the author the next step.
- The reviewer merges only the head that they reviewed, and only when the review passes, all
  required checks are green, and the code host shows the pull request as ready to merge with no
  rule bypassed. The author never merges. The [human owner](roles.md#human-owner) may also merge,
  including a pull request that they authored, after the same checks pass. Reason: a later push,
  a failed check, an open finding or a bypassed rule must not reach `main`.
- Use squash merge only and keep history linear. Reason: each pull request becomes one commit on
  `main`.
- The pull request title is the commit message. It must be a
  [conventional commit](../version-control/index.md). Reason: squash merge uses the title as the
  commit title.
- To update a branch, merge `main` into it. Do not rebase a pushed branch. Reason: a rebase of a
  pushed branch needs a force-push.

The author and reviewer limits are in [roles.md](roles.md).

## Missing review evidence after merge

The native review record of the pull request is the normal evidence. Check that an independent
review passed for the reviewed head.

An already-merged pull request can have no native review record. Then the owner can confirm that
an independent review took place. Record the confirmation on that pull request or on a linked
issue. The record names the pull request, the full reviewed head commit, the reviewer, the verdict
and the owner's words that the independent review took place. Check the owner's authority as
[owner instructions in chat](safety.md#owner-instructions-in-chat) says. Check that the reviewer
was not the author, and that the passing verdict covered the head that was merged. If a fact is
missing, cannot be checked or conflicts, do not treat the pull request as reviewed.

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

Related: [roles.md](roles.md), [safety.md](safety.md),
[version-control/index.md](../version-control/index.md).
