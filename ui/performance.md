# UI performance

- Keep interactions responsive. Do not do expensive work on the UI thread or the main rendering path.
- Prevent layout shifts, repeated rendering and expensive effects on slow devices.
- Give feedback while a task runs. Keep the user's input.
- Measure a suspected regression with the project's profiling tools. For the evidence rules, see [performance testing](../tdd/performance-testing.md#regression-criteria).
- Use native platform features before you add a dependency.

## Web defaults

Use these targets only when the project has none. See [design systems](design-systems.md).

- Measure each target at the 75th percentile.
- LCP is 2.5 s or less.
- INP is 200 ms or less.
- CLS is 0.1 or less.
- Set the width and height of each image.
- Use `font-display: swap`.
