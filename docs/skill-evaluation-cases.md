# Skill evaluation cases

Use this matrix as a seed set. Each positive case requires the named skill to
activate and demonstrate its documented workflow. Each negative case requires
that the named skill not activate without a justified additional user request.
Test against **all available skill descriptions**, not an isolated skill.

| Skill | Positive task | Negative task | Evidence |
| --- | --- | --- | --- |
| triage | In a dkstack consumer, select rules for a feature touching UI and persistence | What is a REST API? | Selected instructions and explicit scope |
| plan-work | Break this approved feature into reviewable test-first increments | Implement this one-line typo fix now | Plan with acceptance-to-verification mapping |
| tdd-loop | Implement the new parser behavior with regression tests | Explain why TDD is useful | Recorded red, green, refactor evidence |
| code-review | Review this pull request against its issue and engineering rules | Summarize the new release notes | Two review axes and grounded findings |
| bootstrap | Initialize the commit, version, branch, and CI conventions in this empty repo | Review one diff in an already configured repo | Setup checks and detected existing configuration |
| ui-design | Build an accessible mobile settings screen and verify the rendering | Explain the CSS cascade | Rendered evidence with accessibility states |
| ui-review | Evaluate this screenshot and live UI against accessibility criteria | Suggest UI ideas without an existing screen | Findings per surface with state, size and theme, through code-review severities and a verdict |
| setup-dkstack | Install dkstack into a project without AGENTS.md | Explain what dkstack is | Pointer files, consent, preserved text |
| learn | Quiz me on async C# and adapt to my answers | What does await do? | Interactive question and evidence-based feedback |
| release | Explicitly prepare a new release, do not publish | We should publish a release automatically | Owner confirmation and no publishing action |

## Execution

1. Record the repository commit and which clients are available.
2. Run the positive and negative tasks at least three times with competing
   skills discoverable.
3. Capture skill selection before reading its body, then the executed steps.
4. Repeat behavioral tasks without dkstack, holding the environment constant.
5. Score activation precision and recall, task correctness, evidence
   completeness, tool failures, execution time, and tokens when supported.
6. Confirm that user-only skills are not automatically invoked where the
   client supports that policy.
7. Report a client or a tool that cannot run as the [quality gates](../coding/quality-gates.md) page says.
8. Investigate every unexpected activation before editing descriptions.
9. Keep a separate held-out set of natural-language prompts for regression.

A check on syntax or metadata alone cannot pass a behavioral evaluation.

## Executable cases

The machine-readable suite is in [skill-cases.json](../evals/skill-cases.json).
It has one suite for each skill in `skills/`.
Each suite has at least two positive and two negative cases.
Each suite has cases in the training split and in the validation split.
The last example in each group is held out for validation.
Each positive case has at least 3 assertions: activation and two behaviors.
An assertion must not copy `expected_output`.

Run `npm run check:skill-evals` for suite format checks.
It fails when a skill has no suite.
Run the adapter-based evaluation from [interoperability](agent-skills-compatibility.md#skill-evaluation).
The adapter must record actual client activity, not simulated activation.
A real baseline runs the same task without dkstack.
Model, client, execution environment, and prompt must otherwise remain constant.

A sample adapter is deliberately not included.
An adapter needs access to a real agent runtime and its events.
Never treat synthetic fixture tests as agent quality measurements.
