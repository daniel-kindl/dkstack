# Visual verification

Do visual verification for each change to a rendered UI. Tests, compilation and source inspection do not prove the rendered result. Screenshots do not replace behavior tests. Follow [UI testing](../tdd/ui-testing.md) for the tests.

## Protocol

1. Identify the changed screens and components. Select the widths, themes, states and input methods from the minimum set.
2. Build and run the UI with a headless renderer or the running application. Capture screenshots of each changed surface.
3. Check layout, text, hierarchy, contrast, clipping, focus and each changed state. For content loading, check the [loading rules](interactions.md#loading).
4. Compare the result with the specification, the design system and the baselines. To update a snapshot, follow [test design](../tdd/test-design.md#naming-and-assertions).
5. Fix the defects in scope. Check the changed surface again after each fix.
6. Report the result, the evidence and the checks that did not run.

Do not require screenshot commits or a specific browser, emulator, UI framework or service.

## Minimum evidence

Each changed surface needs this evidence. Mark an item NOT RUN or NOT APPLICABLE with a reason.

- Screenshots at 320 CSS px wide and at one wide width. On native UI, use the narrowest supported window or screen.
- Screenshots in each supported theme.
- Screenshots of each changed state, for example empty, loading, error, disabled and focus.
- A keyboard walk-through: focus order, visible focus, focus not hidden and no keyboard trap.
- Text at 200% and the text spacing values. On native UI, use the largest system text size.
- Reduced motion, when the change has motion.
- The automated checker output: the tool, its version, the number of violations and its limits.
- The measured contrast ratio of each new or changed color pair.

The thresholds are in [accessibility](accessibility.md). One screenshot is never PASS.

## Examples

These tools are examples. Another tool is allowed when it gives the same evidence.

- Web: Playwright screenshots and `@axe-core/playwright` with the WCAG 2.2 tags.
- Avalonia: Avalonia.Headless with Skia frame capture.
- Android and iOS: an emulator or simulator screenshot.
- Native: the accessibility inspector of the platform, for example Accessibility Inspector, Accessibility Scanner or Accessibility Insights.

### Web default

- Tool: Playwright with Chromium, headless. Capture full-page screenshots of each changed surface.
- Viewports: 320x640 (reflow), 390x844, 768x1024 and 1440x900.
- Themes: light and dark with `colorScheme`. Reduced motion with `reducedMotion: "reduce"`.
- Text resize: inject `html { font-size: 200% }` at 1280 px wide. This works only for rem-based sizes. Record that limit.
- Text spacing: inject the 1.4.12 values.
- Keyboard: press Tab through the surface. Record each `document.activeElement` and take a screenshot of each focus.
- Automated scan: `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21aa` and `wcag22aa`.
- axe finds only part of the WCAG issues. In a 2021 Deque study of first-time audits, axe-core found about 57% of the issues by volume.
- By WCAG criteria it covered only 16 of the 50 WCAG 2.1 AA criteria. See [Deque](https://www.deque.com/automated-accessibility-coverage-report/).
- axe cannot check contrast on gradients, images or pseudo-elements. Check those by eye or with a color picker.
- States: default, hover, focus, loading, empty, error and long content.

On the web, a PASS also needs all of these:

- No serious or critical axe violation on the changed surface.
- No horizontal scroll at 320 px, except the 1.4.10 exceptions.
- Each tab stop is reachable, in a logical order and visibly focused. No tab stop is hidden.
- No clipped or overlapping text at 200% and with text spacing.
- Each changed state has a screenshot in each theme.

Report a table with each check, its result and the path to its evidence.

## Results

Each check is PASS, FAIL, NOT RUN or NOT APPLICABLE. The change result is PASS, FAIL or NOT RUN. Give each finding a severity from the [code-review table](../skills/code-review/SKILL.md#severity).

Change result:

- PASS: each check in the minimum set ran or is NOT APPLICABLE. No check found a Blocking, High or Medium finding on a changed surface.
- FAIL: a check found one or more Blocking, High or Medium findings on a changed surface.
- NOT RUN: a required check did not run. Give the reason and the surfaces and states that you did not check. NOT RUN is never PASS.

Per check:

- NOT APPLICABLE: a check does not apply to the change, for example reduced motion for a change with no motion. Give the reason.

When the check results combine, FAIL wins over NOT RUN.

If you can build and run the UI, do the visual verification. If you cannot, write NOT RUN and the reason. Do not invent screenshots.

Write the result in the PR body as [write-pr](../skills/write-pr/SKILL.md#evidence) says.

Automation can check defects that have a fixed rule. Give a reason for each aesthetic finding. Do not use a numeric score for taste.
