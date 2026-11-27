---
name: assess-threats
description: "Use when a change touches authentication, authorization, secrets, untrusted input, privileged tooling, external integrations, or another security boundary. Identify threats and evidence-based mitigations."
---

# Assess threats

Read [threat modeling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/threat-modeling.md) and [security](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md).

## Steps

1. Identify the assets, actors, entry points, and trust boundaries in scope.
2. Enumerate realistic misuse cases and their potential impact.
3. Locate the implementation that guards each important boundary.
4. Rate likelihood and impact using evidence from the actual project.
5. Propose the smallest effective mitigation and negative test.
6. Run permitted tests. Verify each claim using source or executable evidence.
7. Report unresolved threats, mitigations, and any NOT RUN checks.

## Boundaries

- Do not test production endpoints or attempt unauthorized exploitation.
- Do not expose secrets or personal data in the assessment.
- An agent never approves its own risk acceptance or a privileged operation.
- Keep the analysis proportional to the changed attack surface.

## Subagents

Do not start subagents for this skill. Reason: one lead must correlate threats, evidence, and mitigations at the same boundary.
See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).
