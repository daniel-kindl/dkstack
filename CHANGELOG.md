# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `architecture/`: new pages `concurrency.md`, `actors-and-blackboards.md`, `state-machines.md`,
  and `configuration.md`.

### Changed

- `AGENTS.md`: names dkstack and its owner. Projects follow `v1`. A dkstack rule wins over a
  project rule, except through a documented exception. The hard limits from `workflow/safety.md`
  are listed. The general rules are now links to the sections.
- `skills/triage`: the conflict rule now points to the precedence rules in `AGENTS.md`.
- `version-control/`: the commit subject format is now `type(scope)!: description`. The scope
  and the `!` breaking-change marker are optional. The 50-character limit stays.
- `coding/quality-gates.md`: an exception is allowed only for a diagnostic whose cause cannot be
  fixed in the repository. It needs a rule ID, the smallest scope, a reason, and approval by a
  reviewer who is not the author. Blanket suppressions and suppressed test failures stay forbidden.
  This replaces "Do not add exceptions".

### Fixed

- `scripts/check-title.mjs`: the title check now rejects a subject longer than 50 characters.
  It counts Unicode code points and does not count the ` (#NN)` suffix. A test now proves that
  the check rejects a double `!`.
- `scripts/check-title.mjs`: a title with only the ` (#NN)` suffix as the description fails.

## [1.0.0] - 2026-10-28

### Added

- `AGENTS.md`: the entry point for agents.
- `sample-AGENTS.md`: an `AGENTS.md` to copy into a project that uses dkstack.
- `CONTRIBUTING.md`: how to propose a change to dkstack.
- `SECURITY.md`: how to report a vulnerability in private.
- `.github/pull_request_template.md`: the pull request body template.
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
  the workflows, the CHANGELOG entry for the version and the unit tests.

[Unreleased]: https://github.com/daniel-kindl/dkstack/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/daniel-kindl/dkstack/releases/tag/v1.0.0
