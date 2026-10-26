# Short-lived feature branches

Create a branch for one change. Merge it quickly. Delete it.

Keep branches short so integration stays easy and feedback stays fast.

## Rules

- One branch per logical change or feature.
- Keep the branch lifetime short (hours or a few days, not weeks).
- Rebase or merge main frequently so the branch does not drift.
- Open a pull request early. Get feedback before the branch grows.
- Merge as soon as the change is ready and reviewed.
- Delete the branch after merge.
- Do not accumulate unrelated commits on a long-lived branch.

## Good example

You need to add a small feature.

1. Create a branch from main.
2. Make the change and its tests.
3. Open a pull request the same day.
4. Address review comments.
5. Merge and delete the branch.

The branch exists only for the duration of the work. Main stays current.

## Bad example

You create a branch and work on it for two weeks. You add the original feature, then extra fixes, then unrelated cleanup.

When you open the pull request, the diff is large. Main has moved. Conflicts are hard to resolve. Review is slow.

## Another good example

A bug fix takes less than a day. The branch is created, the fix is committed, the pull request is merged, and the branch is deleted before the end of the day.

## Another bad example

A branch stays open for a month. Multiple people push to it. The purpose of the branch is no longer clear. Merging it requires a large integration effort.
