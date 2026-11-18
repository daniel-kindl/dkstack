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

[UI accessibility](../ui/accessibility.md) owns the requirements and the thresholds. This section says how to test them.

- For labels and state in presentation logic, follow [presentation logic](#presentation-logic).
- In the UI tests, find controls by role and accessible name. Check that a screen reader announces each error.
- Run the automated accessibility checker of the platform in the UI tests. Examples are axe-core on the web and the Accessibility Test Framework on Android.
- An automated checker does not find all problems. Then do the manual checks: a keyboard walk-through, a screen reader pass, the largest text size and a contrast measurement.
- Record each check that you did manually.

## Rendered video and animation

- Assert the data and the timing that make the output. Examples are the scene order, the start times and the durations.
- Do not compare frames. Exception: keep a small set of reviewed still images for important frames.

## Example

Good: test the sign-in view model. A submit with an empty password shows an error next to the password field and moves focus to it. One headless UI test finds the button by its role and its name. It checks that the screen reader announces the error.

Bad: find the third button in the layout and tap it. Assert the pixel color of the error text. Update the golden image each time that the test fails.

Related: [test levels](test-levels.md), [test design](test-design.md), [deterministic tests](deterministic-tests.md).
