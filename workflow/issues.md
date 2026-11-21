# Issues

Each task has one issue. The issue states the scope that the pull request and the review check.

The [start-issue](../skills/start-issue/SKILL.md) skill applies these rules.

## Rules

- One task, one issue. Before you open an issue, search the open issues for the same task. Use
  the issue that exists. Open a new issue only when none exists. Reason: two issues for one task
  split the record and the review.
- An issue has one task. If a request has more than one task, open one issue for each task and
  link them with [relations](#relations). Reason: each issue becomes one branch and one pull
  request. See [review-and-merge.md](review-and-merge.md).
- An issue has a goal and acceptance criteria. Reason: the review checks the change against them.
- Set exactly one type label: `type:bug`, `type:feature`, `type:chore`, `type:refactor`,
  `type:docs` or `type:research`. Reason: the type tells the reader what kind of change to
  expect.
- A priority label is optional: `priority:p0` (the most urgent) to `priority:p3` (the least
  urgent). Reason: the owner sets the order of the work.
- Use only labels that exist in the project. Do not create, change or delete a label without the
  owner's OK. Reason: labels are shared project settings.
- Assign the issue to the account that you are logged in as only when you start to work on it.
  To work on an issue is to do its task: code, docs or research. Do not assign an issue when you
  only open, triage or review it. Reason: an assignment tells other people and agents that the
  work on the issue has started.
- An assignment is a marker only. It is not an approval, a claim or a review. Reason: agents that
  share the owner's account show as the owner. See [owner](safety.md#owner).
- If a different account is assigned, do not start the work. Ask the owner. Reason: someone
  else can already do the work.
- If you stop before you open a pull request, remove your assignment and write a comment that
  says where the work stopped. Reason: the next person sees that the issue is free.
- Link the issue in the pull request, for example `Closes #12`. Reason: the merge closes the
  issue and the record stays complete.

## Relations

Use the relations of the issue tracker to record how issues connect. Do not record them only in
text, for example "Plan item P17 of #154" or "Order: after P02".

- A task that has parts is a parent issue. Each part is a sub-issue. Reason: the parent shows
  the progress of the whole task, and each part keeps its own branch and pull request.
- When one issue must wait for another, set "blocked by" on the issue that waits. Reason: the
  tracker shows the order and shows when a blocker closes. A line of text does not change when
  the blocker closes.
- Before you start work on an issue, check its blockers. Do not start while a blocker is open.
  Tell the owner. Reason: the work can depend on a change that does not exist yet.
- If the tracker has no relations, write them at the top of the issue body as
  `Parent: #154` and `Blocked by: #160`. Reason: the next reader finds them in one place.

On GitHub, use `gh`. These commands were verified with `gh` 2.97.0:

```bash
# Open an issue as a sub-issue of #154 that waits for #160.
gh issue create --title "<title>" --body "<body>" --parent 154 --blocked-by 160

# Add #161 and #162 as sub-issues of #154.
gh issue edit 154 --add-sub-issue 161,162

# Add or remove a blocker of #161.
gh issue edit 161 --add-blocked-by 160
gh issue edit 161 --remove-blocked-by 160

# Show the open blockers of #161. An empty list means no open blocker.
gh issue view 161 --json blockedBy -q '[.blockedBy.nodes[] | select(.state == "OPEN") | .number]'
```

## Projects without an issue tracker

If the project has no issue tracker, or the agent cannot use it, keep one file for each task in
`docs/issues/`.

- Name the file `NNNN-<slug>.md`. `NNNN` is the next free number with four digits, for example
  `0007-export-csv.md`.
- Start the file with these lines:

  ```markdown
  # <title>

  Type: bug | feature | chore | refactor | docs | research
  Priority: p0 | p1 | p2 | p3 | none
  Assignee: <name of the person or agent, or none>
  State: open | closed
  Parent: <file name or none>
  Blocked by: <file names or none>
  ```

- Then write the goal and the acceptance criteria.
- The [relations](#relations) rules apply. Write the file names in `Parent` and `Blocked by`, for
  example `Blocked by: 0006-csv-format.md`. Before you start work on a task, open each file in
  `Blocked by`. If a file in `Blocked by` has `State: open`, do not start.
- The same rules apply: one task for each file, one type, and set `Assignee` only when you start
  to work on the task.
- Commit the file with the first change of the task. Set `State: closed` in the pull request that
  completes the task. Do not delete the file.
- Link the file in the pull request, for example `Closes docs/issues/0007-export-csv.md`.

## Good example

The owner asks for a CSV export. The agent searches the open issues and finds none. It opens
`feat: export the library as CSV` with a goal, acceptance criteria, the label `type:feature` and
the label `priority:p2`. It does not assign the issue yet. When it starts to work on the issue,
it assigns the issue to the logged-in account. On GitHub, it can use
`gh issue edit 42 --add-assignee @me`. Then it creates the branch.

## Bad example

The owner asks for a CSV export and a fix for a crash on start. The agent opens one issue
`export and crash fix` with no labels. It assigns the issue while it only triages the request. Later it
does both tasks on one branch.

Related: [review-and-merge.md](review-and-merge.md), [safety.md](safety.md).
