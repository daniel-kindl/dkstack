# Naming

Use names that describe what code holds or does. Apply this guideline to identifiers you add or
change. Do not rename unrelated code to meet it. Preserve established public contracts unless a
compatible migration is in scope.

## Preferred forms

These forms are defaults. A language or ecosystem convention can take precedence when it makes
code consistent with its callers and tools. Document the exception and its reason in the
project's coding rules. Apply the same choice consistently in that project.

| Identifier | Preferred form | Example |
| --- | --- | --- |
| Genuine constant | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Variable or parameter | `camelCase` | `retryCount`, `userId` |
| Interface | `I` + `PascalCase` | `IUserRepository` |
| Class | `PascalCase` | `UserRepository` |

A genuine constant has a fixed value independent of runtime input, such as a fixed retry limit.
A variable that cannot be reassigned is not always a constant. For example,
`const retryCount = readRetryCount()` holds a value that differs between calls. Name it as a
variable.

Follow the language or ecosystem convention for functions, methods, properties and fields.
For example, use `snake_case` for a Python function and `camelCase` for a JavaScript function
when those conventions apply. A language may also use `snake_case` for local variables or omit
the `I` prefix on interfaces. Record such exceptions in the project rules. Do not force an
unsupported syntax or rename an external API to match this table.

## Meaning

Choose a name for the concept at its own level of detail. Use these examples as review prompts,
not as a word list or length limit.

| Rule | Clearer name | Less clear name | Reason |
| --- | --- | --- | --- |
| Reveal intent | `retryDelayMs` | `data` | The name says what the value measures. |
| Describe the actual value | `activeUsers` | `allUsers` | The collection contains only active users. |
| Use domain terms | `invoiceDueDate` | `documentEndDate` | The code handles invoices. |
| Distinguish meanings | `sourceAccountId`, `targetAccountId` | `accountId1`, `accountId2` | The names identify each role. |
| Make names readable and searchable | `MAX_RETRY_COUNT` | `mrc` | Readers can find the limit by its purpose. |
| Match the abstraction level | `calculateInvoiceTotal` | `sumLineItemCentsAndTax` | The public operation names its result. |
| Name Boolean predicates | `isExpired` | `expiryFlag` | The name states the condition when true. |
| Avoid misleading names | `userIds` | `userList` | The value is a set of IDs, not a list of users. |
| Remove redundant context | `invoice.total` | `invoice.invoiceTotal` | The object already supplies the context. |
| State responsibility | `InvoiceRepository` | `InvoiceManager` | The type stores and retrieves invoices. |

Use `Manager` or `Helper` only when the name still states a clear responsibility in its context.
A short, familiar abbreviation can be clear, such as `url` in code that handles URLs. Avoid an
abbreviation when readers must guess its meaning. Do not add words only to reach a target length.

## Enforcement

Separate form checks from meaning checks.

- Use the project's native formatter, compiler or linter for naming forms that it can check
  reliably. Configure supported rules in the project's tooling and run them in CI as errors.
  Examples include Roslyn naming rules in `.editorconfig`, ESLint naming rules, and Ruff naming
  rules where those tools support the selected convention. An `.editorconfig` file alone does
  not enforce naming in every language.
- Review intent, accuracy, domain terms, distinctions, abstraction level and misleading context.
  A tool cannot reliably decide these from identifier syntax alone. Do not claim that a naming
  rule checks meaning when it checks only form.
- Prefer native analyzers. Do not add a custom rule that duplicates an existing check or gives
  many false positives. If a convention has no reliable analyzer, review it instead.

Follow [quality-gate exceptions](quality-gates.md#exceptions) when a diagnostic cannot be fixed
in the repository. Do not lower or disable a gate to accept a name.
