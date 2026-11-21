# Components

- Reuse the project's components and design tokens before you make new ones.
- Give each control an accessible name (4.1.2). A control looks like a control. Decoration does not look like a control (dkstack rule).
- Give each component the states that it needs: default, hover, focus, pressed, selected, disabled, loading, empty, error and success. Do not add a state that the component does not use. This page owns the list of states.
- Use the same behavior for the same action in the whole product.
- Keep behavior apart from visual presentation when the architecture allows it. Add an abstraction only when it makes the code easier to maintain.
- Test component behavior with [TDD](../tdd/index.md) and the project's UI tests.

## Icons

- Use one icon set with one size grid and one stroke width.
- An icon-only button has an accessible name (4.1.2). On pointer devices, it also has a tooltip (dkstack rule).
- A decorative icon has `aria-hidden="true"` (1.1.1).
- Put a text label next to an icon for an action that is not common (dkstack rule).
- Do not use emoji as UI icons.
