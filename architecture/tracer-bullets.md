# Tracer bullets

Build a thin end-to-end slice first.

The slice must pass through every major layer or boundary.

Use the working slice to learn and adjust before you expand.

## Rules

- Implement the smallest path that touches all important parts.
- Make the path work from input to output.
- Prefer a rough but complete path over a polished but incomplete layer.
- Measure and observe the path. Change direction if needed.
- Expand only after the path proves the approach.

## Good example

A system that receives input, processes it, and produces output. The first version implements the full path with minimal logic in each step.

```
receive(input)
  -> process(input)
  -> produce(result)
```

The path works. You can see if the boundaries and data flow are correct. Later steps add detail.

## Bad example

Build the input layer completely. Then build the processing layer completely. Then build the output layer.

```
complete input layer
then complete process layer
then complete output layer
```

Problems in the connection between layers appear only at the end. Changes are expensive.

## Another good example

A feature that must store data and later retrieve it. The first version stores one simple value and retrieves it.

```
store(simple_value)
retrieve() -> simple_value
```

The storage and retrieval path is proven. Complexity is added only after the path works.

## Another bad example

Design the full storage schema and all retrieval queries before any data is stored or read.

The design is complete on paper. The first real use reveals mismatches that require redesign.
