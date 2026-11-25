# dkstack

Rules and skills for AI coding agents, in one place.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/header-dark.svg">
  <img src="assets/brand/header-light.svg" alt="dkstack: rules and skills for AI coding agents." width="1280">
</picture>

[![Release: read the latest version and notes](https://img.shields.io/github/v/release/daniel-kindl/dkstack?style=flat-square&logo=github&logoColor=c7f36b&labelColor=111814&color=111814)](https://github.com/daniel-kindl/dkstack/releases/latest)
[![License: MIT](https://img.shields.io/github/license/daniel-kindl/dkstack?style=flat-square&labelColor=111814&color=111814)](LICENSE)
[![Checks: read the latest result for pushes to main](https://img.shields.io/github/actions/workflow/status/daniel-kindl/dkstack/validate.yml?branch=main&event=push&style=flat-square&label=checks&labelColor=111814&color=111814)](https://github.com/daniel-kindl/dkstack/actions/workflows/validate.yml?query=branch%3Amain+event%3Apush)

**Use the same coding standards across your projects.**
dkstack gives any team shared rules and task-specific skills for AI coding agents.
Your project's `AGENTS.md` links your agent to the relevant guidance.
It is guidance only, with no service to run.

[Get started](#start) · [Browse skills](skills/index.md) · [Read the docs](docs/index.md) · [Get help](#get-help)

## Start

In your project, give your coding agent this prompt:

```
Set up dkstack in this repository.
Read and follow:
https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-dkstack/SKILL.md
```

The [setup skill](skills/setup-dkstack/SKILL.md) links your project's `AGENTS.md` to dkstack and configures your agent to read it.
It preserves project text unless you approve a conflicting rule change.
It commits the setup on a branch and asks before installing skills.
If your repository lacks commit, version, and quality rules, setup continues with [bootstrap](skills/bootstrap/SKILL.md).

**Check the setup:** start a new agent session.
Ask, "Which skill will you read first for a task? Open it."
It should open [triage](skills/triage/SKILL.md).

Prefer manual setup? Use the [manual guide](docs/index.md#manual-setup) and [sample-AGENTS.md](sample-AGENTS.md).


## How to use

Give your agent a task in your project.
The [triage skill](skills/triage/SKILL.md) selects the rules and skills for that task.
Rules set the standards. Skills give the agent steps to follow.

| Your task | Skill |
| --- | --- |
| Plan a feature before writing code. | [plan-work](skills/plan-work/SKILL.md) |
| Implement a change with tests. | [tdd-loop](skills/tdd-loop/SKILL.md) |
| Review a pull request. | [code-review](skills/code-review/SKILL.md) |
| Check an interface for accessibility. | [ui-review](skills/ui-review/SKILL.md) |
| Set up repository checks and versioning. | [bootstrap](skills/bootstrap/SKILL.md) |

[Browse all skills](skills/index.md) for architecture, writing, learning, and other tasks.
See [how project rules work with dkstack](AGENTS.md#precedence).

## Release status

Use `v1` for compatible releases.
Read the [latest release notes](https://github.com/daniel-kindl/dkstack/releases/latest) or [choose a fixed version](docs/index.md#follow-versions).

<a id="install-the-skills"></a>
<a id="follow-versions"></a>
<a id="what-is-in-each-section"></a>
<a id="checks"></a>
<a id="visual-identity"></a>

## Documentation

| You want to | Read |
| --- | --- |
| Set up manually or manage updates. | [Usage guide](docs/index.md) |
| Install optional skills. | [Skill installation](docs/index.md#install-the-skills) |
| Find guidance for code, tests, UI, and other work. | [Rule directory](docs/index.md#what-is-in-each-section) |
| Propose a change or run repository checks. | [Contribution guide](CONTRIBUTING.md) |
| Use the logos, icons, or banners. | [Brand assets](assets/brand/README.md) |

## Get help

[Open an issue](https://github.com/daniel-kindl/dkstack/issues) for a question, a problem, or a proposed change.
Include your agent, dkstack version, and what you expected to happen.
Report security concerns through the [security policy](SECURITY.md).

## Changes

To contribute, start with an issue and the [contribution guide](CONTRIBUTING.md).
Daniel Kindl ([@daniel-kindl](https://github.com/daniel-kindl)) owns dkstack and approves each change.
Propose shared rule changes here instead of editing dkstack from another project.

## License

[MIT](LICENSE). The [asset guide](assets/brand/README.md#license-and-sources) records the font license and artwork sources.
