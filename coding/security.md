# Security basics

Protect data and limit damage.

## Rules

- Validate all input at the boundary.
- Do not put a secret in code, commits, logs, errors, issues, PR text or chat. A secret is a credential, a token, a key or a password.
- Do not put personal data in logs or errors.
- If a secret leaks, tell the owner and rotate it. Deleting the text does not make it safe.
- Use the least privilege that works.
- Do not trust data from outside the system.
- Prefer safe defaults.
- Fail securely. Do not fall back to a more permissive mode on error.

## Good example

Input is checked before use. Secrets stay in a protected store. An error returns a generic message.

## Bad example

User input is used directly in a query or command. A secret appears in a log line, a commit or a PR comment. Someone deletes the comment and does not rotate the secret. An error reveals internal details.

Related: [fail-fast.md](../architecture/fail-fast.md), [design-by-contract.md](../architecture/design-by-contract.md).
