# Reliability engineering

Design failures as explicit outcomes, not surprises.

Use this page when code calls a network, a disk, another process or a service that can fail. This
page does not require retries or a circuit breaker for code without such a call.

## Boundaries

- Set timeouts using a known service or user requirement.
- Propagate cancellation and deadlines across layers.
- Retry only errors that are transient and safe to repeat.
- Bound retry count, elapsed time, and resource use.
- Use jittered backoff when many clients can retry together.
- Require idempotency or a deduplication contract before retrying writes.
- Track partial success and compensating actions for multi-step operations.
- Apply backpressure or bounded queues when producers outpace consumers.
- Fail safely. Do not hide retries that ran out.
- Use a circuit breaker only when the same call fails again and again.
- Document degraded behavior when a fallback sacrifices capability.
- Test disconnects, timeouts, retries, cancellation, overload, and recovery.

## Failure analysis

At design time, name the fault domain, the detection, the blast radius and the restore action for each failure. A unit test that passes does not prove availability when a real dependency fails.

See [error handling](error-handling.md), [logging](logging.md), and [debugging](debugging.md) when failures recur.
