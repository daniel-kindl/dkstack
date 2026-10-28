# Quality

## Principles

- Apply clean code, SOLID, DRY, KISS, and YAGNI.
- Prefer readable code over clever code.
- Name things so the purpose is clear without comments.
- Handle errors explicitly.
- Do not suppress a test to make a change pass.
- Do not suppress a warning to make a change pass, except as described in
  [Exceptions](quality-gates.md#exceptions).

## Broken windows

If you find a defect, dead code or a weak test in the code you touch, do not ignore it. Fix it when it is small and in scope. If not, open an issue. Reason: one problem that nobody fixes makes the next problem easier to accept.

## Security

For security rules, see [security.md](security.md).
