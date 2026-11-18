# Logging and observability

Assess observability for every added or changed behavior. Add logging events only when they provide useful diagnostic or operational information. An assessment is mandatory; adding an event is conditional. Do not require a minimum number of events or use of every log level. Pure functions and routine internal operations often need no logging.

## Assess event placement

For each affected behavior, consider external interactions, significant state transitions, decisions that change execution, retries, recoverable degradation, and terminal failures. For each candidate event, ask:

1. What operational or diagnostic question will it answer?
2. Which boundary owns the event and has enough context?
3. What severity reflects the impact at that boundary?
4. Which safe, stable fields make the event useful?
5. Can its frequency, formatting cost, or content cause harm?

Omit events that duplicate information, add noise, lack a useful diagnostic purpose, or are disproportionate to the operation. Limit the assessment to affected behavior. Do not add unrelated instrumentation. No separate report or documentation is required for routine omissions; explain a non-obvious omission when useful for review.

## Levels

Use the project's supported levels and map their meaning to these guidelines:

| Level | Use |
| --- | --- |
| Trace | Fine-grained execution or protocol details when specifically useful and safe. |
| Debug | Internal decisions and diagnostic information, such as retry scheduling. |
| Information | Important successful operations, lifecycle events and state changes. |
| Warning | Unexpected but recoverable degradation that warrants attention. |
| Error | A failed operation requiring investigation, at the boundary that owns its failure. |
| Critical or Fatal | A failure that prevents the system or a major subsystem from operating safely. |

An exception type alone does not determine severity. Do not log ordinary successful operations at Warning or failures at Critical without sufficient impact. A feature need not produce an event at every level.

## Event design

- Prefer structured event templates and named fields when supported. Keep event identity, field names, and field types stable.
- Include only relevant safe context: operation, entity identifier, attempt count, outcome, elapsed time, or propagated correlation context when appropriate.
- Preserve exception details through the logger's exception mechanism. Do not construct stack traces manually.
- Do not log secrets, credentials, tokens, personal data, or full request, response, or protocol payloads by default. Follow the project's stricter security policy.
- Use existing logging facilities, event naming, levels, scopes and configuration. Do not introduce a logging dependency or telemetry infrastructure without justification.
- Preserve existing correlation or trace context across boundaries when available. Do not invent a new correlation ID for each method.

## Failure ownership and duplicates

Log a terminal failure once at the boundary responsible for handling or reporting that failure. Lower layers may propagate exceptions without logging them. Do not log an exception as an error and immediately rethrow it when the caller will log the same terminal failure. Individual attempts or retries may have Debug or Warning events when useful; a final exhausted retry operation may warrant Error. Distinguish expected validation outcomes from operational degradation. Logging never replaces explicit error handling; see [error handling](error-handling.md).

## Cost and signal

Avoid per-item or per-iteration events in hot paths without a demonstrated need. Avoid eager expensive message formatting when a level is disabled, unbounded event volume, blocking logging operations on latency-sensitive paths, and unnecessary high-cardinality fields. Use filtering, sampling or rate limiting where the project supports it and the diagnostic need justifies it. Logging must not alter the operation's outcome or obscure its failure.

## Verification

Review event necessity, placement, severity, context, privacy, duplicates and overhead. Test logs as contracts only when downstream behavior depends on them, such as security audit trails, alerts or monitoring. Verify event identity, severity, required safe fields and absence of prohibited data where relevant. Do not assert incidental message wording or introduce test doubles solely to test routine diagnostics. See [test design](../tdd/test-design.md) and [test isolation](../tdd/test-isolation.md).

## Examples

Good: `Device connection established. device_id=123` at Information after an important transition.

Good: a retry is scheduled at Debug, followed by one Error if all attempts fail and the owning boundary cannot complete the operation.

Bad: log the same exception as Error in a repository, service and controller while rethrowing between them.

Bad: log all authentication tokens or each intermediate variable in a tight loop.
