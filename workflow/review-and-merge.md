# Review and merge

Every change goes from an issue to a reviewed pull request. No change reaches `main` without review.

The review does not require a feature plan.

The author writes the pull request body with [write-pr](../skills/write-pr/SKILL.md). This page
keeps the review and merge rules.

## Rules

- Implement from an issue with acceptance criteria. Reason: the issue states the scope that the
  review checks.
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

The native pull request review record is the normal evidence source. Verify that independent
review passed for the reviewed head.

For an already-merged pull request with no native review record, the owner may attest that
independent review actually occurred. Record the attestation durably on that pull request or a
linked issue. It must identify the pull request, the full reviewed head commit, the reviewer,
the verdict and the owner's explicit confirmation that this independent review occurred.
Verify the owner's authorization under [owner instructions in chat](safety.md#owner-instructions-in-chat).
Verify that the reviewer was independent of the author and the passing verdict covered the
head that was merged. If a fact is missing, unverifiable or conflicting, do not treat the pull
request as reviewed.

If the owner cannot confirm that review occurred, obtain a genuine independent review of the
merged change and record its verdict and reviewed head on the pull request.

Never backdate or fabricate review evidence.

This exception repairs evidence for an already-merged change. It never permits self-review,
waives independent review or authorizes merging an unreviewed open pull request. Ordinary merge
gates remain unchanged.

## Good example

The pull request title is `docs(workflow): write the team operating rules`. The body says
`Closes #8`.

## Bad example

The pull request title is `update docs`. The body does not link an issue.

Related: [roles.md](roles.md), [safety.md](safety.md),
[version-control/index.md](../version-control/index.md).
