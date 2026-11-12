# Test isolation

Isolate tests from each other and from uncontrolled effects. Isolation means predictable dependencies, not mocking every collaborator.

## Test boundaries

- Prefer real domain objects and pure computations when they are cheap and deterministic.
- Control boundaries such as clocks, remote APIs, randomness, file systems and message brokers when they would make a unit test slow or unreliable.
- Use real infrastructure in integration tests when it is provisioned, disposable and part of the behavior being verified.
- Keep each test self-contained. Do not rely on global ordering or state left by earlier tests.
- Restore configuration, environment variables, files, processes and databases after a test.

## Test doubles

- **Stub:** returns controlled answers, without recording behavior.
- **Fake:** implements a simplified working version of a dependency, such as an in-memory repository.
- **Mock/spy:** records interactions that the test may verify.

Use the least complex double that proves the behavior. Verify calls only when the interaction is part of the contract, such as sending exactly one notification. Otherwise assert results and effects.

Test doubles may diverge from real implementations. When a fake represents a persistent boundary, verify its relevant contract against the real implementation or cover the boundary with integration tests.

## Fixtures

- Create fixtures with the smallest explicit state needed for a test.
- Avoid shared mutable fixtures and setup routines that hide important inputs.
- Reuse builders or factories when they reduce duplication without turning tests into puzzles.
- If tests run concurrently, use unique resources and avoid shared mutable singletons.

## Example

Good: inject a controllable clock into expiration logic and assert it expires at the specified instant.

Bad: wait for the wall clock to advance, assert within an arbitrary range and retry until green.

## Warning signs

Tests pass individually but fail together; results depend on order; cleanup is incomplete; assertions only inspect mock internals; mocks mirror the complete implementation.

Related: [deterministic tests](deterministic-tests.md), [test levels](test-levels.md).
