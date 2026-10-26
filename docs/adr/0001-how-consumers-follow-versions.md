# ADR 0001: How consumers follow dkstack versions

- Status: Proposed
- Date: 2026-10-26
- Deciders: Daniel Kindl (owner)
- Author: Atlas
- Issue: [#3](https://github.com/daniel-kindl/dkstack/issues/3)

## Context

Consumers read dkstack in two ways:

1. An agent fetches `AGENTS.md` from a raw GitHub URL and follows the relative links in it.
2. A person installs the skills with `npx skills add daniel-kindl/dkstack`.

Today every absolute URL points to `main`. These files have them: `README.md`,
`sample-AGENTS.md` and the bootstrap skill. The version in
`package.json` then protects no consumer. Each merge to `main` reaches every consumer at once, and
a consumer cannot go back.

Facts that limit the options:

- A raw URL can name a branch, a tag or a commit:
  `https://raw.githubusercontent.com/daniel-kindl/dkstack/<ref>/AGENTS.md`.
- Relative links in `AGENTS.md` resolve against the URL of the file. A consumer that pins the entry
  URL also pins every linked file. Only the absolute URLs need a ref.
- raw.githubusercontent.com sends `cache-control: max-age=300`. A change can take up to 5 minutes
  to reach a consumer.
- The team rule is: never force-push. To move a tag, you must force-push the tag ref.
- The ruleset `protect-main` allows squash merges only. Every merge to `main` is one commit.
- The skills CLI accepts a GitHub tree URL with a ref:
  `https://github.com/<owner>/<repo>/tree/<ref>`. On 2026-10-26, `npx skills add` with `--list`
  found all 8 skills at the head commit SHA of the #2 branch. A ref that contains `/` fails: the CLI
  reads only the part before the `/`. Release refs must not contain `/`.

The goal "update once, all repos follow" conflicts with the goal "a breaking change must not reach
all repos at once". The options below trade one against the other.

## Options

### Option A: consumers follow `main`

URL form in every file:

```text
https://raw.githubusercontent.com/daniel-kindl/dkstack/main/AGENTS.md
npx skills add daniel-kindl/dkstack
```

Update: nothing to do. Each merge reaches the consumer in 5 minutes or less.

Rollback: the owner reverts the change on `main` with a new PR. A consumer cannot roll back alone.
As an emergency step, a consumer can replace `main` with a commit SHA in its own `AGENTS.md`.

Trade-offs:

- Good: no work in consumers. No release step.
- Bad: no pinning. A merge is a release, so a version number has no effect.
- Bad: a breaking change reaches every consumer at the same time.
- Bad: a bad merge reaches every consumer before review of its effects.

### Option B: consumers pin a release tag

URL form in every file:

```text
https://raw.githubusercontent.com/daniel-kindl/dkstack/v1.0.0/AGENTS.md
npx skills add https://github.com/daniel-kindl/dkstack/tree/v1.0.0
```

Update: in each consumer, change `v1.0.0` to the new tag in one line. Reinstall the skills.

Rollback: in the consumer, change the tag back to the previous one.

Trade-offs:

- Good: each consumer is stable and can roll back alone.
- Good: tags never move, so no force-push is necessary.
- Bad: each update is a change in each consumer. With N consumers, one release is N changes.
- Bad: consumers drift to old versions. This works against "update once, all repos follow".

### Option C: a moving major ref (`v1`) for compatible changes

Compatible releases (MINOR and PATCH) move `v1` forward. A breaking release starts `v2`. Each
release also gets a fixed `vX.Y.Z` tag.

URL form in every file:

```text
https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md
npx skills add https://github.com/daniel-kindl/dkstack/tree/v1
```

Two ways to make `v1`:

- C1, a moving tag. To move a tag, you must force-push it. This breaks the team rule.
- C2, a release branch. The owner releases with a fast-forward push from `main` to `v1`:
  `git push origin <release-sha>:refs/heads/v1`. A fast-forward push is not a force-push. A ruleset
  on `v1` blocks force-push and deletion.

Update: compatible releases need nothing in the consumer. For a new major version, change `v1` to
`v2` in one line in each consumer, after you read the breaking changes in `CHANGELOG.md`.

Rollback:

- The owner reverts the change on `main`, releases a PATCH, and moves `v1` forward again.
- As an emergency step, a consumer pins the last good `vX.Y.Z` tag. It goes back to `v1` after the
  fix.
- `v1` itself never moves back, because that needs a force-push.

Trade-offs:

- Good: compatible changes reach all consumers with one release, as with option A.
- Good: breaking changes reach a consumer only when it chooses, as with option B.
- Good: a merge to `main` is not a release. The owner decides when a change goes out.
- Bad: one more step per release, and one more ruleset to keep.
- Bad: semver must be correct. A breaking change released as MINOR reaches every consumer.

## Recommendation

Option C2: a `v1` release branch, with a fixed `vX.Y.Z` tag on each release.

It is the only option that keeps "update once" for compatible changes and still protects consumers
from breaking changes. It also separates two concerns that option A joins: merging a change and
releasing it. C1 is not acceptable, because it needs a force-push.

If the owner prefers the smallest design, option B is the safe second choice. It has no release
branch, but each update is a change in each consumer.

## Decision

None yet. Daniel decides. This ADR stays "Proposed" until he accepts one option. After that, the
status changes to "Accepted" and this section records his choice and the date.

## Consequences

These apply after a decision. The follow-up work is issue #5 (Forge) and issue #12 (Scribe).

- All files use one URL form: `README.md`, `sample-AGENTS.md` and the bootstrap skill.
- The validate workflow can check that no file uses a different ref.
- Option B or C: `versioning/index.md` gets the release and rollback steps.
- Option C2: a new ruleset protects `v1` from force-push and deletion. The owner alone moves it.
- Option B or C: test the skills install command with the real release ref before release.
- No tag, release branch or GitHub release is created as part of this ADR. The owner publishes.
