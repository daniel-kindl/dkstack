# Subagents

When to start a subagent, what to give it, and which model tier and effort to use.

A subagent is an agent that another agent starts for one part of a task. The agent that starts it
is the lead. The lead owns the task, the result and each action on the repository.

A subagent costs time and tokens. It starts with no context. Start one only when it makes the
result better or faster.

## When to use a subagent

Use a subagent for one of these jobs:

- Independent checks. Two or more checks do not depend on each other. Run them at the same time,
  each in its own subagent. Example: the specification axis and the standards axis in a review.
- A new reader. A reader that has not seen your draft finds unclear text that you do not see.
  Example: a new reader for a pull request body or a diagram.
- Separate options. Each design or each option gets its own subagent, so one option does not bias
  the check of another. Example: each option in an ADR.
- A wide search. The answer is in many files, and you need only the result. Example: find each
  caller of a function, or each page that states a rule.
- A large read. A page or a log is long, and you need only a short summary.

## When not to use a subagent

Do not start a subagent in these cases:

- The task is small. One or two file reads or one command gives the answer.
- Each step depends on the result of the step before it. Example: the red, green and refactor
  steps of one test.
- The step needs the owner. Example: a question to the owner, or an action that needs the owner's
  OK. Only the lead talks to the owner.
- The step changes the repository: a file, a commit, a push, a comment, an approval or a merge.
  The lead does these steps. A subagent can change files only in its own isolated copy, and only
  when the skill says so.
- The proof must be your own. Example: a claim that you report at level 2 or higher in
  [verify-claim](../skills/verify-claim/SKILL.md).

If you cannot start subagents, do the steps one at a time in the order of the skill.

## The brief

A subagent does not see your context. Give it a brief that is complete without your context:

- The task, in one or two sentences.
- The inputs: the diff command, the file paths, the issue text or the draft.
- The rule pages or the building block that it must read, with their links. Give the full text if
  the subagent cannot read a link.
- What to report, in which format, and a word limit, for example 300 words.
- The limit line that the skill gives, for example: "Report to me only. Do not change files,
  commit, push, post, approve or merge."

Do not tell a subagent your expected answer. A subagent that knows the answer finds it.

## Model tiers

Select the smallest tier that can do the job well. A larger tier is slower and costs more. Use
the tier that the skill gives. If the skill gives no tier, use this table.

| Tier | Use for | Examples |
| --- | --- | --- |
| `large` | Judgment over a large or unclear scope. Design trade-offs, specification review, security, a hard bug, a release check. | Check a design against the architecture principles. Check that a change does what the issue asked for. |
| `medium` | Most work. Read code and docs and report facts. Apply a checklist. Read as a new reader. | Check a diff against the standards. Read a pull request body as a new reader. |
| `small` | A mechanical job with a clear answer. Search, list, compare two texts, summarize a page. | Find each file that links a page. List the labels that a project does not have. |

## Effort

Effort is how much the model thinks before it answers. Select the lowest effort that can do the
job well. A higher effort is slower and costs more.

| Effort | Use when | Examples |
| --- | --- | --- |
| `low` | The answer is a fact that one search or one read gives. | Find a file. List the open issues with a word in the title. |
| `medium` | The default. The job follows a clear procedure over a few files. | Read a section and report the rules that apply. |
| `high` | The job compares many files, weighs trade-offs, or finds what is missing. | Find what a change can break outside the diff. Check one design. |
| `xhigh` | A wrong answer is expensive and hard to undo. | Check compatibility and breaking changes before a release. Review a security change. |

Do not use an effort above `xhigh` unless the owner asks for it.

If the client does not let you set the effort, use the tier only. If the client has other effort
names, use the nearest level.

## Client map

The skills name only a tier and an effort. This table maps each tier to a model in each agent
client. Models change often. Check the client's model list if a name in the table is not
available.

| Tier | Claude Code | Codex | Grok |
| --- | --- | --- | --- |
| `large` | `opus` | `gpt-6.2-astra` | `grok-4.7` |
| `medium` | `sonnet` | `gpt-6.2-sol` | `grok-4.7` |
| `small` | `haiku` | `gpt-6-luna` | `grok-4.7` |

On Grok, all three tiers use `grok-4.7`, because no smaller Grok model was checked. The effort
from the skill sets the difference.

How to set the model and the effort:

- Claude Code: the `model` and `effort` fields of a subagent definition, or the model and the
  effort of the subagent call. `inherit` uses the lead's model.
- Codex: `agents.default_subagent_model` and `agents.default_subagent_reasoning_effort` in the
  configuration. A value at the spawn of a subagent overrides them.
- Grok: the `reasoning_effort` parameter of `grok-4.7` accepts `low`, `medium`, `high` and
  `xhigh`.

Sources:

- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)
- [Codex models](https://learn.chatgpt.com/docs/models)
- [Codex configuration](https://learn.chatgpt.com/docs/config-file/config-reference)
- [xAI reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning)

Last checked: 2026-11-21.

## Reports

A report from a subagent is a claim. It is level 1, Stated, in
[verify-claim](../skills/verify-claim/SKILL.md).

- Check each fact that your result depends on at its source before you use it.
- If you cannot find a fact at its source, do not use it, and say so.
- Keep the reports of independent checks separate. Do not merge or re-rank them unless the skill
  says so.
- The lead writes the result, does each action and talks to the owner.

## In a skill

Each skill has a `## Subagents` section. The section does one of these:

- It names the steps that subagents do and the brief for each subagent. It gives the setting
  for each subagent in this form: `tier <tier>, effort <effort>`. Then it says what the lead does
  with the reports. It gives the fallback for a client that cannot start subagents.
- It starts with `Do not start subagents for this skill. Reason:` and gives the reason.

The section names no vendor, client or model. Only this page does.

Related: [safety.md](safety.md), [review-and-merge.md](review-and-merge.md),
[triage](../skills/triage/SKILL.md).
