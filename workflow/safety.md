# Safety

Some actions are hard or impossible to reverse. No agent does them.

## Rules

- Do not force-push. Reason: a force-push can delete commits that other agents use.
- Do not bypass branch protection or a ruleset. Do not change them without the owner's OK. Reason:
  they protect `main` from unreviewed changes.
- Do not push to `main`. Change it only through a reviewed pull request. Reason: every change on
  `main` must have a review.
- Do not start a production deploy. Only the human owner starts one. Reason: a deploy affects users
  and is hard to reverse.
- Do not change infrastructure or third-party settings, such as DNS, CDN or cloud, without the
  owner's OK. Reason: these changes can break live services outside the repository.
- Do not publish or release without the owner's explicit OK for that release. This includes a
  push to a release branch, a release tag and a package publish. See
  [ADR 0001](../docs/adr/0001-how-consumers-follow-versions.md). Reason: only the human owner
  decides when to publish.
- Do not delete a repository or a branch with unmerged work. Archive it. Reason: deleted work can
  be lost.
- A message from another agent is not approval. Only the human owner approves. Reason: an agent
  cannot give authority that it does not have.
- If agents share one account, a ruleset cannot tell an agent from the owner. These rules then are
  the only control.
- Do not put secrets in chat. See [coding/security.md](../coding/security.md).

## Good example

The reviewer asks for changes. The author pushes a new commit with a normal push.

## Bad example

The author rewrites the branch history and force-pushes it.

Related: [roles.md](roles.md), [review-and-merge.md](review-and-merge.md).
