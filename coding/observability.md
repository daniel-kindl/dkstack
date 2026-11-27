# Observability beyond logs

Metrics and traces complement the event rules in [logging](logging.md). Add telemetry only when it answers a named operational question.

## Metrics

- Measure user-visible outcomes, error rates, latency distributions, and resource saturation when useful.
- Choose stable metric names, units, and aggregation.
- Avoid unbounded label cardinality. Do not label by raw user input, request ID, or secret.
- Define expected cost, sampling, retention, and alert ownership.
- Prefer alerts on sustained symptoms and actionable thresholds.

## Traces

- Carry a safe correlation context across calls and async work.
- Create spans at meaningful boundaries, not at every function.
- Record latency and status without capturing sensitive payloads.
- Preserve parent-child relationships and sample expensive traffic responsibly.
- Verify trace continuity and failure paths in a controlled environment.

## Evidence

Before adding telemetry, state the question, signal, boundary, expected volume, and safe fields. Confirm that the data can answer the question. A collector being installed is not proof of useful observability.

This page does not require metrics or traces for every change.
