# Code comments

Write comments only when the code cannot explain itself.

Prefer clear names and structure over comments.

## Rules

- Do not comment what the code already says.
- Comment why, not what.
- Explain non-obvious constraints, trade-offs, or business rules.
- Keep comments short. Follow [writing/index.md](index.md).
- Update or remove a comment when the code changes.
- Do not leave commented-out code.
- Do not use comments to disable code.

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
// Order must be preserved. Downstream consumers rely on insertion sequence.
process_in_order(items)
```

## Another bad example

```
// TODO: fix this later
// old_implementation()
new_implementation()
```

Commented-out code and vague TODOs hide problems.
