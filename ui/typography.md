# Typography

- Use the project's type scale and typefaces.
- Keep text readable at the supported font sizes and display scales. Do not use fixed text containers that clip large text (1.4.4). The text size rules are in [accessibility](accessibility.md#text-and-layout).
- Do not use type size alone to show essential meaning. Show hierarchy with semantics and grouping (1.3.1).
- Check long labels, wrapping, dynamic text and translated content.

## Defaults

Use these only when the project has no type scale. See [design systems](design-systems.md).

- Use a modular scale with a ratio of 1.2 to 1.25 and 4 to 6 steps.
- Body text is at least 16 px (1 rem) on the web.
- Body line height is 1.4 to 1.6. Heading line height is 1.1 to 1.3.
- Line length is 45 to 75 characters (`max-width: 65ch`). This page owns the reading width.
- Use at most 2 font families. A system font stack is a good default.
- Use weight 400 for body text and 600 for emphasis.
- Use `font-variant-numeric: tabular-nums` in tables.
- Set font sizes in rem, not px.
- For fluid type, use `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`. Always include a rem term.
- A clamp with only vw does not grow with zoom. It fails (1.4.4).
