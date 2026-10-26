# Design by contract

Define the obligations of the caller and the component.

The caller must meet the preconditions. The component must meet the postconditions when the preconditions hold.

Invariants must remain true.

## Rules

- State preconditions clearly. Check them at the start.
- State postconditions clearly. Guarantee them when preconditions are met.
- State invariants that must always hold.
- Stop if a precondition fails. Do not continue.
- Do not weaken a postcondition or invariant to make a call succeed.
- Document the contract so callers know their obligations.

## Good example

An operation that divides two numbers.

```
divide(a, b) -> result
  precondition: b is not zero
  postcondition: result * b equals a
```

The caller must not pass zero. The operation guarantees the mathematical result when the precondition holds. If the precondition fails, the operation stops.

## Bad example

An operation that divides two numbers and returns a special value when the divisor is zero.

```
divide(a, b) -> result
  if b is zero
    return special_value
  return a / b
```

The contract is unclear. Callers must know about the special value. The failure is hidden.

## Another good example

A component that stores a value.

```
store(value)
  precondition: value is within allowed range
  postcondition: stored value equals the input value
  invariant: stored value is always within allowed range
```

## Another bad example

A component that accepts any value and silently clamps or ignores values outside the range.

The caller cannot know whether the stored value matches what was sent. The invariant is not guaranteed.
