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

Give one result for the change. Give each finding a severity from the [code-review table](../skills/code-review/SKILL.md#severity).

- PASS: each check in the minimum set ran or is NOT APPLICABLE. No check found a Blocking, High or Medium finding on a changed surface.
- FAIL: a check found one or more Blocking, High or Medium findings on a changed surface.
- NOT RUN: a required check did not run. Give the reason and the surfaces and states that you did not check. NOT RUN is never PASS.
- NOT APPLICABLE: a check does not apply to the change, for example reduced motion for a change with no motion. Give the reason.

If you can build and run the UI, do the visual verification. If you cannot, write NOT RUN and the reason. Do not invent screenshots.

Automation can check deterministic defects. Aesthetic judgments require rationale, not unexplained CI pass/fail scores.

Also follow [UI testing](../tdd/ui-testing.md) for tests and [code review](../skills/code-review/SKILL.md) for findings.
