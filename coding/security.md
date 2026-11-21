# Security basics

Protect data and limit damage.

## Rules

- Validate all input at the boundary.
- Do not put a secret in code, commits, logs, errors, issues, pull request text or chat. A secret is a credential, a session ID, a token, a key or a password.
- Where the project has static analysis (SAST) or secret scanning, run them in CI as gates. Follow [quality gates](quality-gates.md).
- Do not put personal data in code, logs or errors. Personal data includes direct identifiers. Examples are a name, an email address, a phone number, a postal address and an IP address. Free text from a user is also personal data.
- Logs have one exception. You can put an opaque internal ID, such as a user ID or an order ID, in a log field. A user ID is still personal data, so log it only when the event needs it.
- Log each failed sign-in and each denied access at Warning. Include the opaque user ID and the outcome. Do not log the credential, the token or other personal data.
- If no account matches, do not log the submitted name. Log `outcome=unknown_account` with no user ID. Return the same response for an unknown account and a wrong credential.
- Do not alert on one event. Alert on a pattern, such as repeated failures for one account or from one source.
- If a secret leaks, tell the owner and rotate it. Deleting the text does not make it safe. Follow [If a secret leaks](#if-a-secret-leaks).
- Use the least privilege that works.
- Do not trust data from outside the system.
- Prefer safe defaults.
- Fail securely. Do not fall back to a more permissive mode on error.

Test these rules as [security testing](../tdd/security-testing.md) describes.

## CI workflows

These rules apply to each CI workflow. The examples use GitHub Actions.
[Dependencies](dependencies.md) owns the SHA pins and the update bot.

- Do not run untrusted code with secrets or a write token. Do not use `pull_request_target` or
  `workflow_run` to check out, build or run code from a pull request.
- Do not put an expression value directly in a script. Pass the value through `env:` and use the
  variable in the script. A value such as `${{ github.event.pull_request.title }}` or
  `${{ inputs.name }}` in `run:` can inject shell code.
- Do not pass all secrets to a job. Do not use `secrets: inherit` or `toJSON(secrets)`. Pass only
  the secret that the job needs.
- Do not keep the token in the checkout. Set `persist-credentials: false` on `actions/checkout`.
- Set the least `permissions:` at the top level. Give a write permission only to the job that
  needs it.
- Set `timeout-minutes` on each job.
- Require approval before a workflow runs for a pull request from a fork. Read the change before
  you approve the run.

### Release and deploy workflows

A release or deploy workflow is safe only when all of these are true:

- The owner starts it with `workflow_dispatch`. No tag push and no merge push starts it.
- It runs in an environment with a required reviewer. No bot identity can act as that reviewer.
- It checks that the ref is `main` and stops on a different ref.
- It sets `concurrency`, so that two runs do not overlap.
- It uses a short-lived token with the least scope, such as a GitHub App token for one
  repository.

## If a secret leaks

Do these steps in this order when a secret leaks. [Rules](#rules) defines a secret. It
leaks when it is in code, a commit, a log, an issue, pull request text or chat. The owner, or a person that the owner names, does steps 2 and 3.
An agent does not change a secret or a setting without the owner's OK. See
[safety](../workflow/safety.md).

1. Tell the owner at once. Say where the secret is. Do not copy the secret into the message.
2. Revoke the secret at the service that issued it, so that it stops working. Do this before you
   remove the text.
3. Rotate the secret: make a new one and put it only in the protected store, such as the CI
   environment. For the dkstack release app key, follow "To change a key" in
   [versioning](../versioning/index.md#one-time-setup).
4. Read the audit log of the service and of the code host from the time of the leak. Look for
   each action that used the secret.
5. Read the secret scanning alerts of the repository. Close an alert only after the secret is
   revoked.
6. Record the event in an issue. Write what leaked, where and when, what was revoked and rotated,
   and what the audit log showed. Do not put the secret in the record.

## Good example

Input is checked before use. Secrets stay in a protected store. An error returns a generic message.

## Bad example

User input is used directly in a query or command. A secret appears in a log line, a commit or a pull request comment. Someone deletes the comment and does not rotate the secret. An error reveals internal details.

Related: [fail-fast.md](../architecture/fail-fast.md), [design-by-contract.md](../architecture/design-by-contract.md).
