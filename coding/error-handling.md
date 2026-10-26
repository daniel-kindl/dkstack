# Error handling

Handle errors explicitly. Do not hide them.

## Rules

- Check for errors at the point they can occur.
- Stop or return a clear failure when an error happens. See [fail-fast](../architecture/fail-fast.md).
- Do not catch an error and continue with a default that hides the problem.
- Do not use error codes or special values that callers can ignore.
- Propagate errors that the current level cannot handle.
- Log the error with enough context to diagnose it.

## Good example

An operation fails. It stops and reports the failure with the reason.

## Bad example

An operation fails. It logs a message and returns an empty result. Callers treat the empty result as success.

Related: [design-by-contract.md](../architecture/design-by-contract.md).
