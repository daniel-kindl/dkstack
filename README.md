# dkstack

Central guidelines, skills, rules, and standards for coding AI agents.

Update this repository once. Point agents at it so they follow the current rules.

## Release status

Consumers follow the `v1` release branch. See
[ADR 0001](docs/adr/0001-how-consumers-follow-versions.md).

The owner creates the `v1` branch at the first release and moves it forward at each later
compatible release. Each release also gets a fixed `vX.Y.Z` tag. Before the first release, the
URLs and commands in this file that use `v1` fail. See [CHANGELOG.md](CHANGELOG.md) for the
releases.

## How to use

Tell an agent:

> Read and follow https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md

The relative links in `AGENTS.md` resolve against this URL, so the agent reads all files on the
same ref.

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
- If a release breaks your project, pin the last good `vX.Y.Z` tag in place of `v1`. Go back to
  `v1` after the fix.

The current version is in `package.json`. See [versioning/index.md](versioning/index.md) for
semantic versioning.

## Checks

The `validate` workflow ([.github/workflows/validate.yml](.github/workflows/validate.yml)) runs on
each pull request to `main` and on each push to `main`. It does these checks:

- The pull request title, or the commit title on a push, is a conventional commit.
- Each skill has the correct folder and frontmatter.
- Relative links and links to this repository resolve.
- Markdown files have no em dash or en dash.
- Workflows pin actions, set permissions and use no secrets.
- The unit tests pass.

To run the same checks locally, except the title check, use Node 20 or later:

```bash
npm run check
```

The workflow does not tag, release or publish.

## What is in each section

- [AGENTS.md](AGENTS.md): The entry point for agents.
- [architecture/](architecture/index.md): Architecture principles and design rules.
- [coding/](coding/index.md): Coding standards and practices.
- [tdd/](tdd/index.md): Test-driven development.
- [version-control/](version-control/index.md): Conventional commits and short-lived feature
  branches.
- [versioning/](versioning/index.md): Semantic versioning.
- [writing/](writing/index.md): Writing style (ASD-STE100).
- [skills/](skills/index.md): Skills for agents.
- [tips/](tips/index.md): Short tips.
- [workflow/](workflow/index.md): Work, roles, review and merge, and safety.
- [docs/adr/](docs/adr/0001-how-consumers-follow-versions.md): Architecture decision records.

## Changes

Do not change this repository from another project. To propose a change, open an issue. The owner
approves every change. See [CONTRIBUTING.md](CONTRIBUTING.md).
