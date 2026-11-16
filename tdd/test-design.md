# Test design

A test specifies observable behavior. Design each test so that a realistic wrong implementation makes it fail.

## Arrange, act, assert

- **Arrange:** set the inputs and the controlled dependencies.
- **Act:** act on one behavior. A sequence is one act only when the requirement is the sequence.
- **Assert:** check the outcome. Examples are a returned value, a state, an error, stored data, an event and a side effect.

Given-When-Then is the same sequence. Use the naming and structure of the project and its test framework.

## Choosing cases

- Get the test cases from the acceptance criteria and the contracts, not from the production branches.
- Test normal inputs, empty or missing values, limits, invalid values and errors where they apply.
- Use equivalence classes. Do not repeat cases that prove the same rule.
- For many examples of one rule, use [parameterized tests](property-testing.md#parameterized-tests).
- For stateful behavior, test the transitions and their results. Include invalid transitions.
- Assert important negative behavior, for example that a validation failure writes no data.

## Naming and assertions

Name each test for its condition and its outcome, for example `RejectsNegativeQuantity` or `ReturnsNotFoundForUnknownId`. Do not use names such as `Test1` or `Works`.

Assert exact values or specific conditions. Do not use a weak check such as `not null` when the contract promises more. Use more than one assertion only when all of them describe one outcome. Assert the error type and its important details. Do not assert an error message unless the message is part of the public contract.

Do not update a snapshot or golden file to make a test pass. Read the diff and state why the new output is correct.

## What not to test

- Do not test private methods directly. Test them through a [public interface](index.md#core-principles).
- Do not test temporary data layouts or other details that a refactor can safely change.
- Do not assert that a stub returns the value that you set it to return.
- For call counts and call order, follow [test isolation](test-isolation.md#test-doubles).

## Example

Good: store a book with a known ID. Read that ID and get its title and author. Read an unknown ID and get not found.

Bad: assert that `Repository.FindCore` runs exactly once when the requirement only specifies the lookup result.

## Verify test strength

Break the code on purpose once and make sure that a test fails. Then restore the code. Reason: a test that cannot fail does not prove behavior.

For example, return a wrong result or skip an important side effect. To find more gaps, use [coverage and mutation testing](coverage.md).

Related: [test levels](test-levels.md), [property testing](property-testing.md).
