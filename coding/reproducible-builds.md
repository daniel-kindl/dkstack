# Reproducible builds

Build only from committed source and declared inputs.

Use this page when you change the build, the toolchain, dependency resolution or packaging. This
page does not add rules for versions and lockfiles. [Dependencies](dependencies.md) owns them.

- Pin versions and commit lockfiles as [dependencies](dependencies.md) says.
- Make generated artifacts reproducible from documented commands.
- Keep secrets out of build output and dependency metadata.
- Do not depend on untracked files or settings on the developer's computer.
- Tell expected platform-specific outputs apart from unexpected drift.
- Validate caches by input identity. A cache hit is not a correctness check.
- Test clean builds when changing toolchains, dependency resolution, or packaging.
- Record the actual runtime, SDK, platform, and build command with failures.

See [dependencies](dependencies.md) and [quality gates](quality-gates.md).
