import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Each page that had no test of its own (#314). A page keeps its title, its
// section headings and one key phrase where it has no section heading.
const PAGES = [
  ["architecture/actors-and-blackboards.md", ["# Actors and blackboards","## Rules","## Trade-offs","## Good example","## Bad example"]],
  ["architecture/concurrency.md", ["# Concurrency","## Rules","## Good example","## Bad example"]],
  ["architecture/configuration.md", ["# Configuration","## Rules","## Good example","## Bad example"]],
  ["architecture/decoupling.md", ["# Decoupling","## Rules","## Good example","## Bad example"]],
  ["architecture/design-by-contract.md", ["# Design by contract","## Rules","## Good example","## Bad example","## Another good example","## Another bad example"]],
  ["architecture/design.md", ["# Design","## Principles","## Boundaries","Select the smallest design that works."]],
  ["architecture/fail-fast.md", ["# Fail fast","## Rules","## Good example","## Bad example","## Another good example","## Another bad example"]],
  ["architecture/kiss.md", ["# KISS","## Rules","## Good example","## Bad example"]],
  ["architecture/orthogonality.md", ["# Orthogonality","## Rules","## Good example","## Bad example","## Another good example","## Another bad example"]],
  ["architecture/prototype.md", ["# Prototype to learn","## Rules","## Good example","## Bad example"]],
  ["architecture/resource-balancing.md", ["# Resource balancing","## Rules","## Good example","## Bad example","## Another good example","## Another bad example"]],
  ["architecture/separation-of-concerns.md", ["# Separation of concerns","## Rules","## Good example","## Bad example"]],
  ["architecture/solid.md", ["# SOLID","## Single Responsibility","## Open-Closed","## Liskov Substitution","## Interface Segregation","## Dependency Inversion"]],
  ["architecture/state-machines.md", ["# State machines","## Rules","## Good example","## Bad example","## Other event patterns"]],
  ["architecture/temporal-coupling.md", ["# Temporal coupling","## Rules","## Good example","## Bad example"]],
  ["architecture/tracer-bullets.md", ["# Tracer bullets","## Rules","## Good example","## Bad example","## Another good example","## Another bad example"]],
  ["architecture/yagni.md", ["# YAGNI","## Rules","## Good example","## Bad example"]],
  ["coding/brace-style.md", ["# Brace style","## Language and formatter exceptions","## Configuration and enforcement","Allman"]],
  ["coding/debugging.md", ["# Debugging","## Rules","## Good example","## Bad example"]],
  ["coding/error-handling.md", ["# Error handling","## Rules","## Good example","## Bad example"]],
  ["coding/testing.md", ["# Testing","Add testing rules to tdd/, not to this file."]],
  ["tdd/coverage.md", ["# Coverage and mutation testing","## Code coverage","## Mutation testing","## Example","## Reporting"]],
  ["tdd/data-migration-testing.md", ["# Data and migration testing","## Stored formats","## Backups","## Database migrations","## Example"]],
  ["tdd/deterministic-tests.md", ["# Deterministic tests","## Common sources","## Asynchronous behavior","## Flaky tests","## Example"]],
  ["tdd/legacy-code.md", ["# TDD with legacy code","## Before changing behavior","## Difficult dependencies","## Limited testability","## Example"]],
  ["tdd/performance-testing.md", ["# Performance testing","## Choosing the workload","## Regression criteria","## Correctness first","## Example"]],
  ["tdd/property-testing.md", ["# Property, parameterized and fuzz testing","## Parameterized tests","## Property-based tests","## Fuzz testing","## Example"]],
  ["tdd/regression-testing.md", ["# Regression testing","## Bug-fix cycle","## Scope and risk","## Example","## Incidents and regressions"]],
  ["tdd/test-design.md", ["# Test design","## Arrange, act, assert","## Choosing cases","## Naming and assertions","## Logging contracts","## What not to test","## Example","## Verify test strength"]],
  ["tdd/test-isolation.md", ["# Test isolation","## Test boundaries","## Test doubles","## Logger dependencies","## Fixtures","## Example","## Warning signs"]],
  ["tdd/test-levels.md", ["# Test levels","## Unit tests","## Integration tests","## Contract tests","## End-to-end tests","## Choosing a test"]],
  ["tdd/test-suite-health.md", ["# Test suite health","## Location","## Speed","## Order and parallel runs","## Maintenance","## CI","## Example"]],
  ["learning/assessment.md", ["# Assessment","## Levels","## Evidence","## Assess mode","## Good example","## Bad example"]],
  ["learning/principles.md", ["# Learning principles","## Goal","## Rules","## Good example","## Bad example"]],
  ["learning/progress.md", ["# Progress","## Progress block","## Show progress","## Export","## Resume","## Good example","## Bad example"]],
  ["learning/retention.md", ["# Retention and review","## Rules","## Good example","## Bad example"]],
  ["learning/scenarios.md", ["# Learning behavior scenarios","manual behavior checks"]],
  ["learning/teaching.md", ["# Adaptive teaching","## Choose the mode","## Support","## Hybrid curriculum","## Response policy","## Learner controls","## End a session","## Good example","## Bad example"]],
  ["ui/scenarios.md", ["# UI scenarios","manual behavior checks"]],
  ["ui/visual-design.md", ["# Visual design","## Generic patterns","Make a clear hierarchy"]],
  ["writing/comments.md", ["# Code comments","## Rules","## Good example","## Bad example","## Another good example","## Another bad example"]],
];

for (const [path, parts] of PAGES) {
  test(`${path} keeps its title and its key parts`, async () => {
    const page = await readFile(join(root, path), "utf8");
    const lines = page.split("\n");
    for (const part of parts) {
      const found = part.startsWith("#") ? lines.includes(part) : page.includes(part);
      assert.ok(found, `${path} is missing: ${part}`);
    }
  });
}
