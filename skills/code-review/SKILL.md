---
name: code-review
description: "Use when you review a pull request or a diff, including your own before you open a PR. Checks the change against the repository standards and the specification."
---

# Code review

Use when you review a change.

Review on two axes: standards and specification.

## Standards axis

Check the change against the relevant sections:

- [coding/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/index.md)
- [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md)
- [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md)
- [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)

List violations. Order by severity.

## Specification axis

Check whether the change does what the originating issue or request asked for.

List gaps or extra scope.

## Rules

- Do not mix the two axes in one finding.
- Prefer concrete, actionable findings.
- Do not approve a change that weakens a quality gate. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).
