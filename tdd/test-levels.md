# Test levels

Choose the least expensive level that proves the intended contract. Levels complement each other; repeating identical assertions at every level is not a goal.

## Unit tests

Exercise a small behavior with controlled dependencies. Prefer fast, deterministic feedback and meaningful public or supported interfaces. A unit need not equal one method or class.

Example: a parser accepts a valid token and rejects an invalid boundary value.

## Integration tests

Verify that components and their real boundaries cooperate: persistence, serialization, filesystem, HTTP routing, framework configuration or a message broker. Use isolated, reproducible test infrastructure and clean up afterward.

Example: saving a book through the application service and reloading it from the configured test database.

## Contract tests

Verify expectations between independently maintained consumers and providers. Record request, response, schema, versioning and failure behavior relevant to the boundary. A mock of the provider alone does not prove provider conformance; verify the contract with the provider or its published contract suite.

Example: ensure a client and HTTP service agree on how a missing book is represented.

## End-to-end tests

Verify critical journeys in the assembled application, using real user-facing entry points where feasible. Keep them selective because setup and failure diagnosis are costly.

Example: enter a book title, save it and observe it in the collection view.

## Choosing a test

1. Identify which boundary or behavior could fail.
2. Start with a unit test when it can prove the requirement.
3. Add an integration or contract test when correctness depends on collaboration or external behavior.
4. Add end-to-end coverage for critical workflows not sufficiently proved at lower levels.
5. Avoid broad end-to-end tests for every input permutation.

For concurrency, use tests at the level where the actual synchronization behavior appears. For hardware or platform behavior, record which environment ran the test and which paths remain unverified.

Related: [test design](test-design.md), [test isolation](test-isolation.md).
