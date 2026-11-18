# Responsive design

- Identify the supported devices, orientations, display scales and input methods. Do not use web breakpoints in native apps.
- Check the widths in the [minimum evidence](visual-verification.md#minimum-evidence). Do not test each combination of device and state.
- Keep critical tasks available with no horizontal clipping and no hidden controls.
- Do not require hover for essential information or actions. Keep the reading and focus order when the layout changes.
- Test touch targets when touch is supported, the keyboard when it is supported, and the pointer when it is supported. The target sizes are in [accessibility](accessibility.md#targets).

## Web defaults

Use these only when the project has no responsive rules. See [design systems](design-systems.md).

- Design mobile first. Set breakpoints where the content breaks, not at device widths.
- Use container queries (baseline since 2023) for components that appear at more than one width.
- On mobile, use `dvh` and `env(safe-area-inset-*)`.
- Show hover-only controls only inside `@media (hover: hover) and (pointer: fine)`.
