# Networking and protocol code

Treat transport boundaries as unreliable and messages as untrusted.

## Rules

- Specify framing, encoding, byte order, limits, and version negotiation.
- Do not assume one read receives a complete message or one write sends it all.
- Handle zero-byte reads, disconnects, truncation, duplicate messages, and partial writes.
- Bound input length, parsing work, queue capacity, and time spent waiting.
- Distinguish cancellation, timeout, protocol error, and transient transport failure.
- Validate length fields before allocating or decoding.
- Apply the correct backpressure and retry policy for the operation.
- Keep shared connection state explicit and race-free.
- Test fragmentation, coalescing, invalid lengths, reconnects, and shutdown.
- Use contract fixtures from multiple implementations where available.

See [reliability](reliability.md), [security](security.md), and [test levels](../tdd/test-levels.md).
