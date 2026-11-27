# Observability beyond logs

Metrics and traces complement the event rules in [logging](logging.md). Add telemetry only when it answers a named operational question.

## Metrics

- Measure the user-visible outcomes, error rates, latency distributions and resource saturation that answer the question.
- Choose stable metric names, units, and aggregation.
- Keep label cardinality bounded. Do not label by raw user input, request ID, or secret.
- Define expected cost, sampling, retention, and alert ownership.
- Prefer alerts on sustained symptoms and actionable thresholds.

## Traces

- Keep the correlation context across calls and async work, as [logging](logging.md#event-design) says.
- Create spans only at the boundaries that the question needs, not at every function.
- Record latency and status without capturing sensitive payloads.
- Preserve parent-child relationships. Sample expensive traffic within the cost that you defined.
- Verify trace continuity and failure paths in a controlled environment.

## Evidence

Before adding telemetry, state the question, signal, boundary, expected volume, and safe fields. Confirm that the data can answer the question. An installed collector does not prove that the data is useful.

This page does not require metrics or traces for every change.
