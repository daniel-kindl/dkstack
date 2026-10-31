# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-31

### Added

- `coding/naming.md`: language-agnostic identifier naming guidance, preferred naming forms, semantic review criteria, and native analyzer enforcement recommendations.
- Owner-directed issue triage: a verified explicit owner request can authorize preparation of missing readiness metadata while preserving prerequisite, eligibility, claim and safety checks.
- `skills/write-pr`: writes a pull request body with Summary, Evidence, Risk and rollback, and
  References. The detail matches the change. Evidence separates verified, unverified and known
  risk, and names a required check that did not run as NOT RUN. A trivial change does not need a
  diagram or a long risk form. The skill does not review or merge. `triage` routes pull request
  text to the skill and leaves an unchanged review on `code-review`. The pull request template
  uses the same sections. `workflow/review-and-merge.md` links the skill and keeps the merge rules.
- `architecture/stewardship.md`: three levels of codebase stewardship. Awareness applies to every
  task and adds no step. Analysis applies only for a named signal or a human request. Intervention
  stays inside the authorized scope. The principles have no fixed rank. Seven scenarios show the
  expected decision. `AGENTS.md` and `architecture/index.md` link the page. `triage` names the
  signals, including an ADR that no longer matches the code, and does not send ordinary work to
  the page. `tdd-loop` keeps a refactor inside the task scope and keeps existing tests green. It
  does not limit a refactor to code that a test already executes. `apply-architecture`, `plan-work`,
  `tdd-loop` and `code-review` point at the page and do not copy it.
- `workflow/lifecycle.md` and `scripts/lifecycle.mjs`: the route from an external request through
  preflight, mapping, a fresh session, independent review and a merge of the reviewed head.
  Triage classifies a request that has no lifecycle label and no eligibility label. Implementation
  readiness applies before implementation. A merge also requires the reviewed head, an independent
  reviewer, a squash merge and branch protection that allows the merge. Named failures stop and
  link the contract that holds
  the procedure. `.github/ISSUE_TEMPLATE/external-request.md` asks for an outcome, constraints,
  context and acceptance intent. `triage`, `plan-work` and `tdd-loop` link the work and claim
  contracts.
- `skills/map-work`: maps an accepted multi-PR objective to bounded child issues. It checks
  native relationships and readiness, records a repository handoff, and stops before child
  implementation. New children stay in planning until the mapping pull request has passed
  independent review and is merged. The parent stays active while children do the work.
  `triage` routes one-PR work to `plan-work` and multi-PR work to `map-work`.
- `workflow/claims.md`: defines claim events for agent sessions that share a tracker account.
  It specifies server-ordered collision handling, handoff, release and owner recovery. It keeps
  claim history in issue comments and states when the tracker cannot support reliable claims.
- `scripts/preflight.mjs` and `workflow/preflight.md`: a dry-run tracker preflight. It reports
  unsupported capabilities and their fallbacks. It plans missing catalog labels. It does not
  change an existing label, remove a label, or change protection, settings or infrastructure.
  A second run plans no new create. With no report file, the command discovers the tracker.
  `--apply` creates only the missing catalog labels. Do not pass a report file with `--apply`.
  A probe that did not run sets that capability to unverified. That capability is not unsupported.
  The page includes an optional mapping for a label name, a color and a description.
  `skills/bootstrap` runs this preflight.
- `workflow/work.md`: the work contract. It defines the issue lifecycle, readiness, sources,
  authorization and session isolation. It links the safety, role, review and feature-plan rules
  and does not copy them. A prerequisite unlocks work only when it is complete. A rejected or
  abandoned prerequisite does not. In-scope map-work follows the repository rules and does not
  need a new owner approval. A material scope expansion or a restricted action needs the owner.
  A mapping pull request does not move the parent from active to review. Children are not
  actionable until that pull request has passed independent review and is merged.
  The session that maps issues must not implement those issues.
- `skills/release`: guides a release. It links `versioning/index.md` and `workflow/safety.md` and
  does not copy their rules. An agent publishes only with the owner's explicit OK for that version.
  The OK never covers a production deploy or a project's release workflow.
- `architecture/`: new pages `concurrency.md`, `actors-and-blackboards.md`, `state-machines.md`,
  and `configuration.md`.
- `skills/plan-work` and `workflow/feature-plans.md`: an agent can write a plan for one feature
  that lists small, logical commits, and keep it up to date. Another agent can resume the plan. By
  default, the agent removes the completed plan before the pull request is opened. The review
  does not require the plan. If the
  agent can start subagents, it compares the plan with the issue, the commits and the checks in
  parallel. It gives a fallback for each missing piece. `triage`, `clarify-intent`,
  `apply-architecture`, `tdd-loop`, `AGENTS.md` and the workflow pages link to the plan.

### Changed

