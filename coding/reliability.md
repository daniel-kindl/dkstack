# Reliability engineering

Design failures as explicit outcomes, not surprises.

## Boundaries

- Set timeouts using a known service or user requirement.
- Propagate cancellation and deadlines across layers.
- Retry only errors that are transient and safe to repeat.
- Bound retry count, elapsed time, and resource use.
- Use jittered backoff when many clients can retry together.
- Require idempotency or a deduplication contract before retrying writes.
- Track partial success and compensating actions for multi-step operations.
- Apply backpressure or bounded queues when producers outpace consumers.
- Fail safely rather than concealing exhausted retries.
- Use a circuit breaker only when repeated failures justify it.
- Document degraded behavior when a fallback sacrifices capability.
- Test disconnects, timeouts, retries, cancellation, overload, and recovery.

## Failure analysis

Identify fault domain, detection, blast radius, restoration action, and evidence. A successful unit test does not prove availability under real dependency failures.

See [error handling](error-handling.md), [logging](logging.md), and [debugging](debugging.md) when failures recur.
