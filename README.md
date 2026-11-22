# dkstack

Rules and skills for AI coding agents, in one place.

dkstack has rules, skills and check scripts for architecture, code, tests, UI, commits, versions,
writing and the review workflow. It is guidance only: your agents read the pages and run the
skills. It runs no service, and it changes nothing in your project by itself. It is for any team
that uses AI coding agents, under the [MIT license](LICENSE). Update the rules here once, and each
consumer gets the new rules. A consumer is a repository whose `AGENTS.md` points to dkstack.

## Start

1. Copy [sample-AGENTS.md](sample-AGENTS.md) into your project as `AGENTS.md`. Or tell your agent
   to run the [setup-dkstack](skills/setup-dkstack/SKILL.md) skill. It works in a new or an
   existing project.
2. Optional: install the skills. See [Install the skills](#install-the-skills).
3. Give your agent a task. It reads the triage skill first, and triage selects the rules for the
   task.

## Release status

Consumers follow the `v1` release branch. See
[ADR 0001](docs/adr/0001-how-consumers-follow-versions.md).

Each compatible release moves `v1` forward. Each release also gets a fixed `vX.Y.Z` tag. The
latest release is at <https://github.com/daniel-kindl/dkstack/releases/latest>. See
[CHANGELOG.md](CHANGELOG.md) for all releases.

## How to use

Tell an agent:

> Read and follow https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md

To read all files on the same version, follow the version rule in
[AGENTS.md](AGENTS.md#version).

To set up a project, copy [sample-AGENTS.md](sample-AGENTS.md) into it as `AGENTS.md`.

## Install the skills

List the skills on the `v1` ref:

```bash
npx skills add https://github.com/daniel-kindl/dkstack/tree/v1 --list
```

Install one skill:

```bash
npx skills add https://github.com/daniel-kindl/dkstack/tree/v1 --skill <name>
```

Replace `<name>` with a skill name from [skills/index.md](skills/index.md), for example `triage`.

## Follow versions

- Compatible releases (MINOR and PATCH) move `v1` forward. You do not change anything.
- A breaking release starts `v2`. Read `CHANGELOG.md`, then change `v1` to `v2` in your URL.
- If a release breaks your project, pin the last good `vX.Y.Z` tag in place of `v1`. Follow the
  version rule in [AGENTS.md](AGENTS.md#version). Go back to `v1` after the fix.
- If you installed skills, run `npx skills update` after a release. Installed skills do not
  update by themselves.

The current version is in `package.json`. See [versioning/index.md](versioning/index.md) for
semantic versioning.

## Checks

The `validate` workflow ([.github/workflows/validate.yml](.github/workflows/validate.yml)) runs on
each pull request to `main` and on each push to `main`. It does these checks:

- The pull request title, or each commit title on a push, is a conventional commit.
- Each skill has the correct folder and frontmatter.
- Relative links and links to this repository resolve, including anchors.
- Markdown files have no em dash or en dash.
- Workflows pin actions, set permissions and set `timeout-minutes` on each job. A release or deploy
  workflow starts only by `workflow_dispatch`, checks that the ref is `main`, uses an environment
  and sets `concurrency`. Only the release job uses the release app secrets. The allowed secrets
  are in [.github/check-workflows.json](.github/check-workflows.json).
- actionlint and shellcheck find no fault in the workflows.
- CHANGELOG.md has an entry for the version in `package.json`, an `## [Unreleased]` line and its
  compare link.
- The maps in `docs/maps/`, `CONTEXT.md` and new ADRs have the correct format.
- The unit tests pass, and they cover at least 95% of the lines and 90% of the branches in
  `scripts/`.
- A long sentence or a semicolon gives a warning, not a failure.

To run the same checks locally, except the title check and actionlint, use Node 24 or later:

```bash
npm run check
```

The workflow does not tag, release or publish.

## What is in each section

- [AGENTS.md](AGENTS.md): The entry point for agents.
- [architecture/](architecture/index.md): Architecture principles and design rules.
- [coding/](coding/index.md): Coding standards and practices.
- [tdd/](tdd/index.md): Test-driven development.
- [learning/](learning/index.md): Adaptive learning principles and standards.
- [ui/](ui/index.md): User interface rules, accessibility and visual verification.
- [version-control/](version-control/index.md): Conventional commits and short-lived feature
  branches.
- [versioning/](versioning/index.md): Semantic versioning.
- [writing/](writing/index.md): Writing style (ASD-STE100).
- [skills/](skills/index.md): Skills for agents.
- [workflow/](workflow/index.md): Issues, review and merge, and safety.
- [ADR 0001](docs/adr/0001-how-consumers-follow-versions.md): How consumers follow versions. The ADRs
  are in `docs/adr/`.

## Changes

Do not change this repository from another project. To propose a change, open an issue. The owner
approves every change. See [CONTRIBUTING.md](CONTRIBUTING.md).
