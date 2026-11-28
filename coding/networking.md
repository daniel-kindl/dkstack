# Networking and protocol code

Treat transport boundaries as unreliable and messages as untrusted.

Use this page when code reads or writes a network protocol or another byte stream. This page owns
how code reads and writes the bytes. It does not define what a public interface promises. See [API and protocol contracts](../architecture/api-contracts.md) for that promise.

## Rules

- Implement the framing, encoding, byte order, limits and version negotiation that the protocol defines.
- Do not assume one read receives a complete message or one write sends it all.
- Handle zero-byte reads, disconnects, truncation, duplicate messages, and partial writes.
- Bound input length, parsing work, queue capacity, and time spent waiting.
- Handle cancellation, timeout, protocol error and transient transport failure as different errors.
- Validate length fields before allocating or decoding.
- Apply backpressure. Retry as [reliability](reliability.md) says.
- Keep shared connection state explicit and race-free.
- Test fragmentation, coalescing, invalid lengths, reconnects, and shutdown.
- When other implementations of the protocol exist, test with their contract fixtures.

See [reliability](reliability.md), [security](security.md), and [test levels](../tdd/test-levels.md).
