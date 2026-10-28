# Debugging

Find the cause of a problem before you change the code.

## Rules

- Reproduce the problem first. Reason: if you cannot reproduce it, you cannot show that a fix works.
- Fix the cause, not the symptom. Reason: a fix for the symptom leaves the cause, and the problem comes back in another form.
- Suspect your own code before the library, the OS or the compiler. Reason: your own code changes most and is tested least, so the cause is usually there.

## Good example

A test fails on some input. You write a test that reproduces the failure. You find a wrong boundary check in your own code. You fix the check and the test passes.

## Bad example

A value is sometimes empty. You add a default value where the program shows it. The code that makes the empty value stays wrong.

Related: [testing.md](testing.md), [tdd/index.md](../tdd/index.md).
