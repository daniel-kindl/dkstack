# Roles

Give each task to one role, so that each agent has one responsibility.

## Rules

- One agent can hold more than one role, but the author must not review, approve or merge their
  own pull request. Reason: a second agent finds errors that the author does not see.
- The author writes the pull request body and lists the tests. The writer edits the text. Reason:
  the author knows best which tests prove the behavior.
- The human owner approves material scope changes and every release. Routine steps within an
  assigned task do not require repeated approval. Reason: only the owner is accountable for the
  repository.
- The human owner may merge, as the [merge rule](review-and-merge.md#rules) says. Reason: the owner
  is not an agent author.

## Human owner

The human owner is only the owner who acts in person, or the owner's own words. A bot or an agent
that acts through the owner's account is always an agent. It is never the human owner.

### Owner records

An owner record keeps an owner instruction for a later session. Write it on the issue or the pull
request that the instruction is about. Write it before a later session relies on it. It has these
fields:

- The owner's exact words.
- The time and the place where the owner gave them, for example the chat session and its date.
- The scope: the issue, the pull requests and the actions that the instruction covers.
- A session link or identifier, if one exists. If none exists, the context that identifies the
  instruction and the session, and the reason that the session is owner-controlled.

A relayed decision counts as the owner's words only if a record quotes the owner's exact words
with the time and the place. A paraphrase or an agent's summary never counts.

## Role definitions

- The implementer writes the code and the tests for an issue.
- The reviewer reviews pull requests and merges them.
- The architect writes ADRs and reviews the design.
- The writer writes the docs and edits the pull request text.
- The coordinator plans the work.

One person or agent can hold several roles. See [Rules](#rules).

## Good example

The implementer opens a pull request. The reviewer reviews it and merges it.

## Bad example

The implementer opens a pull request, reviews it and merges it. The author must not merge their
own pull request.

Related: [review-and-merge.md](review-and-merge.md), [safety.md](safety.md).
