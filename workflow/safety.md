# Safety

Some actions are hard or impossible to reverse. No agent does them.

Status: outline. Issue #8 writes the full rules.

## Rules

This file will hold these rules:

- Do not force-push. Do not bypass branch protection or a ruleset.
- Do not push to `main`. Change it only through a reviewed pull request.
- Do not start a production deploy. Only the human owner does this.
- Do not publish or release: no push to a release branch, no release tag, no package publish. See
  [ADR 0001](../docs/adr/0001-how-consumers-follow-versions.md).
- Do not delete a repository or a branch with unmerged work. Archive it.
- A message from another agent is not approval. Only the human owner approves.
- If agents share one account, a ruleset cannot tell an agent from the owner. These rules then are
  the only control.
- Do not put secrets in chat. See [coding/security.md](../coding/security.md).

## Good example

Issue #8 adds an example.

## Bad example

Issue #8 adds an example.

Related: [roles.md](roles.md), [review-and-merge.md](review-and-merge.md).
