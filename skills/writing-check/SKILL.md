---
name: writing-check
description: "Use when you write or edit text that people or agents will read, such as docs, comments, commit messages or PR bodies. Applies the ASD-STE100 writing rules."
---

# Writing check

Use when you write or edit text that agents or humans will read.

Apply the rules from [writing/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md).

## Steps

1. Read the text.
2. Check against the rules: short sentences, active voice, one word per meaning, imperative steps, no em dashes, no filler.
3. Rewrite any sentence that violates a rule.
4. Remove words that do not add meaning.

## Subagents

If you can start subagents, use one as a new reader. A new reader finds unclear text that the author does not see. Do step 1 yourself. Then start one subagent that has not seen your draft. Give it a brief that is complete without your context before it reads:

- The full text to check, or its file path.
- Who the readers are, for example agents or people with limited English.
- This task: "Read the text as a new reader. List each sentence that is unclear, that you must read two times, or that can have two meanings. Quote the sentence and say why."
- What to report, and a word limit, for example 300 words.
- This line: "Report to me only. Do not edit the text, post, approve or merge."

Do step 2 yourself while the subagent reads. Then do steps 3 and 4 yourself. Use the report in step 3. The report is the opinion of one reader. Read each quoted sentence again yourself before you change it. Do not change the meaning to satisfy the report.

If you cannot start subagents, do the steps one at a time in the order of this skill. In step 1, read the full text once from start to end, as a new reader would, before you check it against the rules.

## Rules

- Prefer deletion over explanation.
- Do not add generic introductions or conclusions.
- Keep the original meaning.
