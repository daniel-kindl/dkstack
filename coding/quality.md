# Quality

## Principles

- Apply clean code, SOLID, DRY, KISS, and YAGNI.
- Prefer readable code over clever code.
- Follow [naming.md](naming.md) for identifier forms and meaning.
- Handle errors explicitly. See [error-handling.md](error-handling.md).
- Do not suppress a test to make a change pass.
- Do not suppress a warning to make a change pass, except as described in
  [Suppressions](quality-gates.md#suppressions).

## Literal values

- Give a literal value that has a meaning a named constant, for example `MAX_RETRY_COUNT` in
  place of `3`. See [naming.md](naming.md) for the form. Reason: the name says what the value
  means, and a change is in one place.
- A value that changes between environments is configuration, not a constant. See
  [configuration](../architecture/configuration.md).
- Some values need no name. Examples are `0`, `1` and `-1` in plain arithmetic or as an index,
  and an empty string as a start value. A value in a test that shows the case under test also
  needs no name.
- Prefer a native check, for example ESLint `no-magic-numbers`, typescript-eslint
  `no-magic-numbers` or Ruff `PLR2004`. Configure its allowed values to match this list.

## Complexity

- Set a cyclomatic complexity limit for each function in the project's linter. Run the check
  in CI as an error. The default limit is 10. Examples are ESLint `complexity` with `max: 10`, Ruff `C901` with
  `max-complexity = 10` and the .NET analyzer rule `CA1502`.
- A project can select another limit. Record the limit and the reason in the project's coding
  rules.
- Do not raise the limit to make a change pass. Split the function into smaller functions with
  clear names. See [quality gates](quality-gates.md). Reason: a function with many paths is hard
  to read and needs many tests to cover each path.

## Broken windows

If you find a defect, dead code or a weak test in the code you touch, do not ignore it. Fix it when it is small and in scope. If not, open an issue. Reason: one problem that nobody fixes makes the next problem easier to accept.

## Security

For security rules, see [security.md](security.md).
