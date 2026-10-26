# Logging and observability

Log what helps diagnose problems. Do not log noise.

## Rules

- Log errors with context (what failed, relevant inputs, identifiers).
- Log important state changes.
- Do not log secrets, personal data, or full payloads by default.
- Use consistent structure so logs can be searched.
- Prefer fewer, higher-value log statements over many low-value ones.
- Make failures visible. See [fail-fast](../architecture/fail-fast.md).

## Good example

```
Failed to store order. order_id=123 reason=storage_unavailable
```

## Bad example

```
Something went wrong
```

or logging every intermediate value in a tight loop.
