# UI performance

- Keep interactions responsive. Avoid expensive work on the UI thread or main rendering path.
- Prevent unnecessary layout shifts, repeated rendering, and high-cost effects on resource-constrained devices.
- Use progressive feedback when tasks take time and preserve input where possible.
- Measure suspected performance regressions with the project's available profiling tools. Do not claim a performance improvement without evidence.
- Prefer native and existing platform capabilities over unnecessary dependencies.
