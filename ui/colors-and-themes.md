# Colors and themes

- Meet the contrast and color rules in [accessibility](accessibility.md#contrast-and-color).
- Use the project's semantic color tokens for text, surfaces, borders, focus and status.
- Use semantic tokens, not repeated raw colors. Keep the contrast in overlays and layered surfaces.
- Test each theme that the project supports. Include the focus, selected, disabled, error and hover states.
- Add a theme only when the specification asks for it. When the product has more than one theme, follow the system setting by default.

## Defaults

Use these only when the project has no color tokens. See [design systems](design-systems.md).

- Use 3 token layers. They are primitive (`blue-600`), semantic and, when necessary, component.
- Semantic tokens include `color-text`, `color-surface`, `color-border`, `color-focus` and `color-danger`. Components use semantic tokens only.
- Use one accent color and a neutral ramp. Use status colors only for status.
- Dark mode is not an inversion. Use a dark gray surface, for example #121212 to #1c1c1e, not pure black.
- In dark mode, show elevation with lighter surfaces, not shadows. Reduce the saturation of the accent.
- Check the contrast of each token pair in each theme.
- When the product supports dark mode, follow `prefers-color-scheme` by default. Give a user override and set `color-scheme`.
