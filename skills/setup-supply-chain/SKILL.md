---
name: setup-supply-chain
description: "Use when a repository adds or updates dependencies or CI actions without pins, a lockfile, an audit or update proposals. One block of bootstrap. Applies the supply chain rules."
user-invocable: false
---

# Set up the supply chain rules

A building block of [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md). Use it alone, or as a step of bootstrap. Do not weaken an existing quality gate. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).

## Steps

1. Apply the [supply chain rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules).
   - Do not keep credentials in the checked-out code when a later step does not need them.
