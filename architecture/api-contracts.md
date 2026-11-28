# API and protocol contracts

An interface is a promise to consumers outside the changed implementation.

This page is for the contracts of a consumer project. It does not set the versioning policy of
dkstack. For that policy, see [versioning](../versioning/index.md).

For how code reads and writes the bytes, see [networking](../coding/networking.md).

## Design

- Identify known and external consumers, supported versions, and compatibility requirements.
- Define request, response, error, and cancellation behavior.
- Bound data size and validate untrusted fields at the boundary.
- Define encoding, absent values, ordering, and retry semantics.
- Prefer additive evolution when consumers cannot update together.
- State the compatibility impact of schema, enum, error, or wire-format changes.
- Do not rely on undocumented behavior.
- Document deprecation and migration paths before removing a public contract.

## Verification

- Use consumer-driven or provider contract tests when possible.
- Test old and new readers against representative old and new messages.
- Check unknown fields, missing fields, invalid versions, and mixed deployments.
- Record any external consumers that could not be verified.
- A build inside one repository does not prove external compatibility.

See [design by contract](design-by-contract.md) and [versioning](../versioning/index.md).
