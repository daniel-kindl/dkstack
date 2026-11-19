# Motion

- Use motion only to show a change of state, a relation or feedback. Motion must not hide an action or delay it.
- Follow the reduced motion setting of the platform. Give a static alternative to essential motion. This is a dkstack rule. WCAG 2.3.3 is level AAA and is not part of the AA baseline.
- Do not use continuous decorative animation, long entrance sequences or layout movement that has no purpose.
- A transition does not block interaction, accessibility or automated tests.
- Meet the pause and flash rules in [accessibility](accessibility.md#content-and-changes).

## Defaults

Use the project's motion tokens. Use these only when the project has none. See [design systems](design-systems.md).

- Use 100 to 200 ms for small state changes and 200 to 300 ms for panels and dialogs. Do not use more than 500 ms.
- Use ease-out to enter and ease-in to exit.
- Animate only `transform` and `opacity`.
- Under `prefers-reduced-motion: reduce`, remove movement and parallax. Keep opacity fades.
