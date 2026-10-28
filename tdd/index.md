# Test-driven development

Write a failing test first. Then write the code that makes the test pass.

The test defines the expected behavior. The code exists to satisfy the test.

## Rules

- Write a test that fails for the right reason before you write production code.
- Write only enough code to make the current test pass.
- Refactor only when tests are green.
- Tests must prove behavior, not implementation details.
- Keep tests small and focused. One behavior per test.
- Do not skip the failing step.

For bug fixes, edge cases and error paths, see [coding/testing.md](../coding/testing.md).

## Good example

You need a function that adds two numbers.

1. Write a test that calls `add(2, 3)` and expects `5`. The test fails.
2. Write the smallest `add` implementation that returns `5`.
3. The test passes.
4. Add another failing test for a new case. Repeat.

The behavior is specified before the implementation.

## Bad example

Write the full `add` function first. Then write tests that match what the function already does.

The tests confirm the current code. They do not drive the design. A wrong implementation can pass if the tests were written after the fact.

## Another good example

A new requirement arrives. You write a failing test that describes the new behavior. Then you change the code until the test passes. Existing tests stay green.

## Another bad example

You change the code to meet a new requirement. Then you update or add tests so they pass.

The tests no longer protect against regressions. They only document what the code currently does.
