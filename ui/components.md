# Components

- Reuse the project's components and design tokens before you make new ones.
- Give each control an accessible name. A control looks like a control. Decoration does not look like a control.
- Give each component the states that it needs: default, hover, focus, pressed, selected, disabled, loading, empty, error and success. Do not add a state that the component does not use.
- Use the same behavior for the same action in the whole product.
- Keep behavior apart from visual presentation when the architecture allows it. Add an abstraction only when it makes the code easier to maintain.
- Test component behavior with [TDD](../tdd/index.md) and the project's UI tests.

## Icons

- Use one icon set with one size grid and one stroke width.
- An icon-only button has an accessible name. On pointer devices, it also has a tooltip.
- A decorative icon has `aria-hidden="true"`.
- Put a text label next to an icon for an action that is not common.
- Do not use emoji as UI icons.
