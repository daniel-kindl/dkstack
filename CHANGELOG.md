# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-10-28

### Added

- `AGENTS.md`: the entry point for agents.
- `sample-AGENTS.md`: an `AGENTS.md` to copy into a project that uses dkstack.
- `CONTRIBUTING.md`: how to propose a change to dkstack.
- Sections, each with an `index.md`:
  - `architecture/`: architecture principles.
  - `coding/`: coding standards and practices.
  - `tdd/`: test-driven development.
  - `version-control/`: conventional commits and feature branches.
  - `versioning/`: semantic versioning.
  - `writing/`: writing style (ASD-STE100).
  - `skills/`: skills for agents.
  - `tips/`: short tips.
  - `workflow/`: roles, review and merge, and safety.
- `docs/adr/`: architecture decision records. ADR 0001 sets how consumers follow versions.
- Skills, each in `skills/<name>/SKILL.md`:
  - `triage`: selects the guidelines and skills that apply to a task.
  - `bootstrap`: sets up commit, branch, version, check and supply chain rules in a new repository.
  - `clarify-intent`: clarifies the requirements and the domain language before you write code.
  - `apply-architecture`: checks a design change against the architecture principles.
  - `tdd-loop`: runs the red, green, refactor cycle with a failing test first.
  - `code-review`: checks a change against the repository standards and the specification.
  - `write-adr`: creates an architecture decision record.
  - `writing-check`: applies the ASD-STE100 writing rules to text.
- The `validate` workflow. It checks the PR or commit title, the skills, the links, the dashes,
  the workflows and the unit tests.

[Unreleased]: https://github.com/daniel-kindl/dkstack/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/daniel-kindl/dkstack/releases/tag/v1.0.0
