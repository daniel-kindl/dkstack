# Skill evaluation cases

Use this matrix as a seed set. Each positive case requires the named skill to
activate and demonstrate its documented workflow. Each negative case requires
that the named skill not activate without a justified additional user request.
Test against **all available skill descriptions**, not an isolated skill.

| Skill | Positive task | Negative task | Evidence |
| --- | --- | --- | --- |
| triage | In a DKSTACK consumer, select rules for a feature touching UI and persistence | What is a REST API? | Selected instructions and explicit scope |
| plan-work | Break this approved feature into reviewable test-first increments | Implement this one-line typo fix now | Plan with acceptance-to-verification mapping |
| tdd-loop | Implement the new parser behavior with regression tests | Explain why TDD is useful | Recorded red, green, refactor evidence |
| code-review | Review this pull request against its issue and engineering rules | Summarize the new release notes | Two review axes and grounded findings |
| bootstrap | Initialize the commit, version, branch, and CI conventions in this empty repo | Review one diff in an already configured repo | Setup checks and detected existing configuration |
| ui-design | Build an accessible mobile settings screen and verify the rendering | Explain the CSS cascade | Rendered evidence with accessibility states |
| ui-review | Evaluate this screenshot and live UI against accessibility criteria | Suggest UI ideas without an existing screen | Independent visual review evidence |
| setup-dkstack | Install DKSTACK into a project without AGENTS.md | Explain what DKSTACK is | Pointer files, consent, preserved text |
| learn | Quiz me on async C# and adapt to my answers | What does await do? | Interactive question and evidence-based feedback |
| release | Explicitly prepare a new release, do not publish | We should publish a release automatically | Owner confirmation and no publishing action |

## Execution

1. Record the repository commit and which clients are available.
2. Run the positive and negative tasks at least three times with competing
   skills discoverable.
3. Capture skill selection before reading its body, then the executed steps.
4. Repeat behavioral tasks without DKSTACK, holding the environment constant.
5. Score activation precision and recall, task correctness, evidence
   completeness, tool failures, execution time, and tokens when supported.
6. Confirm that user-only skills are not automatically invoked where the
   client supports that policy.
7. For inaccessible clients or unavailable tool executions, record NOT RUN.
8. Investigate every unexpected activation before editing descriptions.
9. Keep a separate held-out set of natural-language prompts for regression.

A check on syntax or metadata alone cannot pass a behavioral evaluation.
