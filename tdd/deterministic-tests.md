# Deterministic tests

A test must produce the same outcome for the same inputs and supported environment. Do not hide nondeterminism behind retries.

## Common sources

- **Time:** inject a clock or freeze time; control time zones and daylight saving boundaries.
- **Randomness:** inject a seeded generator or use fixed data for reproducible examples; report the seed for failing property or fuzz cases.
- **Concurrency:** coordinate with events, channels or explicit barriers; avoid arbitrary sleeps and timing assumptions.
- **Environment:** control locale, configuration, working directory, operating-system differences and process state.
- **External state:** isolate databases, files, shared caches, network endpoints and other tests' resources.

## Asynchronous behavior

Await observable completion or an explicit condition with a bounded timeout. A timeout is a safety limit, not an expected duration. Prove cancellation and failure paths without depending on scheduling luck.

Never assert that an operation takes an exact number of milliseconds in a unit test. Use [performance testing](performance-testing.md) for performance claims.

## Flaky tests

1. Record the failing input, seed, logs and environment.
2. Reproduce under controlled conditions; inspect shared state and races.
3. Fix the underlying test or product defect.
4. Rerun the affected suite and nearby tests.

A pass on retry is not evidence the defect disappeared. Do not silently quarantine, skip or loosen assertions. Follow [quality gates](../coding/quality-gates.md) for failures and any exceptional suppression.

## Example

Bad: start background work, sleep for 200 milliseconds, then check the output.

Good: wait for an observable completion signal, bounded by a timeout, then assert the output.

Related: [test isolation](test-isolation.md), [property testing](property-testing.md).
