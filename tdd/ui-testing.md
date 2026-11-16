# UI and accessibility testing

Test most user interface (UI) behavior below the UI. Use a few UI tests for the flows that matter most.

## Presentation logic

- Put presentation logic, such as view models and screen state, in code that runs without a UI.
- Test state changes, validation messages and enabled or disabled actions with [unit tests](test-levels.md#unit-tests).

## UI tests

- Keep a few headless UI tests for critical flows. A headless test runs the UI with no visible screen.
- Find elements by accessible name or role. Do not find elements by position, index or style. Reason: a layout change that keeps the behavior must not break a test.
- Add a visual snapshot or golden test only when the visual output is a requirement. State that reason beside the test.
- To update a snapshot or golden file, follow [test design](test-design.md#naming-and-assertions).

## Accessibility checks

Test these where the platform supports them:

- Each control has a text label that a screen reader reads.
- A screen reader announces changes of state and errors.
- Focus moves through the controls in a logical order.
- Each touch target is at least 48 dp on Android or 44 pt on iOS.
- Color is not the only cue. Each color cue also has a text, a shape or an icon.
- The layout stays usable with large text.

An automated accessibility check does not find all problems. Record each check that you did manually.

## Rendered video and animation

- Assert the data and the timing that make the output. Examples are the scene order, the start times and the durations.
- Do not compare frames. Exception: keep a small set of reviewed still images for important frames.

## Example

Good: test the sign-in view model. An empty password disables the submit action and shows an error. One headless UI test finds the button by its role and its name. It checks that the screen reader announces the error.

Bad: find the third button in the layout and tap it. Assert the pixel color of the error text. Update the golden image each time that the test fails.

Related: [test levels](test-levels.md), [test design](test-design.md), [deterministic tests](deterministic-tests.md).
