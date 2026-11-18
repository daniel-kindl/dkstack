# Layout and spacing

- Group related information and controls with alignment, proximity and the same spacing.
- Use the project's spacing tokens.
- Do not use fixed sizes that clip content, cause overflow or hide controls at the supported text sizes and scales.
- Let content set its size. Do not assume the pixel size of one device.
- Keep a logical reading order and enough space between controls.
- Check dense, sparse and error states, not only the ideal content.

## Defaults

Use these only when the project has no spacing tokens. See [design systems](design-systems.md).

- Use a 4 px base: 4, 8, 12, 16, 24, 32, 48 and 64.
- Use more space between groups than inside a group.
- Limit the reading width to 65ch for text and to about 1200 px for app content.
- Use logical properties, such as `margin-inline` and `padding-block`, so that right-to-left text works.
