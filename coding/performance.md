# Performance engineering

Measure the user-visible or system-level outcome before optimizing.

## Rules

- Define a metric, workload, target, environment, and failure threshold.
- Capture a reproducible baseline before the change.
- Profile or trace to identify the actual bottleneck.
- Optimize the bottleneck, not the most visually complex code.
- Change one factor per experiment. Keep correctness tests green.
- Compare before and after runs with the same workload and environment.
- Report measurement spread, sample count, warm-up, and noise sources.
- Check peak memory, allocation rate, startup time, throughput, and latency when relevant.
- Test under realistic load, not only a microbenchmark.
- Recheck correctness, adverse inputs, and any newly affected resource.
- If a useful baseline cannot be measured, report NOT RUN and do not claim a speedup.

## Budgets

Choose budgets from actual product requirements. Record latency percentiles when outliers matter. Do not prescribe universal timing limits to all consumers. Avoid regression thresholds below the measurement noise.

## Trade-offs

Compare CPU, memory, I/O, allocation, energy, code complexity, and maintenance cost. Do not exchange data integrity or security for speed without an approved requirement.

See [performance tests](../tdd/performance-testing.md) and [resource balancing](../architecture/resource-balancing.md).
