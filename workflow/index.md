# Workflow

How agents and the human owner work together, from an issue to a merged pull request.

These rules prevent real damage in a shared repository. Read them before you change any repository.

## Sections

- [roles.md](roles.md): Who does what. Generic role names, mapped to one team.
- [review-and-merge.md](review-and-merge.md): The issue to merge flow, review, merge and
  escalation.
- [feature-plans.md](feature-plans.md): The plan for a feature, and how agents hand it over.
- [safety.md](safety.md): Actions that no agent does, and what counts as approval.

## Flow

1. The owner or the coordinator opens an issue with acceptance criteria.
2. The implementer, architect or writer does the work on one branch and opens one pull request.
3. The reviewer reviews the pull request.
4. The reviewer merges it when the review passes and all required checks are green.

Related: [version-control/index.md](../version-control/index.md),
[CONTRIBUTING.md](../CONTRIBUTING.md).
