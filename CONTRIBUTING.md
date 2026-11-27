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

## Agent Skills compatibility

Read [the interoperability guide](docs/agent-skills-compatibility.md) for the reference check, offline bundles and evaluation.

- Run `npm run check:skill-evals` to check the evaluation manifest. `npm run check` also runs it.
- Run `npm run bundle:skills` to build offline skill folders in `dist/agent-skills`.
- Run `npm run validate:skills-ref` for the reference check. It needs Python 3 and the pinned skills-ref.
- Real agent evaluations need a trusted external agent adapter.
- Do not report fixture tests as agent evaluation results.

## Add a page or a skill

- Add the page to the `index.md` of its section, or the skill to `skills/index.md`.
- Make the page or the skill reachable from triage. A building block is linked from each larger
  skill that runs it.
- Add a test that pins the key phrases of each new rule.
- For a new skill, add a suite to `evals/skill-cases.json`, as
  [skill evaluation cases](docs/skill-evaluation-cases.md#executable-cases) says. `npm run check:skill-evals` fails without it.
- Add one line under `## [Unreleased]` in `CHANGELOG.md`.
- In a skill, link each other dkstack file with its raw URL on `v1`, for example
  `https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md`.

## Validate workflow

The workflow runs on pull requests to every branch so work that targets an intermediate branch
gets the same checks as work that targets main. The pull request diff checks use the target commit.
The workflow also runs on pushes to main. On a push, the ADR check uses the commit before the
push, or the first parent of HEAD if the earlier commit is unavailable.

The workflow checks the following:

- The pull request title, or each commit title on a push, is a conventional commit.
- On a pull request, a removed page, skill or linked anchor needs `!` in the title and a
  "Consumer action:" line under `## [Unreleased]` in CHANGELOG.md.
- The pull request body links an issue and has an Evidence section, one Observability line and a
  valid Visual verification line. A bot author is skipped.
- Each skill has the correct folder and frontmatter.
- `Validate core Agent Skills specification`: the Python adapter tests pass, and each skill passes the
  pinned Agent Skills reference validator.
- `Validate skill evaluation manifest`: each skill has a valid evaluation suite.
- `Build offline skill bundles for every skill`: each skill builds as an offline bundle.
- Relative links and links to this repository resolve, including anchors.
- Markdown files have no em dash or en dash.
- Workflows pin actions, set permissions and set `timeout-minutes` on each job. A release or deploy
  workflow starts only by `workflow_dispatch`, checks that the ref is `main`, uses an environment
  and sets `concurrency`. The check finds a release job from a list of commands and actions, so a
  deploy job must set `environment:` to be checked. Only the release job uses the release app secrets. The allowed secrets
  are in [.github/check-workflows.json](.github/check-workflows.json). Jobs must be at 2 spaces under
  `jobs:`, with job keys at 4 spaces. Triggers must be on the `on:` line or at 2 spaces under it.
  Another form fails, so the check never passes a form that it cannot read.
- actionlint and shellcheck find no fault in the workflows.
- CHANGELOG.md has an entry for the version in `package.json`, an `## [Unreleased]` line and its
  compare link. A pull request that adds or renames a page, or adds a skill, also changes
  `## [Unreleased]`.
- The maps in `docs/maps/`, `CONTEXT.md` and new ADRs have the correct format.
- The change adds no blanket suppression and no suppression without a reason. A lowered number
  directly after a known coverage gate key, or a raised `max-warnings` number, gives a warning
  for the reviewer. It does not fail the check. On a push to `main`, the change is empty, so
  this check has nothing to check.
- The unit tests pass, and they cover at least 95% of the lines and 90% of the branches in
  `scripts/`.
- A long sentence, a long step or a semicolon in Markdown fails the check.

The validation workflow does not tag, release, or publish.

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

- dkstack rule: the type check of JavaScript in [Explicit types](coding/types.md#explicit-types).
- Project rule: the scripts are plain JavaScript with no type check. They use `const` and `let`,
  and `test/types.test.mjs` fails on `var`. Add the type check with the first dependency.
- Reason: a type check of JavaScript needs `typescript`, and dkstack has no npm dependencies.

## Release

Only the owner releases dkstack. The rule is in [safety](workflow/safety.md). The steps are in
[Release dkstack](versioning/index.md#release-dkstack).

## Check pull request text in CI

If you copy dkstack's pull request checks, use a fixed release tag that has the `--event` option.
Copy `check-title.mjs`, `check-pr-body.mjs` and their helper `pr-event.mjs` from the same tag.
In GitHub Actions, run these steps only on `pull_request`:

```yaml
- name: Check the pull request title
  if: github.event_name == 'pull_request'
  run: node scripts/check-title.mjs --event

- name: Check the pull request body
  if: github.event_name == 'pull_request'
  run: node scripts/check-pr-body.mjs --event
```

Both scripts read `GITHUB_EVENT_PATH`. Keep the title, body and author login out of the step
environment and logs. To add the breaking change check, copy `check-breaking.mjs`,
`check-links.mjs` and `markdown-files.mjs` from the same tag. Run
`node scripts/check-breaking.mjs --event` for that step.