- `AGENTS.md`: names dkstack and its owner. Projects follow `v1`. A dkstack rule wins over a
  project rule, except through a documented exception. The hard limits are the rules in
  `workflow/safety.md`. The general rules are now links to the sections.
- `skills/triage`: the conflict rule now points to the precedence rules in `AGENTS.md`. A scale
  ladder maps a bug fix, a feature and a release to skills in order. A small task uses one or two
  skills. A review finding goes back to the implementation step. A design finding goes back to the
  architecture step.
- `skills/code-review`, `workflow/review-and-merge.md` and `workflow/index.md`: the Blocking row
  and the Safety bullet use the same three cases. The reviewer merges only the head that they
  reviewed, and only when the code host shows the pull request as ready to merge with no rule
  bypassed. The flow states the same gates.
- `skills/code-review`: the skill now guides a review step by step on two axes, standards and
  specification. It adds a blast radius step, evidence levels for claims, a code smell list,
  severity levels and one verdict. If the agent can start subagents, it runs the two axes and
  the blast radius in parallel. It gives a fallback for each missing piece, for example no
  pull request, no base ref, no automated checks or no specification. It names no agents or tools.
- `skills/bootstrap`: the steps now describe each need and name no tools or platforms. Steps 7 to
  11 still cover each supply chain rule in `coding/dependencies.md`. The tool-specific examples
  are removed, and the tests now check the agnostic text.
- `skills/writing-check`, `skills/apply-architecture`, `skills/write-adr` and
  `skills/clarify-intent`: each skill has a Subagents section. A new reader checks the text in
  `writing-check`. Each design gets its own subagent in `apply-architecture`. Each option gets
  its own subagent in `write-adr`. One subagent reads the code and one subagent reads the docs in
  `clarify-intent`. The agent checks the reports itself. If the agent cannot start subagents, it
  does the steps one at a time in order.
- `workflow/safety.md` and `versioning/index.md`: an agent can publish or release only with the
  owner's explicit OK for that release. The OK names the exact version. It never covers a
  production deploy or a project's release workflow.
- `docs/adr/0001`: a dated amendment records this decision.
- `version-control/`: the commit subject format is now `type(scope)!: description`. The scope
  and the `!` breaking-change marker are optional. The 50-character limit stays.
- `coding/quality-gates.md`: an exception is allowed only for a diagnostic whose cause cannot be
  fixed in the repository. It needs a rule ID, the smallest scope, a reason, and approval by a
  reviewer who is not the author. Blanket suppressions and suppressed test failures stay forbidden.
  This replaces "Do not add exceptions".

### Fixed

- `scripts/preflight.mjs`: probe GitHub's native blocked-by endpoint. The live preflight now
  reports blocking links as supported when the endpoint works and remains fail-closed on error.
- `scripts/check-title.mjs`: the title check now rejects a subject longer than 50 characters.
  It counts Unicode code points and does not count the ` (#NN)` suffix. A test now proves that
  the check rejects a double `!`.
- `scripts/check-title.mjs`: a title with only the ` (#NN)` suffix as the description fails.

## [1.0.0] - 2026-10-28

### Added

- `AGENTS.md`: the entry point for agents.
- `sample-AGENTS.md`: an `AGENTS.md` to copy into a project that uses dkstack.
- `CONTRIBUTING.md`: how to propose a change to dkstack.
- `SECURITY.md`: how to report a vulnerability in private.
- `.github/pull_request_template.md`: the pull request body template.
- Sections, each with an `index.md`:
  - `architecture/`: architecture principles.
  - `coding/`: coding standards and practices.
  - `tdd/`: test-driven development.
  - `version-control/`: conventional commits and feature branches.
  - `versioning/`: semantic versioning.
  - `writing/`: writing style (ASD-STE100).
  - `skills/`: skills for agents.
  - `tips/`: short tips.
  - `workflow/`: roles, review and merge, and safety.
- `docs/adr/`: architecture decision records. ADR 0001 sets how consumers follow versions.
- Skills, each in `skills/<name>/SKILL.md`:
  - `triage`: selects the guidelines and skills that apply to a task.
  - `bootstrap`: sets up commit, branch, version, check and supply chain rules in a new repository.
  - `clarify-intent`: clarifies the requirements and the domain language before you write code.
  - `apply-architecture`: checks a design change against the architecture principles.
  - `tdd-loop`: runs the red, green, refactor cycle with a failing test first.
  - `code-review`: checks a change against the repository standards and the specification.
  - `write-adr`: creates an architecture decision record.
  - `writing-check`: applies the ASD-STE100 writing rules to text.
- The `validate` workflow. It checks the PR or commit title, the skills, the links, the dashes,
  the workflows, the CHANGELOG entry for the version and the unit tests.

[Unreleased]: https://github.com/daniel-kindl/dkstack/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/daniel-kindl/dkstack/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/daniel-kindl/dkstack/releases/tag/v1.0.0
