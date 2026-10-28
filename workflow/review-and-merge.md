# Review and merge

Every change goes from an issue to a reviewed pull request. No change reaches `main` without review.

Status: outline. Issue #8 writes the full rules.

## Rules

This file will hold these rules:

- Start from an issue with acceptance criteria. No issue, no work.
- One issue, one branch, one pull request.
- The pull request title is a conventional commit. With squash merge, it becomes the commit title.
- The pull request body links the issue, lists the tests that prove the behavior, and names each
  check that did not run as NOT RUN.
- The reviewer is not the author.
- The review gives one verdict: APPROVE-RECOMMENDED, CHANGES-REQUESTED or BLOCKED.
- The reviewer merges when the review passes and all required checks are green. Squash merge only.
- To update a branch, merge `main` into it. Do not rebase a pushed branch.
- Escalation: reviewer to architect, then to coordinator, then to the human owner.

## Good example

Issue #8 adds an example.

## Bad example

Issue #8 adds an example.

Related: [roles.md](roles.md), [safety.md](safety.md),
[version-control/index.md](../version-control/index.md).
