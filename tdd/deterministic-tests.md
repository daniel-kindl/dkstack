# Deterministic tests

A test must give the same result for the same inputs in a supported environment. Do not hide nondeterminism with retries.

## Common sources

- **Time:** inject a clock or freeze time. Control time zones and daylight saving changes.
- **Randomness:** inject a seeded generator or use fixed data.
- **Concurrency:** coordinate with events, channels or explicit barriers. Do not use fixed sleeps or timing guesses.
- **Environment:** control the locale, the configuration, the working directory, operating system differences and the process state.
- **External state:** isolate databases, files, shared caches, network endpoints and the resources of other tests.

## Asynchronous behavior

Wait for an observable completion signal or condition, with a timeout. The timeout is a safety limit, not an expected duration. Test cancellation and failure paths without depending on thread scheduling.

For duration and other performance claims, use [performance testing](performance-testing.md).

## Flaky tests

1. Record the failing input, the seed, the logs and the environment.
2. Reproduce the failure under controlled conditions. Look for shared state and race conditions.
3. Fix the cause in the test or in the product.
4. Run the affected tests and the tests near them again.

A pass on retry does not prove that the defect is gone. Do not weaken the assertions of a flaky test. Do not commit a focus marker, such as `.only` or `fit`. Do not commit a new skip or quarantine without a linked issue. Follow [quality gates](../coding/quality-gates.md) for failures and suppressions.

## Example

Bad: start background work, sleep for 200 milliseconds, then check the output.

Good: wait for an observable completion signal with a timeout. Then assert the output.

Related: [test isolation](test-isolation.md), [property testing](property-testing.md).
