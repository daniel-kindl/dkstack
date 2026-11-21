---
name: setup-versioning
description: "Use when a repository has no commit, branch or version rules. One building block of bootstrap. Documents conventional commits and short-lived branches, and sets up semantic versioning and a changelog."
user-invocable: false
---

# Set up versioning

A building block of [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md). Use it alone, or as a step of bootstrap. Do not weaken an existing quality gate. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).

## Steps

1. Document conventional commits and short-lived feature branches in the repo README or AGENTS.md.
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md

2. Set up semantic versioning.
   - Put the version in the project manifest.
   - Add `CHANGELOG.md`.
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md
