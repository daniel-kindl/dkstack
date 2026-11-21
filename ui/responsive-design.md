# Responsive design

- Identify the supported devices, orientations, display scales and input methods.
- Do not copy web breakpoint values into native apps. Use the platform's adaptive layout tools and window size classes.
- Check the widths in the [minimum evidence](visual-verification.md#minimum-evidence). Do not test each combination of device and state.
- Keep critical tasks available with no horizontal clipping and no hidden controls.
- Do not require hover for essential information or actions. Keep the reading and focus order when the layout changes.
- Test each supported input method: touch, keyboard and pointer. The target sizes are in [accessibility](accessibility.md#targets).

## Web defaults

Use these only when the project has no responsive rules. See [design systems](design-systems.md).

- Design mobile first. Set breakpoints where the content breaks, not at device widths.
- Use size container queries (`container-type: inline-size`) for components that appear at more than one width. They are Baseline Widely available since August 2025.
- On mobile, use `dvh` and `env(safe-area-inset-*)`.
- Show hover-only controls only inside `@media (hover: hover) and (pointer: fine)`.
