# Types

Let the type checker check the code. Do not turn the check off. Write the types.

Apply this page to code that you add or change. Do not change the types of unrelated code to meet
it. Preserve established public contracts unless a compatible migration is in scope.

## No escape from the type system

- Do not use a type that turns off the type check. Examples are `any` and `as any` in
  TypeScript, `dynamic` in C# and `Any` in Python. In Go, an example is `interface{}` or `any`
  that holds a value of any type. Reason: the checker stops checking each value that passes through the type,
  and the error moves to run time.
- Do not use a comment that turns off the type check, for example `@ts-ignore`, `@ts-nocheck` or
  `# type: ignore`. The only exception is a suppression that has all the parts in
  [Suppressions](quality-gates.md#suppressions).
- When you do not know the type of a value, use the safe top type of the language. It is
  `unknown` in TypeScript and `object` in C# and Python. Check the value at the boundary, where it enters the
  code, and convert it to a known type. Then use only the known type. See
  [fail fast](../architecture/fail-fast.md).
- Do not use a cast to make the checker accept a value, for example `value as User` or
  `(User)value`. Use a cast only when a check before it proves the type. Do not use a
  non-null assertion, for example `user!.name`, unless a check before it proves that the value is
  present. Reason: a cast is a claim that the checker does not check.
- In Go, use a generic type parameter or a specific interface for a value inside the code. Do
  not use `any`. Use a type switch at the boundary.

## Explicit types

- Write the type of each public signature: each parameter, each return value, each exported
  member and each field. Reason: the signature is the contract that callers read. An inferred
  return type changes when the body changes, and the change can break a caller.
- Write the type of each local variable. Do not use `var` in C# or Java, or `auto` in C++, for a
  type that you can write. Reason: the reader sees the type without help from the editor.
- Some types have no name that you can write. Examples are a C# anonymous type, the type of a
  C++ lambda and the type of a Rust closure. Use the inference of the language for these types
  only.
- A language or ecosystem convention can prefer inference for local variables, for example Rust,
  Go, Kotlin and Swift. Record the exception and its reason in the project's coding rules, as
  [Precedence](../AGENTS.md#precedence) says. The public signature rule still applies.
- In JavaScript, use `const`, or `let` when the value changes. Do not use `var`. Reason: `var`
  has function scope and is hoisted, so a name can be read before its value is set.
- Write JavaScript as TypeScript, or add JSDoc types and check them with `tsc` and `checkJs`.
  If a project cannot run a type check, record the exception and its reason.

## Enforcement

Turn on the strict settings of the type checker. Run the type check in CI as an error. An editor
setting alone is not a CI gate. Prefer native checks. Review the rules that no tool checks
reliably, for example a cast that no check proves.

| Language | Settings |
| --- | --- |
| TypeScript | `"strict": true` in `tsconfig.json`. typescript-eslint rules `@typescript-eslint/no-explicit-any`, `@typescript-eslint/ban-ts-comment`, the `no-unsafe-*` rules and `@typescript-eslint/explicit-module-boundary-types` |
| JavaScript | ESLint `no-var` and `prefer-const`. For types, `checkJs` with `"strict": true` |
| C# | `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. For explicit local types, set `csharp_style_var_for_built_in_types`, `csharp_style_var_when_type_is_apparent` and `csharp_style_var_elsewhere` to `false:warning` in `.editorconfig` (rule IDE0008), with `<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>` |
| Python | mypy with `strict = true` and `disallow_any_explicit = true`, or pyright in strict mode. Ruff `ANN` rules, which include `ANN401` for `Any` |

See [typescript-eslint rules](https://typescript-eslint.io/rules/),
[C# `var` preferences](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/style-rules/ide0007-ide0008),
[mypy configuration](https://mypy.readthedocs.io/en/stable/config_file.html) and
[Ruff rules](https://docs.astral.sh/ruff/rules/).

Do not lower a strict setting to make a change pass. See [quality gates](quality-gates.md).

## Good example

A handler gets a JSON body. The parser returns `unknown`. A validation function checks the fields
and returns a `CreateUserRequest`, or a clear error. The rest of the code uses
`CreateUserRequest` only. The function `createUser(request: CreateUserRequest): Promise<User>`
states its types.

## Bad example

A handler gets a JSON body as `any`. The code reads `body.user.email`. A client sends a body with
no `user` field. The checker accepts the code, and the handler fails at run time with a
`TypeError`.

Related: [design by contract](../architecture/design-by-contract.md),
[naming](naming.md), [brace style](brace-style.md).
