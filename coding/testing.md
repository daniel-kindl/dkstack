# Testing

Tests prove behavior.

## Rules

- Write tests that fail when the behavior is wrong.
- Test the public behavior, not internal details.
- Use test doubles only for true dependencies you cannot control.
- Do not test private methods directly.
- Keep tests independent. One test must not depend on another.
- See [TDD](../tdd/index.md) for the development process.

## Good example

A test calls the public operation with specific input and checks the observable result.

## Bad example

A test reaches into internal state or mocks every collaborator so the test only checks that methods were called.

Related: [tdd/index.md](../tdd/index.md).
