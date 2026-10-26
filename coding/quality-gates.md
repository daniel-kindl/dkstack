# Quality gates

Never weaken a quality gate.

A gate that fails must stay failing until the cause is fixed.

## Rules

- Do not disable, skip, or lower a check to make a change pass.
- Do not suppress a warning or a test failure without fixing the cause.
- Run all checks before you open a pull request.
- If a check cannot run, report it as NOT RUN. Do not claim it passed.
- Fix the root cause. Do not add exceptions.

## Good example

A test fails. You fix the code or the test so the real behavior is correct. The gate stays active.

## Bad example

A test fails. You mark the test as ignored or lower the coverage threshold so the build passes.

Related: [fail-fast.md](../architecture/fail-fast.md).
