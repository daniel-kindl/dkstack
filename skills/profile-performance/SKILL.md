---
name: profile-performance
description: "Use when asked to investigate latency, startup, CPU, allocations, memory, throughput, battery use, or a performance regression. Measure the baseline, profile bottlenecks, and verify improvements."
---

# Profile performance

Read [performance](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/performance.md).

## Steps

1. Define the metric, user impact, workload, target, and platform.
2. Run a representative baseline with recorded conditions.
3. Identify bottlenecks with profiling or instrumentation.
4. Form a specific performance hypothesis with a measurable prediction.
5. Design one isolated experiment and preserve the original baseline.
6. Implement through [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md) when behavior changes.
7. Compare distributions and resource costs under matching conditions.
8. Check correctness, regressions, and worst-case resource use.
9. Report the data, the confidence and the trade-offs. Report each check that did not run as NOT RUN.

## Boundaries

- No speedup claim without comparable before and after measurements.
- Do not weaken tests, validation, safety, or resource limits.
- Do not require profiling for unrelated low-risk code changes.
- Keep measurements and test input free of secrets and personal data.

## Subagents

Do not start subagents for this skill. Reason: measurements need one controlled baseline, environment, and workload.
See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).
