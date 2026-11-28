# Concurrency practices

Apply [architecture concurrency](../architecture/concurrency.md) to actual shared state.

Use this page when code shares mutable state between threads, tasks or processes. This page does
not require locks or parallel work for code without shared state.

- List the mutable state and which workers may access it.
- Give shared state an owner as [concurrency](../architecture/concurrency.md#rules) says. Document the synchronization strategy.
- Do not hold locks across callbacks, blocking I/O or awaited work.
- Bound parallelism and queues. Define overload behavior.
- Propagate cancellation and dispose resources on every exit path.
- Test race-prone interleavings with controlled schedules when the test framework supports them.
- Use stress tests as supporting evidence, not proof of race freedom.
- Specify ordering guarantees. Do not assume callbacks arrive in order.
- Use idempotent handlers when duplicate delivery is possible.
- Confirm shutdown does not leave work or resources stranded.

See [deterministic tests](../tdd/deterministic-tests.md) and [resource balancing](../architecture/resource-balancing.md).
