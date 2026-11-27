# Debugging

Find the cause of a problem before you change the code.

## Rules

- Reproduce the problem first. Reason: if you cannot reproduce it, you cannot show that a fix works.
- Fix the cause, not the symptom. Reason: a fix for the symptom leaves the cause, and the problem comes back in another form.
- Suspect your own code before the library, the OS or the compiler. Reason: your own code changes most and is tested least, so the cause is usually there.

## Investigation method

- Separate observed facts, assumptions, and hypotheses.
- Record the smallest reproduction and its environment.
- When the cause is uncertain, test competing explanations.
- Give each hypothesis a falsifiable prediction.
- Change one variable at a time. Prefer instrumentation over guesswork.
- Check history, dependencies, and boundaries only when evidence points there.
- A fix is verified when the regression fails before and passes after the change.
- Re-run the original reproduction and nearby tests.
- If reproduction is unavailable, state the limitation and the evidence collected.

For a repeatable procedure use [investigate-bug](../skills/investigate-bug/SKILL.md).
For outages use [incident analysis](incident-analysis.md).

## Good example

A test fails on some input. You write a test that reproduces the failure. You find a wrong boundary check in your own code. You fix the check and the test passes.

## Bad example

A value is sometimes empty. You add a default value where the program shows it. The code that makes the empty value stays wrong.

Related: [testing.md](testing.md), [tdd/index.md](../tdd/index.md).
