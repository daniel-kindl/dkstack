# Dependencies

Do not add unjustified dependencies.

## Rules

- Add a dependency only when it provides clear value you cannot reasonably build.
- Prefer the standard library or existing code when it is sufficient.
- Evaluate the cost: maintenance, security, size, and license.
- Remove a dependency when it is no longer needed.
- Pin versions for reproducibility.

## Good example

You need date formatting. The standard library already provides it. You use the standard library.

## Bad example

You add a large library for a single simple function that the standard library or ten lines of code can provide.
