---
name: code-review
description: Review a change on two axes: standards compliance and specification fidelity.
---

# Code review

Use when you review a change.

Review on two axes: standards and specification.

## Standards axis

Check the change against the relevant sections:

- [coding/index.md](../coding/index.md)
- [architecture/index.md](../architecture/index.md)
- [tdd/index.md](../tdd/index.md)
- [version-control/index.md](../version-control/index.md)

List violations. Order by severity.

## Specification axis

Check whether the change does what the originating issue or request asked for.

List gaps or extra scope.

## Rules

- Do not mix the two axes in one finding.
- Prefer concrete, actionable findings.
- Do not approve a change that weakens a quality gate. See [coding/quality-gates.md](../coding/quality-gates.md).
