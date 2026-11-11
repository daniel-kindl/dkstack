# Test design

Tests specify externally observable behavior. Design them so a realistic incorrect implementation makes at least one fail.

## Arrange, act, assert

- **Arrange:** establish meaningful inputs and controlled dependencies.
- **Act:** invoke the supported behavior. Multiple operations are acceptable when the scenario itself is a sequence.
- **Assert:** check the outcome that matters: returned value, state, error, persisted data, emitted event or side effect.

Given-When-Then expresses the same sequence. Use the naming and structure native to the project and test framework.

## Choosing cases

- Derive tests from acceptance criteria and contracts, not production branches.
- Cover representative normal inputs, empty or missing values, boundaries, invalid values and errors when relevant.
- Use equivalence classes to avoid repeating cases that prove the same rule.
- Use parameterized tests for multiple examples of one behavior; use separate tests for different behaviors.
- For stateful behavior, test transitions and observable consequences, including invalid transitions.
- Assert important negative behavior, such as no data written on validation failure.

## Naming and assertions

Use names that communicate conditions and outcome, such as `RejectsNegativeQuantity` or `ReturnsNotFoundForUnknownId`. Avoid ambiguous names such as `Test1` or `Works`.

Prefer exact values or meaningful predicates over vague checks such as `not null` when the contract promises more. Multiple assertions are appropriate when they jointly define one observable outcome. Assert error types and meaningful details, not incidental implementation messages unless the message is a public contract.

## What not to test

- Do not directly test private methods. Exercise them through a supported boundary.
- Avoid testing internal call order, exact helper counts or temporary data layouts unless part of the contract.
- Do not assert a stub returns the value you configured it to return.
- Do not overfit tests to implementation details that can change safely during a refactor.

## Example

Good: storing a book with a known ID then reading by that ID returns its title and author; reading an unknown ID returns not found.

Bad: assert that `Repository.FindCore` is called exactly once when the public requirement only specifies a lookup result.

## Verify test strength

Temporarily change the implementation to return an incorrect result or skip an important side effect. The relevant test should fail. Restore the correct code. Use [coverage](coverage.md) and mutation tools when practical.

Related: [test levels](test-levels.md), [property testing](property-testing.md).
