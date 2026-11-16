# Test levels

Use the least expensive level that proves the contract. Do not test the same behavior at many levels. Keep integration and end-to-end tests few. Use them for behavior that a unit test cannot prove.

## Unit tests

Test a small behavior with controlled dependencies through a [public interface](index.md#core-principles). Unit tests give fast and deterministic feedback. A unit does not have to be one method or one class.

Example: a parser accepts a valid token and rejects an invalid boundary value.

## Integration tests

Test that components and their real boundaries work together. Examples are persistence, serialization, the file system, HTTP routing, framework configuration and a message broker. Use isolated and repeatable test infrastructure. Clean it up after the test.

Example: save a book through the application service. Load it again from the test database.

## Contract tests

Test the expectations between a consumer and a provider that change independently. Record the request, the response, the schema, the versioning and the failure behavior at the boundary. A mock of the provider does not prove that the provider follows the contract. Test the contract against the provider or its published contract tests.

Example: make sure that a client and an HTTP service agree on the response for a missing book.

## End-to-end tests

Test critical user journeys in the assembled application. Use the real user entry points where possible. At this level, setup and failure diagnosis cost the most.

Example: enter a book title, save it and find it in the collection view.

## Choosing a test

1. Find the boundary or behavior that can fail.
2. Start with a unit test when it can prove the requirement.
3. Add an integration or contract test when correctness depends on other components or on external behavior.
4. Add an end-to-end test for a critical workflow that the lower levels do not prove.
5. Do not write end-to-end tests for each input combination.

For concurrency, test at the level where the real synchronization happens. For hardware or platform behavior, record the environment that ran the test and the paths that no test verified.

Related: [test design](test-design.md), [test isolation](test-isolation.md).
