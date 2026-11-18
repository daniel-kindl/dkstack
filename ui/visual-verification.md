# Visual verification

For every change affecting a rendered interface, attempt to inspect real rendered output when the available environment can build and display it. Source inspection, compilation, and passing unit tests alone do not prove visual quality.

## Protocol

1. Identify changed screens and meaningful components. Select representative supported viewport sizes, display scales, themes, input methods, content lengths, and states.
2. Build or launch the product with available supported tools. Capture screenshots or inspect the rendered surface.
3. Check layout, text, visual hierarchy, contrast, clipping, focus, loading and error states, and relevant interactions. When content loading is in scope, confirm that skeletons match the expected content structure, do not shift layout unexpectedly, and yield to the real content or an error state.
4. Compare against the approved specification, existing design system, and available baselines. Do not update a snapshot only to hide a failure.
5. Fix in-scope defects; inspect the changed surface again after meaningful fixes.
6. Report the actual evidence and any missing checks.

Use a risk-based matrix, not a full cross-product of every device and state. Do not mandate screenshot commits or a specific browser, emulator, UI framework, or service.

## Results

- PASS: run, applicable coverage documented, no blocking defect found.
- FAIL: run, with a reproducible blocking defect.
- NOT RUN: unavailable or not executed; explain why and the unverified scope. Never call it a pass.
- NOT APPLICABLE: no affected rendered surface or no relevant scenario; explain when unclear.

Mandatory means perform verification when feasible and report limitations honestly. When tools are unavailable, report NOT RUN, provide the best alternative checks, and do not invent screenshots.

## Severity

- P0: demonstrated critical accessibility, functional, or responsive failure.
- P1: significant consistency, clarity, or performance issue requiring remediation or review decision.
- P2: optional polish unless explicitly specified.

Automation can check deterministic defects. Aesthetic judgments require rationale, not unexplained CI pass/fail scores.

Also follow [UI testing](../tdd/ui-testing.md) for tests and [code review](../skills/code-review/SKILL.md) for findings.
