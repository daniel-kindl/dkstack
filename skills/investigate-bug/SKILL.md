---
name: investigate-bug
description: "Use when a defect, crash, regression, flaky test, or unexpected behavior needs systematic investigation before a fix. Establish evidence, test hypotheses, and hand off a verified regression to TDD."
---

# Investigate a bug

Follow [debugging](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/debugging.md). For an outage, also read [incident analysis](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/incident-analysis.md).

## Steps

1. Record expected behavior, actual behavior, impact, and the known environment.
2. Collect safe reproduction steps, input samples, logs, versions, and errors.
3. Reproduce in the smallest controlled environment that preserves the failure.
4. If reproduction fails, identify missing evidence and test plausible alternatives.
5. Write at least two competing hypotheses when the cause is uncertain.
6. For each hypothesis, name a result that would falsify it.
7. Test one variable at a time. Use code history or bisect where useful.
8. Locate the cause at a source line or boundary, supported by evidence.
9. Use [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md) for the actual fix.
10. Re-run the reproduction, regression test, and affected existing checks.
11. Report the cause, proof, changed behavior, and remaining uncertainty.

## When reproduction is unavailable

- Do not claim a confirmed root cause or a verified fix.
- Preserve diagnostic evidence and explain which checks were NOT RUN.
- Prefer non-destructive instrumentation or an isolated experiment.
- Ask for missing access or input only when it changes the next safe action.

## Subagents

A read-only subagent can investigate an independent hypothesis. Give each a full brief, input evidence, and an explicit no-write limit. The lead verifies findings before code changes.

## Boundaries

- Do not weaken tests or quality gates.
- Do not apply speculative patches until a hypothesis has supporting evidence.
- Remain within the issue and the [safety](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md) limits.
