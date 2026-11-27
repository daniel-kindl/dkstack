# Using dkstack

[Start with the setup prompt](../README.md#start) to connect your project to dkstack.
This guide covers manual setup, optional skill installation, and updates.

[Manual setup](#manual-setup) · [Install skills](#install-the-skills) · [Follow versions](#follow-versions) · [Browse the rules](#what-is-in-each-section)

## Manual setup

1. Copy [sample-AGENTS.md](../sample-AGENTS.md) into a new `AGENTS.md`, or merge it into your existing file.
2. Keep your project facts and record approved rule exceptions in that file.
3. Configure your agent to read `AGENTS.md`, if needed. For Claude Code, add `@AGENTS.md` to `CLAUDE.md`.

For other clients, see step 5 in the [setup instructions](../skills/setup-dkstack/SKILL.md#steps).
Then [check the setup in a new session](../README.md#start).

## Install the skills

Skill installation is optional. The setup skill lets your agent read the shared guidance directly.
Install skills so your agent can find them in its local skill folder.
These copies still link to dkstack's rule pages.

The [skills CLI](https://github.com/vercel-labs/skills#install-a-skill) requires Node.js 22.20 or later.
From your project directory, install `triage`:

```bash
npx skills add https://github.com/daniel-kindl/dkstack/tree/v1 --skill triage
```

Replace `triage` with another name from the [skills list](../skills/index.md).
To see available skills before installing:

```bash
npx skills add https://github.com/daniel-kindl/dkstack/tree/v1 --list
```

For portable offline bundles and skill evaluation, read the [interoperability guide](agent-skills-compatibility.md).
The bundle command copies local rule dependencies and rewrites DKSTACK raw links.

Installed skills do not update by themselves.
For skills installed from `v1`, run `npx skills update` after a release.

## Release status

Read the [latest release notes](https://github.com/daniel-kindl/dkstack/releases/latest) or the full [changelog](../CHANGELOG.md).
The setup uses `v1`, the branch for compatible releases.
The `main` branch contains work that is not released yet.

## Follow versions

Choose the version in the dkstack entry URL in your project's `AGENTS.md`.

| What you need | What to use |
| --- | --- |
| Compatible updates as they are released. | Keep `v1` in your dkstack URL. |
| A fixed version, or a return to a known good release. | Replace `v1` with a published `vX.Y.Z` tag. |
| The next major version. | Read its changelog and migration steps before changing the URL. |

When you pin a tag, your agent must read all dkstack files from that tag.
Follow the [version rule](../AGENTS.md#version).
If you installed skills, install them again with that same tag in place of `v1` in the install command.
Changing the entry URL does not update local skill copies.

The documentation calls a repository whose `AGENTS.md` points to dkstack a **consumer**.
See [how consumers follow versions](adr/0001-how-consumers-follow-versions.md) for the release model.

## What is in each section

| Find guidance for | Read |
| --- | --- |
| Agent instructions and project rules. | [AGENTS.md](../AGENTS.md) |
| Design decisions and code. | [Architecture](../architecture/index.md) · [Coding](../coding/index.md) |
| Tests and interfaces. | [Test-driven development](../tdd/index.md) · [UI and accessibility](../ui/index.md) |
| Commits, reviews, and releases. | [Version control](../version-control/index.md) · [Workflow](../workflow/index.md) · [Versioning](../versioning/index.md) |
| Clear text and learning. | [Writing](../writing/index.md) · [Learning](../learning/index.md) |
| Task instructions and practical advice. | [Skills](../skills/index.md) · [Tips](../tips/index.md) |

## Agent Skills quality

Read [interoperability](agent-skills-compatibility.md) and [evaluation cases](skill-evaluation-cases.md).
The first page explains portable skill bundles and the verification commands.
The second page describes activation and behavioral evaluation requirements.

## Contributing and checks

Use the [contribution guide](../CONTRIBUTING.md) to propose a change or [run repository checks](../CONTRIBUTING.md#run-the-checks).
The guide also describes the [validation workflow](../CONTRIBUTING.md#validate-workflow).

## Brand assets

[Browse the logos, icons, and banners](../assets/brand/README.md).
The asset guide covers colors, type, use, and licensing.

Return to the [project README](../README.md).
