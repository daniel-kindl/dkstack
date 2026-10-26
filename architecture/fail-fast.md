# Fail fast

A program in a bad state must stop.

Do not continue with invalid data or broken assumptions.

Exit early. Let the failure be visible.

## Rules

- Check preconditions at the start of an operation.
- Stop when a required condition fails.
- Do not return a partial result or a default that hides the problem.
- Do not log an error and continue as if nothing happened.
- Make the failure obvious so the cause can be fixed.

## Good example

An operation that needs valid input. It checks the input first. If the input is invalid, it stops.

```
operation(input)
  if input is invalid
    stop
  process(input)
```

The caller sees the failure immediately. No later step runs on bad data.

## Bad example

An operation that receives invalid input. It logs a warning and continues with a fallback value.

```
operation(input)
  if input is invalid
    log warning
    use default
  process(default)
```

The program continues. The real problem stays hidden. Later results are wrong and hard to trace.

## Another good example

A component that depends on another component. It checks that the dependency is ready. If not, it stops.

```
if dependency is not ready
  stop
use(dependency)
```

## Another bad example

A component that finds a dependency is missing. It catches the failure, returns an empty result, and continues.

```
try
  use(dependency)
catch
  return empty
```

Callers receive empty data and treat it as valid. The missing dependency is never fixed.
