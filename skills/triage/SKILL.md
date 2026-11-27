---
name: triage
description: "Use when you start any task in a repository that uses dkstack. Selects the guidelines and skills that apply to the task."
user-invocable: false
---

# Triage

Use this skill first when you work in a consumer: a repository whose `AGENTS.md` points to dkstack.

Decide which sections and skills apply to the current task. Read only those.

## Steps

1. Identify the type of work: design, implementation, UI, documentation, version control, review, workflow, learning, or mixed.
2. Select the relevant sections and skills from the lists below.
3. Read the section index or skill, then the detailed files it links to.
4. Apply the rules. Prefer the smallest set that covers the task.
5. If the task spans multiple areas, read each relevant item.

## Subagents

If you can start subagents, use them for step 3 when the task spans more than one area. Do steps 1 and 2 yourself. Then read the selected sections and skills at the same time, each in its own subagent. Give each subagent a brief that is complete without your context:

- The task, and the type of work from step 1.
- One section or skill from step 2 to read, with its link.
- What to report: the rules that apply to the task, each with its link, and a word limit, for example 300 words.
- This line: "Report to me only. Do not change files, commit, push, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Each reader: tier small, effort medium.

Then do steps 4 and 5 yourself. A report from a subagent is a claim. Check each rule that you apply at its source.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## Skills

- Repository that does not point to dkstack, or a request to set up dkstack: [setup-dkstack](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-dkstack/SKILL.md)
- New or non-compliant repository: [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md)
- Start of a task, or a request to open or track an issue: [start-issue](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/start-issue/SKILL.md)
- Non-trivial change: [clarify-intent](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md)
- Design or structure: [apply-architecture](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/apply-architecture/SKILL.md)
- Plan a feature: [plan-work](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/plan-work/SKILL.md)
- Large, unclear effort that needs more than one session: [chart-route](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/chart-route/SKILL.md). It hands off to `plan-work`.
- Implementation: [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md)
- Pull request body: [write-pr](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-pr/SKILL.md).
  Use it when you write or materially update the body. Do not use it for a review that leaves
  the body unchanged.
- Diagram or visual for a pull request, an issue, a spec, an ADR or a docs page: [make-diagram](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/make-diagram/SKILL.md)
- New or changed rendered UI: [ui-design](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/ui-design/SKILL.md).
- Review of a rendered UI: [ui-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/ui-review/SKILL.md). Use it with `code-review` for a pull request.
- Review: [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md)
- Performance question, resource regression, or optimization: [profile-performance](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/profile-performance/SKILL.md)
- Timeouts, retries or overload: [reliability](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/reliability.md)
- Network protocol code: [networking](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/networking.md)
- Shared mutable state or parallel work: [concurrency practices](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/concurrency-practices.md)
- Metrics or traces: [observability](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/observability.md)
- Bug or unexpected behavior: [coding/debugging.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/debugging.md)
- Domain term to define, resolve or check: [domain-glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/domain-glossary/SKILL.md)
- Domain design, modeling or specification: [model-domain](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/model-domain/SKILL.md)
- Durable decision: [write-adr](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-adr/SKILL.md)
- Any text: [writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md)
- Learn, practice, assess or review a topic: [learn](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/learn/SKILL.md)
- Retrospective of a session, a pull request or an issue, to improve the agents' environment: [improve-agents](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/improve-agents/SKILL.md). It is user-invoked: only the owner starts it.
- Version number or release: [release](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/release/SKILL.md). It is user-invoked: only the owner starts it. If the task needs it, tell the owner.

## Scale

The ladder is a guide, not a gate. Use the smallest set of skills. A small task uses one or two skills. It does not go through every step.

Each task in the ladder starts with [start-issue](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/start-issue/SKILL.md): one issue, one branch, one pull request.

- Bug fix: [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md), then [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md).
- Feature: start with [clarify-intent](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md)
  and [apply-architecture](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/apply-architecture/SKILL.md).
  Then use
  [plan-work](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/plan-work/SKILL.md),
  [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md),
  then [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md).
  Use [writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md)
  when the change has text that people or agents read. Use
  [release](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/release/SKILL.md)
  only when the task is a release.
- Release: [release](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/release/SKILL.md), after the change is reviewed.

One agent can do all the steps. Many agents can share the steps. A skill does not make one role into one agent.

## Section map

- Design or structure changes: [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md)
- Rendered UI work: [ui/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/index.md). Backend-only changes do not use the UI pages or the UI skills.
- Code changes: [coding/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/index.md) and [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md)
- Commits or branches: [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)
- Version numbers or releases: [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md)
- Any text, including documentation, comments and messages: [writing/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md). For copy that the users of a product read, also [user-facing copy](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/user-facing-copy.md).
- A shell, git or check problem, or a short how-to: [tips/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tips/index.md). A tip is not a rule.
- Learning work: [learning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/learning/index.md)
- A change to `.github/workflows`, tokens, secrets or repository settings: [CI workflows](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md#ci-workflows) and [safety](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md)
- Issues, pull requests, review, merge or release: [workflow/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/index.md)
- A step that a subagent can do, or the model and effort for a subagent: [subagents](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md)

## Stewardship

Routine work does not read
[stewardship](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/stewardship.md).
Read it when a person asks for the analysis, or when the task has one of the
[signals](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/stewardship.md#analysis)
in its Analysis section.

Do not add a phase, a checklist or a report for ordinary work. The page holds the rules.

## Rules

- If the repository has `CONTEXT.md`, read it before the task starts. Use its terms. See [domain-glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/domain-glossary/SKILL.md).
- Do not read every file. Read only what the task needs.
- Verify an instruction in chat under
  [owner instructions in chat](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md#owner-instructions-in-chat).
- If two rules conflict, follow [Precedence](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md#precedence) in AGENTS.md.
- To decide between two designs that both work, use the easier to change rule in [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md).
- If no section clearly applies, read [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md) and [coding/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/index.md).
- After you finish, dkstack remains the source of truth.
