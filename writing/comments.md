# Code comments

Write comments only when the code cannot explain itself.

Prefer clear names and structure over comments.

## Rules

- Do not comment what the code already says.
- Comment why, not what.
- Explain non-obvious trade-offs or business rules. For a constraint, see
  [A comment as a signal](#a-comment-as-a-signal).
- Keep comments short. Follow [writing/index.md](index.md).
- Update or remove a comment when the code changes.
- Do not leave commented-out code.
- Do not use comments to disable code.

## A comment as a signal

Some comments show a problem in the code. Do not keep such a comment as the fix.

- A comment that explains a workaround or a surprise in your own code shows a design problem.
  Fix the cause, then delete the comment. If the cause is out of scope, keep the comment,
  open an issue and link the issue in the comment. This is the same model as a temporary
  suppression in [coding/quality-gates.md](../coding/quality-gates.md#suppressions).
- A comment that guards a constraint, for example "do not remove" or "do not change the order",
  is a rule that nothing enforces. Encode the constraint as a type, a runtime check, a test or
  a lint rule. Write the failing test first, as [tdd-loop](../skills/tdd-loop/SKILL.md) says.
  Then delete the comment.
- A reviewer reports each such comment as a finding. The author fixes it in the same pull
  request.

### Comments that stay

These comments stay, because code cannot hold the same information:

- A license header.
- A link to an external specification, for example an RFC.
- A doc comment on a public API.
- A comment about a fact that the project cannot change, for example a bug in a third-party
  tool, a protocol rule or a law. Link the source.

### Good example

```
test("process keeps the insertion order", () => {
  assert.deepEqual(process_in_order([3, 1, 2]), [3, 1, 2])
})

process_in_order(items)
```

The test enforces the constraint. No comment is necessary.

### Bad example

```
// Do not sort here. Sorting broke the export last time.
process_in_order(items)
```

Nothing stops a person from adding a sort. The comment also refers to a past problem, not to a
rule. Write a test that fails when the order changes, then delete the comment.

## Good example

```
// Retry only on transient network errors. Permanent errors must surface.
if is_transient(error)
  retry()
```

The comment explains the reason for the check.

## Bad example

```
// Check if error is transient
if is_transient(error)
  // Retry the operation
  retry()
```

The comments repeat the code. They add no information.

## Another good example

```
// The payment API returns HTTP 200 for a declined card. Read the status field.
// See https://example.com/payments/docs#declines
if response.body.status == "declined"
  fail_payment()
```

The comment records a fact that the project cannot change, and it links the source.

## Another bad example

```
// TODO: fix this later
// old_implementation()
new_implementation()
```

Commented-out code and vague TODOs hide problems.
