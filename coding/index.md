# Coding standards

Coding standards and practices.

## Sections

- [brace-style.md](brace-style.md): Brace placement and formatter exceptions.
- [practices.md](practices.md): Development practices.
- [quality.md](quality.md): Code quality rules.
- [immutability.md](immutability.md): Make values unchangeable by default.
- [naming.md](naming.md): Identifier forms, meaning and enforcement.
- [types.md](types.md): No escape from the type system, and explicit types.
- [quality-gates.md](quality-gates.md): Never weaken a quality gate.
- [error-handling.md](error-handling.md): Handle errors explicitly.
- [absent-values.md](absent-values.md): Show an absent value in its type.
- [logging.md](logging.md): Logging events and the observability assessment.
- [security.md](security.md): Security basics.
- [feature-flags.md](feature-flags.md): Each flag has an owner and an issue that removes it.
- [testing.md](testing.md): A pointer to [tdd/](../tdd/index.md), which has the testing rules.
- [dependencies.md](dependencies.md): No unjustified dependencies.
- [time.md](time.md): Time and dates in production code.
- [debugging.md](debugging.md): Reproduce the problem and fix the cause.
- [performance.md](performance.md): Measure first and set reproducible performance budgets.
- [reliability.md](reliability.md): Handle retries, deadlines, idempotency and overload.
- [observability.md](observability.md): Design metrics and traces with bounded cost and safe fields.
- [networking.md](networking.md): Handle framing, partial reads, disconnects and hostile inputs.
- [concurrency-practices.md](concurrency-practices.md): Make ownership, synchronization and cancellation explicit.
- [reproducible-builds.md](reproducible-builds.md): Build from declared, pinned inputs.

## Application

Apply these rules to all code changes.
