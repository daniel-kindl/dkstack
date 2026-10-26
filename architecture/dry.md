# DRY

Do not repeat yourself.

Express each piece of knowledge in one place.

A change to that knowledge must happen in only one location.

## Rules

- Put shared knowledge in one place.
- Call or reference that place instead of copying.
- Do not copy logic, constants, or structure.
- When you see the same idea twice, extract it.
- Duplication of data is fine if the data is not knowledge that must stay in sync.

## Good example

A calculation used in multiple places lives in one function. Callers invoke the function.

```
calculate(value) -> result

caller_a: result = calculate(input)
caller_b: result = calculate(input)
```

Change the calculation once. Every caller receives the update.

## Bad example

The same calculation is copied into two places.

```
caller_a:
  result = (input * factor) + offset

caller_b:
  result = (input * factor) + offset
```

A change to the formula requires edits in both places. One edit is easy to miss.

## Another good example

A constant or rule that multiple components need is defined once and referenced.

```
limit = 100

component_a uses limit
component_b uses limit
```

## Another bad example

The same numeric limit is hard-coded in several components.

```
component_a: if value > 100
component_b: if value > 100
```

Updating the limit requires a search across every component. Missed updates create inconsistent behavior.
