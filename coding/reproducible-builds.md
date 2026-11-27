# Reproducible builds

A build should be explainable from committed source and declared inputs.

- Pin toolchain and dependency versions using project conventions.
- Commit lockfiles when the ecosystem supports them.
- Make generated artifacts reproducible from documented commands.
- Keep secrets out of build output and dependency metadata.
- Avoid depending on the developer's untracked environment.
- Distinguish expected platform-specific outputs from unexpected drift.
- Validate caches by input identity. A cache hit is not a correctness check.
- Test clean builds when changing toolchains, dependency resolution, or packaging.
- Record the actual runtime, SDK, platform, and build command with failures.

See [dependencies](dependencies.md) and [quality gates](quality-gates.md).
