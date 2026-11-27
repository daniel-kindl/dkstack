# Debugging

Find the cause of a problem before you change the code.

## Rules

- Reproduce the problem first. Reason: if you cannot reproduce it, you cannot show that a fix works.
- Fix the cause, not the symptom. Reason: a fix for the symptom leaves the cause, and the problem comes back in another form.
- Suspect your own code before the library, the OS or the compiler. Reason: your own code changes most and is tested least, so the cause is usually there.

## Investigation method

- Keep observed facts, assumptions and hypotheses apart. Reason: a hypothesis that you treat as a
  fact stops the search.
- Record the smallest reproduction and its environment. Reason: another person can then run it again.
- When the cause is not certain, test two or more explanations. Reason: with one explanation, you
  look only for evidence that supports it.
- Give each hypothesis a falsifiable prediction. Reason: a prediction that cannot fail proves
  nothing.
- Change one variable at a time. Reason: two changes at once hide which one had the effect.
- Use logs, a debugger or a profiler to get data. Do not guess.
- Check history, dependencies and boundaries only when the evidence points there.
- Verify the fix with the [bug-fix cycle](../tdd/regression-testing.md#bug-fix-cycle). Then run the
  original reproduction and the nearby tests again.
- If you cannot reproduce the problem, follow
  [boundaries and evidence](../tdd/index.md#boundaries-and-evidence).

For a repeatable procedure use [investigate-bug](../skills/investigate-bug/SKILL.md).
For outages use [incident analysis](incident-analysis.md).

## Good example

A test fails on some input. You write a test that reproduces the failure. You find a wrong boundary check in your own code. You fix the check and the test passes.

## Bad example

A value is sometimes empty. You add a default value where the program shows it. The code that makes the empty value stays wrong.

Related: [testing.md](testing.md), [tdd/index.md](../tdd/index.md),
[regression testing](../tdd/regression-testing.md).
