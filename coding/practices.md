# Practices

## Test-driven development

See [TDD](../tdd/index.md) for the full rules and examples.

Write a failing test first. Write tests that prove behavior.

## Changes

- Prefer small, focused changes.
- Use conventional commits. See [version control](../version-control/index.md).
- Do not add unjustified dependencies.
- Run all checks before you open a pull request.
- Report a check that did not run as NOT RUN.
- Get the acceptance criteria before you start. Stop when the criteria are met and the gates pass. Do not polish past them. If the quality bar is not clear, ask the owner. Reason: work past the criteria adds cost and risk that nobody asked for.

## Do not program by coincidence

- Do not keep code that works when you cannot explain why.
- Do not rely on behavior that is not documented.
- Write down each assumption. Prove it with a test or an assertion.
- Do not make random changes until a test passes.

Reason: code that works by accident stops working when something you did not know about changes.

## Plain text

Keep knowledge in plain text under version control. This includes docs, ADRs, config and test data. Do not keep a decision only in chat or in a binary file. Reason: plain text under version control is easy to read, compare, review and keep.
