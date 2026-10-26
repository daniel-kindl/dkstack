# dkstack

Central guidelines, skills, rules, and standards for coding AI agents.

Update this repository once. Point agents at it so they follow the current rules.

## How to use

Tell an agent:

> Read and follow https://raw.githubusercontent.com/daniel-kindl/dkstack/main/AGENTS.md

Or reference a specific section index.

## Install (skills)

```bash
npx skills add daniel-kindl/dkstack
```

## Versioning

This repository uses semantic versioning. See [versioning/index.md](versioning/index.md).

- Current version is in `package.json`.
- Changes are tracked in `CHANGELOG.md`.
- A GitHub Actions workflow (`.github/workflows/version.yml`) validates the structure on push to main.
- No automatic publishing or release creation is enabled yet.

## Structure

Each section has an `index.md` that links to detailed files.

- `AGENTS.md`: Main entry point for agents.
- `architecture/`: Architecture principles and design rules.
- `coding/`: Coding standards and practices.
- `tdd/`: Test-driven development.
- `version-control/`: Conventional commits and short-lived feature branches.
- `versioning/`: Semantic versioning.
- `writing/`: Writing style (ASD-STE100).
- `skills/`: Specific skills.
- `tips/`: Short tips and tricks.

Keep each file focused.

## Changes

See [CONTRIBUTING.md](CONTRIBUTING.md).
