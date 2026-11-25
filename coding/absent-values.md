# Absent values

A value that can be absent must say so in its type. A value that is in the type cannot be absent.

An absent value is `null`, `undefined`, `None`, `nil` or an empty optional. Apply this page to
code that you add or change.

## Rules

- Make values present by default. Turn on the null check of the language and run it in CI as an
  error. Examples are `strictNullChecks` in TypeScript, which `"strict": true` turns on, and
  `<Nullable>enable</Nullable>` in C#. See [types.md](types.md). Reason: the checker then finds
  each place that reads a value that can be absent.
- Show in the type when a value can be absent, for example `User | undefined`, `User?`,
  `Optional[User]` or `Option<User>`. Reason: the caller sees that it must handle the absent case.
- Do not use a special value for "no value", for example `-1`, `0` or `""`. Use the absent value
  of the type. Reason: a caller can use a special value as a real value. See
  [error-handling.md](error-handling.md).
- Check an input at the boundary, where it enters the code. Convert it once to a type that
  cannot be absent. Do not check the same value again deeper in the code. Reason: one check at
  the boundary is easy to test. Many checks inside the code hide which values are possible.
- Do not use an absent value to report a failure. Return or throw an error with the reason. See
  [error-handling.md](error-handling.md). Reason: a caller cannot tell "not found" from "the
  database is down".
- Return an empty collection for "no items", not an absent value. Reason: the caller can loop
  over an empty collection with no check.
- Do not use a non-null assertion, for example `user!.name`, to silence the checker. Use it only
  when a check before it proves that the value is present. See [types.md](types.md).

## Good example

`findUser(id: UserId): Promise<User | undefined>` returns `undefined` when no user has the ID. It
throws an error when the database fails. The handler checks for `undefined` once and returns
"404 Not Found". The rest of the handler uses a `User`.

## Bad example

`findUser(id)` returns `null` when no user has the ID, and also when the database fails. The
handler passes the result on. A function three calls deeper reads `user.email` and fails with a
`TypeError`. The log does not show that the database was down.

Related: [fail fast](../architecture/fail-fast.md),
[design by contract](../architecture/design-by-contract.md).
