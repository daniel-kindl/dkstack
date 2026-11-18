# Logging

This page covers log events. Metrics and traces are out of scope.

Assess logging for each change that adds or changes behavior. You must always do the assessment. Add an event only when it answers a diagnostic or operational question. Do not require a minimum number of events. Do not require each level. Pure functions and routine internal operations usually need no event.

When you write a plan, record the result in its `Observability:` entry. Always record it in the pull request body. See [plan-work](../skills/plan-work/SKILL.md) and [write-pr](../skills/write-pr/SKILL.md).

## Assess event placement

For each changed behavior, look at these places:

- External calls.
- Important state changes.
- Decisions that change the flow.
- Retries.
- Designed fallbacks.
- Terminal failures.

For each candidate event, answer these questions:

1. Which operational or diagnostic question does the event answer?
2. Which boundary owns the event and has the context?
3. Which level matches the impact at that boundary? See [levels](#levels).
4. Which safe and stable fields does the event need?
5. Can its frequency, its formatting cost or its content cause harm?

If you cannot answer question 1, do not add the event. Do not add an event that repeats the data of another event. Assess only the changed behavior. Do not add events to other code.

## Levels

Use the levels of the project. The table gives the .NET name and the OpenTelemetry severity name of each level.

| .NET | OpenTelemetry | Use |
| --- | --- | --- |
| Trace | TRACE | Detailed execution or protocol steps. Do not log payloads. See [event design](#event-design). |
| Debug | DEBUG | Internal decisions and each retry attempt. |
| Information | INFO | Important successful operations, lifecycle events and state changes. |
| Warning | WARN | A designed fallback ran and the result is degraded. A resource is close to its limit. A [security event](security.md#rules) happened. |
| Error | ERROR | An operation failed and a person must investigate it. |
| Critical | FATAL | The system or a major subsystem cannot operate safely. |

- The exception type alone does not set the level. Use the impact at the boundary.
- Log each retry attempt at Debug. If all attempts fail, log one Error at the boundary that owns the operation.
- Use Warning only for a designed fallback, a resource close to its limit or a [security event](security.md#rules). Do not use a fallback to hide a failure. See [fail-fast](../architecture/fail-fast.md).
- Log a near-limit Warning when the resource crosses the threshold, not at each check.
- An expected rejection is not an Error. Log it at Debug, or do not log it when the response already reports it. Log it at Information only when an operator uses the event, for example a business rule rejection. A failed sign-in and a denied access are exceptions to this rule. Log them as the [security rules](security.md#rules) say.
- Do not log a successful operation at Warning.
- A feature does not need an event at each level.

## Event design

- Use structured event templates with named fields when the logging library supports them. Keep the event names, the field names and the field types stable.
- Put only the context that the event question needs in fields. Examples are the operation, the resource identifier, the attempt count, the outcome, the elapsed time and the correlation ID.
- For secrets, personal data and the IDs that a log can contain, follow the [security rules](security.md#rules). Test them with the [marker value test](../tdd/security-testing.md#secrets).
- Do not log a full request, response or protocol payload by default. This default applies only to payloads. Personal data is never allowed.
- If you log an untrusted value, put it in a structured field. Do not join it into the message text.
- In plain text logs, remove or encode CR, LF and other control characters in untrusted values. This prevents log injection (CWE-117).
- Give the exception to the exception argument of the logger. Do not build a stack trace by hand.
- Use the existing logging library, event names, levels, scopes and configuration. Do not add a logging dependency or telemetry infrastructure unless the task asks for it.
- Keep the correlation or trace context across boundaries. At an inbound boundary without context, create the correlation ID once and pass it on. Do not create a new correlation ID in each method.

## Failure ownership and duplicates

- Log a terminal failure once, at the boundary that handles or reports it.
- A lower layer does not log the failure. It propagates the failure.
- To add context in a lower layer, wrap the error with that context and rethrow it. Do not log it there.
- Do not log an error and then rethrow it when a caller logs the same failure.
- Logging does not replace error handling. See [error handling](error-handling.md).

## Cost and signal

- In a hot path, do not log each item or each iteration. Log a summary event instead.
- Do not format an expensive message when its level is off. Use the templates or the level checks of the library.
- Do not let the event volume grow without a limit. Use filtering, sampling or rate limits when the project supports them.
- Do not block a latency-sensitive path with a logging call.
- A resource ID in a log field is allowed. The limit on high-cardinality values applies to metric labels and indexed attributes, not to log fields.
- A logging call must not change the result of an operation or hide its failure.

## Verification

Review each changed event against this page. To decide if a test must check an event, follow [logging contracts](../tdd/test-design.md#logging-contracts). To fake the logger in a test, follow [logger dependencies](../tdd/test-isolation.md#logger-dependencies).

## Examples

Good: the template `Device {device_id} connected` with the field `device_id=123`, at Information, after a device connects.

Good: one Error event at the boundary that owns the order operation, after all attempts fail. The event is `event=order.store_failed order_id=123 reason=storage_unavailable attempt=3`. Each earlier attempt logs at Debug.

Bad: the repository, the service and the controller each log the same exception as Error and rethrow it.

Bad: log any authentication token.

Bad: log each intermediate variable in a tight loop.
