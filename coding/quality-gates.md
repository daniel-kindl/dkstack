# Quality gates

Never weaken a quality gate.

A gate that fails must stay failing until the cause is fixed, except as described in
[Exceptions](#exceptions).

## Rules

- Do not disable, skip, or lower a check to make a change pass.
- Do not suppress a test failure. Fix the code or the test.
- Do not suppress a warning without fixing the cause, except as described in
  [Exceptions](#exceptions).
- Run all checks before you open a pull request.
- If a check cannot run, report it as NOT RUN. Do not claim it passed.
- Fix the root cause first.

## Exceptions

Add an exception for a diagnostic only when you cannot fix the cause in this repository.
A recorded exception is not a weakened gate. The gate stays active for all other code.
Examples are generated source and an external or platform API contract that you cannot change.

Each exception must have all of these parts:

- The rule ID of the diagnostic.
- The smallest scope: one line, one file, or one project.
- The reason the cause cannot be fixed here.
- Approval by a reviewer who is not the author, in the issue or pull request.

Record a persistent exception beside the code or in the repository docs. A temporary exception
links to the issue that removes it.

Never add a blanket suppression. Do not add a broad pragma, a global `NoWarn`, a disabled analyzer,
or a general formatter exclusion.

Consumer repositories link to this rule. Do not restate it.

## Good example

A generated file triggers an analyzer warning. You cannot change the generator. You suppress that
rule ID for that file only. You state the reason beside the suppression. A reviewer approves it in
the pull request.

A test fails. You fix the code or the test so the real behavior is correct. The gate stays active.

## Bad example

A test fails. You mark the test as ignored or lower the coverage threshold so the build passes.

An analyzer reports many warnings. You add a global `NoWarn` for the rule so the build passes.

Related: [fail-fast.md](../architecture/fail-fast.md).
