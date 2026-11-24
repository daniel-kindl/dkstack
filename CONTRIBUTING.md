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

Each rule has one owner page. Other pages link to it. Do not copy a rule into a second page.

## Run the checks

Use Node 24 or later. Run all checks before you open a pull request:

```bash
npm run check
```

`npm run check` does not check the title or the body, because they are not in the files. Check the
pull request title with `npm run check:title -- "<title>"`. Check the body with
`node scripts/check-pr-body.mjs <file>`, where the file holds the body. The body needs an issue
link, an Evidence section and one Observability line. The `validate` workflow runs the same
checks, the title check, the body check, the breaking change check and actionlint.

A removed page, skill or linked anchor is a breaking change. Commit your change, then check it
with the title:

```bash
TITLE="<title>" node scripts/check-breaking.mjs
```

The check compares HEAD with its merge base on `origin/main`. Use `--base <ref>` for another base.

To read the repository settings, the owner runs `npm run audit:settings -- <owner/repo>`. The
tool only reads. A CI token cannot read the bypass list, so `validate` does not run it.

To audit the open issues and the labels of a repository, run `npm run audit:issues -- <owner/repo>`. The tool only reads, and the `validate` workflow does not run it.

A reviewer checks the review file with `node scripts/check-review.mjs <file>` before the review is
posted. The file is not in the repository, so `npm run check` does not run this check.

## Add a page or a skill

- Add the page to the `index.md` of its section, or the skill to `skills/index.md`.
- Make the page or the skill reachable from triage. A building block is linked from each larger
  skill that runs it.
- Add a test that pins the key phrases of each new rule.
- Add one line under `## [Unreleased]` in `CHANGELOG.md`.
- In a skill, link each other dkstack file with its raw URL on `v1`, for example
  `https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md`.

## Validate workflow

The workflow runs on pull requests to every branch so work that targets an intermediate branch
gets the same checks as work that targets main. The pull request diff checks use the target commit.
The workflow also runs on pushes to main. On a push, the ADR check uses the commit before the
push, or the first parent of HEAD if the earlier commit is unavailable.

## Update bot pull requests

An update bot can open a pull request with a title over 50 characters, for example
`ci: bump actions/create-github-app-token from 3.3.0 to 3.4.0`. The title check then fails. The
reviewer edits the title before the merge, for example to `ci: bump create-github-app-token to
3.4.0`. `validate` runs again when the title changes.

## Exceptions

- dkstack rule: the lockfile and audit rules in
  [Supply chain rules](coding/dependencies.md#supply-chain-rules).
- Project rule: dkstack has no npm dependencies, so it has no lockfile and no audit. Add both with
  the first dependency.
- Reason: a lockfile and an audit with no dependency check nothing.

## Release

Only the owner releases dkstack. The rule is in [safety](workflow/safety.md). The steps are in
[Release dkstack](versioning/index.md#release-dkstack).
