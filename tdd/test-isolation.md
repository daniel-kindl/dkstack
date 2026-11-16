# Test isolation

Isolate each test from other tests and from effects that you do not control. Isolation means predictable dependencies. It does not mean a mock for each collaborator.

## Test boundaries

- Use real domain objects and pure functions when they are fast and deterministic.
- Use test doubles only for dependencies that you cannot control in a unit test. Examples are a clock, a remote API, randomness, a file system and a message broker.
- Do not use the public network in unit tests.
- Use real infrastructure in integration tests when the project provides it, it is disposable and it is part of the behavior under test.
- Keep each test self-contained. Do not depend on test order or on state from earlier tests.
- After each test, restore the configuration, environment variables, files, processes and database records that it changed.

## Test doubles

- **Dummy:** fills a parameter. The test never uses it.
- **Stub:** returns set answers.
- **Spy:** a stub that records calls. The test asserts the calls after the act.
- **Mock:** has the expected calls set before the act. It fails on a wrong call.
- **Fake:** a simple working version of a dependency, such as an in-memory repository.

Use the simplest test double that proves the behavior. Verify calls, call counts or call order only when the interaction is part of the contract. An example is a requirement to send exactly one notification. In all other cases, assert results and effects.

A test double can differ from the real implementation. When a fake replaces a persistent boundary, test its contract against the real implementation or cover the boundary with integration tests.

Do not mock a third-party API directly. Wrap it in an adapter. Test the adapter with an integration test. Mock the adapter in unit tests.

## Fixtures

- Give each fixture the smallest explicit state that the test needs.
- Do not share mutable fixtures. Do not hide important inputs in setup code.
- Use builders or factories when they remove duplication and keep the test easy to read.
- If tests run at the same time, give each test its own resources. Do not share mutable singletons.

## Example

Good: inject a clock that the test controls into the expiry logic. Assert that the item expires at the specified time.

Bad: wait for the real clock to move, assert a time range and retry until the test passes.

## Warning signs

- Tests pass alone but fail together.
- Results depend on test order.
- Cleanup is incomplete.
- Assertions check only the internals of a mock.
- Mocks copy the full implementation.

Related: [deterministic tests](deterministic-tests.md), [test levels](test-levels.md).
