---
name: setup-labels
description: "Use when a repository does not have the type or priority labels that the issue rules name. One building block of bootstrap. Lists the missing labels and creates them with the owner's OK."
user-invocable: false
---

# Set up labels

A building block of [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md). Use it alone, or as a step of bootstrap. Do not weaken an existing quality gate. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).

The [issue rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/issues.md) name the labels. Labels are shared project settings. Create, change or delete a label only with the owner's OK that names the labels.

## Steps

1. Find out if the project uses an issue tracker that has labels. If it does not, skip this skill. The [local files](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/issues.md#projects-without-an-issue-tracker) use the `Type` and `Priority` lines in place of labels.
2. Read the labels that the project has. If the tool supports the code host of the project, the owner can run the [audit tool](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/scripts/audit-issues.mjs). It lists the missing labels.
3. List each label below that the project does not have:
   - Type: `type:bug`, `type:feature`, `type:chore`, `type:refactor`, `type:docs` and `type:research`.
   - Priority: `priority:p0`, `priority:p1`, `priority:p2` and `priority:p3`. `priority:p0` is the most urgent.
4. List each existing label that has a similar job but a different name, for example `bug` or `enhancement`. Do not change or delete an existing label without the owner's OK. Ask the owner to select one option for each label:
   - Keep it, and add the dkstack label.
   - Rename it to the dkstack label. A rename keeps the label on its issues.
5. Give the list to the owner. Create or rename only the labels that the owner names in the OK.
6. Read the labels again. Record in the issue what the owner applied and what stays open.

## Subagents

Do not start subagents for this skill. Reason: this is one small job, and step 5 needs the owner. bootstrap can check it in a subagent. See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).
