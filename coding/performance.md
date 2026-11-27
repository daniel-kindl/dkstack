# Performance engineering

Use this page when a change has a speed or resource goal, or when someone reports a performance
regression. This page does not require profiling for a change without a performance goal.

Measure the outcome that the user or the system sees before you optimize.

## Rules

- Measure as [performance testing](../tdd/performance-testing.md) says. It owns the workload, the
  baseline, the samples and the regression criteria.
- Profile or trace to find the actual bottleneck.
- Optimize the bottleneck, not the code that looks most complex.
- Change one factor in each experiment.
- Check peak memory, allocation rate, startup time, throughput and latency when the requirement
  names them.
- Test under realistic load, not only with a microbenchmark.
- Check each resource that the change affects, and the adverse inputs.
- If you cannot measure a useful baseline, do not claim a speedup. Report the check as
  [quality gates](quality-gates.md#rules) says.

## Budgets

Set budgets and regression thresholds as
[regression criteria](../tdd/performance-testing.md#regression-criteria) says. Do not set one
timing limit for all consumers.

## Trade-offs

Compare CPU, memory, I/O, allocation, energy, code complexity and maintenance cost. For
correctness, follow [correctness first](../tdd/performance-testing.md#correctness-first). Do not
trade data integrity or security for speed without an approved requirement.

See [performance tests](../tdd/performance-testing.md) and [resource balancing](../architecture/resource-balancing.md).
