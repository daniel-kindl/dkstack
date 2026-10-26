# Contributing

This file tells you how a change gets into dkstack.

## Rule

Do not change this repository from another project. To propose a rule, open an issue in
[daniel-kindl/dkstack](https://github.com/daniel-kindl/dkstack/issues) or tell the owner. The owner approves every change.

Many repositories read these rules. One unreviewed change reaches all of them.

## Change flow

1. Open an issue. State the problem, the fix and the acceptance criteria.
2. Wait until the owner accepts the issue.
3. Create one short-lived branch from `main` for the issue.
4. Make the change. Keep it to the scope of the issue.
5. Open a pull request that links the issue. Use a
   [conventional commit](version-control/index.md) as the PR title.
6. A reviewer other than the author reviews the pull request.
7. When the review passes and all checks are green, squash merge the pull request.

The PR title becomes the commit title on `main`. Do not push to `main` directly. Do not
force-push.
