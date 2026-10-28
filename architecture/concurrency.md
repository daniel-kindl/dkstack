# Concurrency

Shared state is incorrect state.

When two actions can read and change the same data at the same time, the result depends on timing.
Timing changes from run to run. Guard every shared resource.

## Rules

- Give each shared resource one owner. Other code asks the owner to make a change.
- If a resource has no single owner, change it with one atomic operation.
- If you use a lock, hold it as a [resource-balancing](resource-balancing.md) pair. Acquire and
  release the lock in the same scope.
- Treat a random failure or a flaky test as a possible race. Look for the race before you retry.
- Remove [temporal coupling](temporal-coupling.md). Operations without a hidden order can run
  at the same time.

## Good example

One owner keeps the counter. Other code sends a request to the owner.

```
counter_owner.increment()
```

The owner applies one change at a time. The value is always correct.

## Bad example

Two workers read and write the same counter without a guard.

```
value = counter
counter = value + 1
```

Both workers read the same value. One increment is lost. The failure occurs only sometimes.

Related: [temporal-coupling.md](temporal-coupling.md),
[resource-balancing.md](resource-balancing.md),
[actors-and-blackboards.md](actors-and-blackboards.md).
