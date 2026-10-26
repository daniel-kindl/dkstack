# Security basics

Protect data and limit damage.

## Rules

- Validate all input at the boundary.
- Never expose credentials, tokens, or personal data in logs, errors, or code.
- Use the least privilege that works.
- Do not trust data from outside the system.
- Prefer safe defaults.
- Fail securely. Do not fall back to a more permissive mode on error.

## Good example

Input is checked before use. Secrets stay in a protected store. An error returns a generic message.

## Bad example

User input is used directly in a query or command. A secret appears in a log line. An error reveals internal details.

Related: [fail-fast.md](../architecture/fail-fast.md), [design-by-contract.md](../architecture/design-by-contract.md).
