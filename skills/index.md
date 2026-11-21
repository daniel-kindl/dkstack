# Skills

Skills are specific capabilities agents should apply when relevant.

## Invocation

Each skill has one invocation class. The class is in the frontmatter, so that each client applies it.

- user: only a person starts the skill, for example with `/release`. The frontmatter has `disable-model-invocation: true`. The file `agents/openai.yaml` has `allow_implicit_invocation: false`. `npm run check:skills` makes sure that the two agree.
- agent: only an agent loads the skill, when its description matches the task or another skill links it. The frontmatter has `user-invocable: false`. Most agent skills are building blocks of a larger skill.
- both: a person or an agent can start the skill. The frontmatter has neither key.

A description can end with `Triggers:` and the words that a person uses to ask for the skill, for example `Triggers: teach me, quiz me`.

## Building blocks

A building block does one job. A larger skill, such as `code-review` or `bootstrap`, runs its blocks in order. Use a block alone when the task needs only that job. A block links the rule pages and does not copy them.

## Current skills

- [triage](triage/SKILL.md) (agent): Decide which guidelines and skills apply to the current task. Read this first.
- [bootstrap](bootstrap/SKILL.md) (both): Set up conventional commits, branches, semver, strict editorconfig, warnings-as-errors, and deterministic checks.
  - [setup-editorconfig](setup-editorconfig/SKILL.md) (agent): Strict editor settings and LF line endings.
  - [setup-quality-gates](setup-quality-gates/SKILL.md) (agent): Warnings as errors, CI and deterministic checks.
  - [setup-versioning](setup-versioning/SKILL.md) (agent): Commit and branch rules, semantic versioning and a changelog.
  - [setup-supply-chain](setup-supply-chain/SKILL.md) (agent): Apply the supply chain rules.
- [clarify-intent](clarify-intent/SKILL.md) (both): Clarify requirements and domain language before coding.
- [apply-architecture](apply-architecture/SKILL.md) (both): Check design changes against architecture principles.
- [tdd-loop](tdd-loop/SKILL.md) (both): Enforce the red-green-refactor cycle.
- [code-review](code-review/SKILL.md) (both): Review a change on two axes (standards and specification) and give one verdict.
  - [review-spec](review-spec/SKILL.md) (agent): Check that the change does what the issue asked for.
  - [review-standards](review-standards/SKILL.md) (agent): Check the change against the documented rules and the code smells.
  - [review-blast-radius](review-blast-radius/SKILL.md) (agent): Find what the change can break outside the diff.
  - [verify-claim](verify-claim/SKILL.md) (agent): Prove a claim on five evidence levels before you report it.
- [write-adr](write-adr/SKILL.md) (both): Create an Architecture Decision Record.
- [write-pr](write-pr/SKILL.md) (both): Write or update a pull request body with evidence and merge risk.
- [writing-check](writing-check/SKILL.md) (both): Apply ASD-STE100 to text.
- [plan-work](plan-work/SKILL.md) (both): Plan a goal as small, reviewable increments with tests first.
- [release](release/SKILL.md) (user): Prepare a release. Link the versioning and safety rules. Do not publish.
- [learn](learn/SKILL.md) (both): Teach, practice, assess and review any topic with an adaptive curriculum.
- [ui-design](ui-design/SKILL.md) (both): Make or change a rendered UI and check the rendered result.
- [ui-review](ui-review/SKILL.md) (both): Review a rendered UI and report through code-review.
