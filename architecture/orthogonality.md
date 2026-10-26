# Orthogonality

Keep components independent.

Give each component a single responsibility and clear boundaries.

A change in one component must not require changes in unrelated components.

Avoid hidden coupling.

## Rules

- Define clear interfaces between components.
- Do not share mutable state across boundaries.
- Prefer composition over inheritance when it reduces coupling.
- Make dependencies explicit.
- Pass data in, return results out. Do not reach into other components.

## Good example

A component that processes input and returns output. It does not know how the input was obtained or what happens to the output.

```
process(data) -> result
```

Callers supply the data. Callers decide what to do with the result. The component stays independent.

## Bad example

A component that both processes data and stores the result in a shared location that other components also modify.

```
process_and_store(data)
  // reaches into shared storage
  // other components also read and write the same storage
```

A change to storage format or access rules forces changes in every component that touches it. Coupling is hidden.

## Another good example

Two components communicate only through a defined message or value. Neither knows the internal details of the other.

```
component_a produces message
component_b consumes message
```

You can replace either component without changing the other, as long as the message shape stays the same.

## Another bad example

Component A calls internal methods of Component B and Component B reads private fields of Component A.

A change inside either component breaks the other. The boundary does not exist.
