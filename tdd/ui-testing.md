# UI and accessibility testing

Test most user interface (UI) behavior below the UI. Use a few UI tests for the flows that matter most.

## Presentation logic

- Put presentation logic, such as view models and screen state, in code that runs without a UI.
- Test state changes, validation messages and enabled or disabled actions with [unit tests](test-levels.md#unit-tests).

## UI tests

- Keep a few headless UI tests for critical flows. A headless test runs the UI with no visible screen.
- Wait for an element state. Follow [asynchronous behavior](deterministic-tests.md#asynchronous-behavior).
- Find elements by accessible name or role. Do not find elements by position, index or style. Reason: a layout change that keeps the behavior must not break a test.
- Add a visual snapshot or golden test only when the visual output is a requirement. State that reason beside the test.
- Make and compare visual snapshots in one fixed environment, such as a pinned CI image. Reason: fonts, operating systems and graphics hardware change the pixels.
- To update a snapshot or golden file, follow [test design](test-design.md#naming-and-assertions).

## Accessibility checks

Use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA as the baseline. Test these where the platform supports them:

- Each control has a text label that a screen reader reads.
- A screen reader announces changes of state and errors.
- A keyboard can reach and use each control. The focus is visible.
- Focus moves through the controls in a logical order.
- Text contrast is at least 4.5:1. Large text contrast is at least 3:1.
- The parts that identify a control and its state have a contrast of at least 3:1.
- Each touch target is at least 24 by 24 CSS pixels on the web (WCAG 2.5.8).
- Each touch target is at least 48 dp on Android or 44 pt on iOS.
- Color is not the only cue. Each color cue also has a text, a shape or an icon.
- The layout stays usable with large text.

Run the automated accessibility checker of the platform in the UI tests. Examples are axe-core on the web and the Accessibility Test Framework on Android. Then do the manual checks. An automated checker does not find all problems. Record each check that you did manually.

## Rendered video and animation

- Assert the data and the timing that make the output. Examples are the scene order, the start times and the durations.
- Do not compare frames. Exception: keep a small set of reviewed still images for important frames.

## Example

Good: test the sign-in view model. An empty password disables the submit action and shows an error. One headless UI test finds the button by its role and its name. It checks that the screen reader announces the error.

Bad: find the third button in the layout and tap it. Assert the pixel color of the error text. Update the golden image each time that the test fails.

Related: [test levels](test-levels.md), [test design](test-design.md), [deterministic tests](deterministic-tests.md).
