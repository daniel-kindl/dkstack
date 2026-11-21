# Contributing

This file tells you how a change gets into dkstack.

## Rule

Do not change this repository from another project. To propose a rule, open an issue in
[daniel-kindl/dkstack](https://github.com/daniel-kindl/dkstack/issues) or tell the owner. The owner
approves every change.

The owner is Daniel Kindl ([@daniel-kindl](https://github.com/daniel-kindl)).

Many repositories read these rules. One unreviewed change reaches all of them.

## Change flow

Follow the flow in [workflow/review-and-merge.md](workflow/review-and-merge.md). For dkstack,
start the work only after the owner approves the change.

## Exceptions

- dkstack rule: the lockfile and audit rules in
  [Supply chain rules](coding/dependencies.md#supply-chain-rules).
- Project rule: dkstack has no npm dependencies, so it has no lockfile and no audit. Add both with
  the first dependency.
- Reason: a lockfile and an audit with no dependency check nothing.

## Release

Only the owner releases dkstack. The rule is in [safety](workflow/safety.md). The steps are in
[Release dkstack](versioning/index.md#release-dkstack).
