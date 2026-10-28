# Testing

Tests prove behavior.

## Rules

- Write tests that fail when the behavior is wrong.
- Test the public behavior, not internal details.
- Use test doubles only for true dependencies you cannot control.
- Do not test private methods directly.
- Keep tests independent. One test must not depend on another.
- Start each bug fix with a failing test that reproduces the bug. Reason: the test proves the fix and stops the bug from coming back.
- Test boundaries, edge cases and error paths, not only the normal path. Reason: most defects are at the edges.
- Break the code on purpose once and make sure that a test fails. Reason: a test that cannot fail does not prove behavior.
- See [TDD](../tdd/index.md) for the development process.

## Good example

A test calls the public operation with specific input and checks the observable result.

## Bad example

A test reaches into internal state or mocks every collaborator so the test only checks that methods were called.

Related: [tdd/index.md](../tdd/index.md).
