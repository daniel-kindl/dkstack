# Security testing

Test that the code refuses what it must refuse. The security rules are in [security basics](../coding/security.md). This page tells you how to test them.

## Negative cases

- Use the [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) to select the negative cases for each trust boundary.
- At each trust boundary, test that the code refuses invalid, malformed and too large input. A trust boundary is a place where data from outside the system enters.
- Test that the code refuses a request with missing, expired or wrong credentials.
- Test that the code refuses an action when the user does not have the permission.
- For each refusal, assert the error and assert that no data changed.

## Secrets

- Test that a secret does not appear in logs or error messages. Put an invented marker value in the secret field. Search the output for that value.
- For secrets in fixtures, follow [incidents and regressions](regression-testing.md#incidents-and-regressions).

## Gates and parsers

- The dependency audit is a gate. Follow the [supply chain rules](../coding/dependencies.md#supply-chain-rules) and [quality gates](../coding/quality-gates.md).
- Where the project has static analysis (SAST) or secret scanning, run them in CI as gates. Follow [quality gates](../coding/quality-gates.md).
- Fuzz each parser that reads untrusted input. Follow [fuzz testing](property-testing.md#fuzz-testing).

## Security fixes

- Add a regression test for each security fix. Follow the [bug-fix cycle](regression-testing.md#bug-fix-cycle).
- Do not publish exploit details. Name the test for the rule that it checks, not for the attack.
- Keep the attack steps out of public issues, commits and pull request text. Report a vulnerability as the [security policy](../SECURITY.md) says.

## Example

Good: an endpoint returns a report to its owner. A test calls it as a different user and expects a permission error. The test also checks that the log has no session token.

Bad: test only the success path as an administrator. Copy a real API key into a fixture. Put the attack steps in the test name and in the pull request.

Related: [security basics](../coding/security.md), [regression testing](regression-testing.md), [property testing](property-testing.md).
