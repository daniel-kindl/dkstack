# Immutability

Make a value unchangeable by default. Change a value only when the change is the purpose of the
code.

Apply this page to code that you add or change.

## Rules

- Declare a variable so that it cannot be reassigned, for example with `const`, `readonly`,
  `final` or `val`. Use a variable that can be reassigned only when its value must change.
  Reason: the reader knows that the value stays the same after the declaration.
- Do not change an argument that the caller gives you. Return a new value. Reason: the caller
  does not expect that its value changes.
- Make a value object and a data transfer type immutable. Use readonly fields, a C# `record`
  with `init` properties, a Java `record` or a Python `@dataclass(frozen=True)`. A C# `record`
  with `set` properties is not immutable. Reason: an immutable value
  is safe to share, to cache and to use as a key.
- A declaration that cannot be reassigned does not make the value immutable. In JavaScript,
  `const user = { name: "A" }` still lets code change `user.name`. Use `Readonly<T>`,
  `readonly` arrays or `Object.freeze` when the content must not change. These are shallow. A
  nested object or array can still change, so apply the same type or call to each level.
- Do not share changeable state between threads or actors without an owner. See
  [architecture/concurrency.md](../architecture/concurrency.md).
- A copy can be too slow, for example in a hot loop over a large array. Change the value in place
  only when a measurement shows the cost. Keep the change inside one function or one type. Do not
  let the changeable value leave it. See [performance testing](../tdd/performance-testing.md).

## Enforcement

Prefer native checks and run them in CI as errors. Examples are ESLint `prefer-const` and
`no-param-reassign` with `props: true`, typescript-eslint `prefer-readonly`, and the
`readonly` modifier and `init` accessors in C#. Review the rules that no tool checks reliably,
for example a change to an argument through a method call.

## Good example

`applyDiscount(order: DeepReadonly<Order>, percent: number): Order` returns a new order with new
line totals. `DeepReadonly` is a type that makes each nested field readonly. It comes from a
library or from the project. It stops a change to `order.lines[0].total`. The caller keeps the old
order for the audit log.

## Bad example

`applyDiscount(order, percent)` changes `order.lines` in place and returns nothing. The audit log
keeps a reference to the same order. It now shows the discounted totals as the original totals.

Related: [design by contract](../architecture/design-by-contract.md),
[orthogonality](../architecture/orthogonality.md).
