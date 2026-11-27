# Agent Skills interoperability

DKSTACK uses the [Agent Skills specification](https://agentskills.io/specification)
for discovery and skill instructions. DKSTACK's own engineering requirements are
additional policy, not requirements of the Agent Skills format.

## Layers

1. **Specification:** validate every distributed skill with the reference
   `skills-ref validate skills/<name>` tool. The format specification is the
   authority when it disagrees with DKSTACK's local parser.
2. **DKSTACK policy:** `npm run check:skills` checks directory naming and
   invocation rules. The local validator handles commonly used YAML scalars and
   metadata mappings, but is not a full YAML implementation.
3. **Runtime behavior:** agents must actually discover the intended skill,
   read instructions, perform the task, and report real verification evidence.

## Client compatibility

The core specification does not standardize the meaning of
`disable-model-invocation` or `user-invocable`. DKSTACK uses these for
Claude Code and records Codex-specific policy under `agents/openai.yaml`.
Other clients may ignore them. Never treat these fields as a security boundary.

Skill descriptions must independently identify the relevant task. `triage`
helps select several workflows for complex tasks, but should not be required
for direct discovery of `tdd-loop`, `code-review`, or other focused skills.

## Distribution modes

- Remote references in DKSTACK skills require network access at execution
  time unless the referenced guidance is already cached.
- Consumers can pin to a release tag for version reproducibility.
- A fully offline bundle requires the selected skills and their transitive
  rule dependencies to be copied into an immutable local distribution and
  rewritten to local references. **This is not yet implemented.** Never call
  an ordinary `npx skills` installation fully offline without testing it.

## Evaluation protocol

Use the cases in [skill-evaluation-cases.md](skill-evaluation-cases.md).

For each case, record the agent/client/model version, DKSTACK ref, environment,
exact prompt, available competing skills, activated skills, and output evidence.

Run at least three repetitions per positive and negative case. A passing
result requires correct discovery and observable behavior, not a model's
claim that it followed the skill. Include a no-skill baseline for behavioral
comparison. Keep development examples separate from held-out regression cases.

Never mark an unexecuted case as passed. Report NOT RUN with the blocker.

## Change acceptance

- Local format checks and unit tests pass.
- The upstream reference validator passes for every published skill.
- Existing user-only governance remains enforced on supported clients.
- Trigger evaluations show no material regression against the last baseline.
- External references, network requirements, and unsupported clients are documented.

## References

- https://agentskills.io/skill-creation/quickstart
- https://agentskills.io/specification
- https://agentskills.io/skill-creation/best-practices
- https://agentskills.io/skill-creation/optimizing-descriptions
- https://agentskills.io/skill-creation/evaluating-skills
- https://agentskills.io/client-implementation/adding-skills-support
