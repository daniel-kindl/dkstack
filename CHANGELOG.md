# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The classes for dkstack are in
[breaking changes in dkstack](versioning/index.md#breaking-changes-in-dkstack). An entry for a
change that a consumer must act on has a "Consumer action:" line.

## [Unreleased]

### Added

- `scripts/check-review.mjs` (#309). A reviewer runs it on the review file before posting. It
  checks the verdict, the head SHA, the `file:line` of each finding and open findings. The merge
  rule names `gh pr merge --squash --match-head-commit <sha>`.

## [1.6.0] - 2026-11-21

### Added

- `workflow/subagents.md` (#294). It says when a subagent helps and when it does not, what the
  brief contains, and how to use a report. It gives three model tiers (`large`, `medium`,
  `small`) and four efforts (`low`, `medium`, `high`, `xhigh`). One table maps each tier to a
  model in Claude Code, Codex and Grok. Only this page names a vendor model.
- A Subagents section in each skill (#294). A skill that starts subagents gives a tier and an
  effort for each subagent and links the guide. New sections are in `setup-dkstack`,
  `bootstrap`, `start-issue`, `make-diagram`, `chart-route`, `ui-design` and `ui-review`. Each
  other skill says why it starts no subagent.
- `skills/setup-labels` (#292), a building block of `bootstrap`. It lists the `type:*` and
  `priority:*` labels from `workflow/issues.md` that the project does not have. It creates or
  renames a label only with the owner's OK that names the labels. It does not change or delete
  an existing label without that OK. A project without an issue tracker skips it. `bootstrap` runs it as step 7,
  and the README check is now step 8.
- `skills/setup-dkstack` (#290). It connects a new or an existing repository to dkstack. It
  copies `sample-AGENTS.md` as `AGENTS.md`, or merges the pointer into an existing `AGENTS.md`
  and keeps the project text. It asks the owner to remove or record as an exception each project
  rule that conflicts with dkstack. It adds `@AGENTS.md` to `CLAUDE.md` and points other agent
  files to `AGENTS.md`. It installs the skills only with the owner's OK and checks the result.
  `bootstrap` step 1 and `triage` use it.
- `skills/make-diagram` (#193). It tells when a diagram helps and when the text is sufficient.
  It maps each need to a kind of diagram: flow, sequence, state, component or dependency, data
  model, and before and after. It prefers Mermaid in Markdown, with a plain-text sketch as the
  fallback, and no binary image. It names the place for each target and checks that the diagram
  matches the code, renders and has a text alternative. `triage` routes a request for a diagram
  or a visual to it. `write-pr`, `write-adr` and `plan-work` link it.
- `CONTEXT.md`, the domain glossary of dkstack (#283). It defines Owner, Consumer, Exception,
  Suppression, Building block, Quality gate, Required check and Owner record.
- Clean-up rules after a merge in `workflow/review-and-merge.md` (#277). The agent that merged
  switches to `main` and updates it with a fast-forward only. It removes the worktree and the
  local branch of the merged pull request. It removes a worktree only when the worktree has the
  merged branch and no ignored file that cannot be made again. It deletes only stale branches:
  the pull request is merged into `main`, and the tip is the merged head or an ancestor of it.
  It never discards uncommitted changes or unmerged commits. The page gives the `git` and `gh`
  commands. `feature-branches.md` and `code-review` link the rules.
- Issue relations in `workflow/issues.md` (#192). A task that has parts is a parent issue, and
  each part is a sub-issue. An issue that must wait for another is "blocked by" it. Do not start
  work while a blocker is open. The page gives the `gh` commands. The local files get `Parent:`
  and `Blocked by:` lines. `start-issue` sets and checks the relations. In `plan-work`, each
  task issue is a sub-issue of the plan issue, if one exists, and the order is set as "blocked
  by" relations. `chart-route` uses the `plan-work` rule for the map tasks.
- Forced colors rules in `ui/colors-and-themes.md` (#248). When the project supports Windows, test
  each changed surface in forced colors mode. Use system colors there. Do not show a state with a
  background color only. On the web, use `@media (forced-colors: active)`. The minimum evidence in
  `ui/visual-verification.md` adds a forced colors check when the project supports Windows.
- A rule for breaking changes in dkstack (#246). MAJOR: remove or rename a skill, a page or a linked
  anchor, or add a hard limit. MINOR: a new skill, page or duty, or a renamed anchor that keeps the
  old anchor as a redirect. PATCH: wording only. Each class has an example. A MAJOR change has `!`
  in its title. A release that needs a consumer to act has a "Consumer action:" line. SECURITY.md
  says that `v1` gets no fixes after `v2` is released.
- `scripts/check-writing.mjs` warns about a step with more than 20 words, a sentence with more than
  25 words and a semicolon in Markdown (#244). It skips CHANGELOG.md, code, block quotes, tables,
  headings and text in double quotes. It always exits 0 in this first stage. `npm run check` and
  the validate workflow run it as `check:writing`. A step is a numbered or a checklist item.
- `writing/user-facing-copy.md` (#249). It covers product READMEs, landing pages, release notes for
  users, announcements, emails, CLI messages and app store text. Put the one thing that the reader
  must do or know first. Do not invent numbers, quotes, customers or comparisons. No hype, no fake
  urgency and no fake scarcity. Name breaking changes and the user action first. ASD-STE100 still
  applies. The writing index, triage and `ui/content-and-localization.md` link the page.
- Visual baseline rules in `tdd/ui-testing.md` (#236). A pinned image has zero tolerance by
  default. A tolerance needs a reason beside the test. Each baseline is in the repository next to
  its test. A pull request that updates a baseline shows the before and after image, and the
  reviewer approves each update.
- `npm test` fails when the tests cover less than 95% of the lines or 90% of the branches in
  `scripts/` (#231). It uses the coverage flags of Node 24 and no new dependency. The coverage at merge
  time was 99.16% of lines and 93.51% of branches.
- A contributor checklist in CONTRIBUTING.md (#230). "Run the checks" names `npm run check`, Node 24
  and the separate title check. "Add a page or a skill" lists the index entry, the route from
  triage, a test, the `[Unreleased]` line and raw `v1` links in skills. "Update bot pull requests"
  says that the reviewer edits a title over 50 characters before the merge. The page says that each
  rule has one owner page.
- `setup-repo-protection` building block (#222). It lists the protection settings for the owner to
  apply: a default branch rule (pull request, required checks, squash only, linear history, no
  force-push, no deletion, no bypass for administrators), rules for release tags and release
  branches, secret scanning with push protection, private vulnerability reporting, `SECURITY.md`
  and `CODEOWNERS` for the CI workflow files. It links the CI workflow rules. An agent does not
  change a setting without the owner's OK. Bootstrap step 6 runs it. Step 7 checks that the README
  says what the project is, who it is for, how to install and run it and how to contribute.
- `test/routes.test.mjs` checks that each skill and page can be found (#208). `skills/index.md`
  lists each skill. Triage reaches each skill, directly or through a skill that it links. Each
  section index lists each page of its section. AGENTS.md "Sections" lists each section index,
  except `tips/` while it has no tip.
- `test/hard-limits.test.mjs` pins each hard limit by a short key phrase (#186): no force-push, no
  bypass, no push to `main`, no production deploy, no release without the owner's OK, the author
  never merges, an agent message is not approval, no secrets in chat, the shared account line, a
  failing test first in `tdd-loop` and SHA pins in `review-standards`. A deleted limit fails the
  test. A wording change that keeps the key phrase does not.
- A "Native equivalents" table in `ui/accessibility.md` (#187). It gives examples for a live
  announcement, an accessible name, a heading, the language and the theme on Avalonia, .NET MAUI,
  Android and iOS. The rows are examples, not requirements. `ui/responsive-design.md` says not to
  copy web breakpoint values into native apps, and to use the platform's adaptive layout tools and
  window size classes.
- A leak runbook in `coding/security.md` (#185). If a token, a key or a password leaks: tell the
  owner, revoke the secret, rotate it, read the audit log, read the secret scanning alerts and
  record the event in an issue. The step for the dkstack release app key links
  `versioning/index.md`. The leak rule links the runbook.
- `chart-route` skill (#175). It settles a large, unclear effort in a map in `docs/maps/<slug>.md`,
  one question per session, and hands off to `plan-work`. It plans and never builds. A question is
  owner, research, prototype or task. Each answer is recorded once: an ADR, a `CONTEXT.md` entry or
  the Decisions line, with `Decided by:` and the date. Each session opens one docs-only pull request
  that changes only `docs/maps/`, `docs/adr/` and `CONTEXT.md`. A prototype is text only on `main`,
  on a tagged `prototype/<slug>-q<n>` branch that is never merged. A done map opens one issue for
  each map task and stays in `docs/maps/`. `plan-work` step 1 takes the goal, the criteria, the
  dependencies and the decisions from the map and invents none of them. Inspired by Matt Pocock's
  grill-me, grill-with-docs and wayfinder skills (MIT). The text is new.
- Format checks (#174). `scripts/check-maps.mjs` checks the maps in `docs/maps/`.
  `scripts/check-context.mjs` checks the `CONTEXT.md` format, duplicate terms and terms on an
  `_Avoid_:` line. `scripts/check-adrs.mjs` checks that each added ADR has a known `Status:`, an
  `Affects:` line whose globs match files, and an existing Superseded by target. Its `--review`
  mode lists the ADRs that a reviewer must read and always exits 0. Each script prints
  `path:line: message`, exits 0, 1 or 2, and has no dependencies. A missing `docs/maps/` or
  `CONTEXT.md` is a pass. `npm run check` and the validate workflow run them, and the workflow
  fetches the full history for `check-adrs`. `setup-quality-gates` copies the scripts from a fixed
  release tag and makes them required. `write-adr` runs `check-adrs` before a pull request.
- ADR findings (#173). Code that contradicts an Accepted ADR is High and blocks the merge. The
  finding quotes the ADR line and the code line, or it is a question. A newer ADR that supersedes
  the old ADR clears it. A new ADR has a `Status:` line and an `Affects:` line. An old ADR with no
  `Status:` line counts as Accepted, and a missing `Affects:` line on it is never a finding.
- `clarify-intent` rounds (#172). Switch to rounds when more than 3 questions are open, a question
  depends on another question, the owner asks to be grilled, or `chart-route` sends a question.
  Each round starts with a "Settled so far" summary and asks at most 3 frontier questions, each with
  one recommended answer that "yes" accepts. The agent finds the facts and never answers the
  owner's decisions. The rounds are done when no question is open and the owner confirms the
  summary in their own words. Steps 1 to 5 do not change.
- Skill building blocks (#167). `code-review` runs `review-spec`, `review-standards`,
  `review-blast-radius` and `verify-claim`. `bootstrap` runs `setup-editorconfig`,
  `setup-quality-gates`, `setup-versioning` and `setup-supply-chain`. The text moved from the two
  skills to the building blocks. No skill is removed or renamed, and the `code-review` anchors stay.
  `tdd-loop` and `write-pr` link `verify-claim`.
- Invocation classes (#167). A skill is user, agent or both. `scripts/check-skills.mjs` accepts
  `disable-model-invocation` and `user-invocable` with the value `true` or `false`. A user-only
  skill also needs `agents/openai.yaml` with `allow_implicit_invocation: false`, and the check
  makes sure that the two agree. `release` is user-only. `triage` and the building blocks are
  agent-only. `skills/index.md` lists the class of each skill. A description can end with
  `Triggers:` and the words that a person uses to ask for the skill.
- `workflow/issues.md`: one task, one issue. Search for an open issue before you open one. Set
  exactly one `type:` label and an optional `priority:` label. Do not create a label without the
  owner's OK. Assign the issue to the logged-in account only when you start to work on it, not
  when you only open, triage or review it. An assignment is a
  marker only. A project with no issue tracker keeps one file for each task in `docs/issues/`.
  The `start-issue` skill applies the rules. `workflow/index.md`, `workflow/review-and-merge.md`,
  `skills/index.md` and `triage` link them. The removed `status:`, `agent:` and `needs:` labels and
  the claims do not come back (#166).
- `architecture/domain-languages.md` has a Glossary section. It owns `CONTEXT.md` at the
  repository root in folium's format: an H1, a `## Language` heading and `**Term**:` entries with an
  optional `_Avoid_:` line. The file holds only domain terms and no implementation details. The new
  `domain-glossary` skill reads the file, flags a conflicting word and records a resolved term.
  `triage` reads `CONTEXT.md` before a task. `clarify-intent` writes new terms to it. The
  `code-review` standards axis has a Domain language line. This lands the Glossary part of #153
  (#168).
- `coding/security.md` has a "CI workflows" section. It owns the rules for untrusted triggers,
  expression values in scripts, secrets, checkout tokens, permissions, timeouts and fork approval, and
  it says what a safe release or deploy workflow is. `code-review` links it (#154).

### Changed

- ADR 0001 records the owner's decision to release 1.6.0 on `v1`. This release removes the
  agent roles page (see Removed), renames the anchor `coding/quality-gates.md#exceptions` and adds a hard
  limit. Under the breaking change rule, each of these is MAJOR. The exception is for this release
  only. Each later breaking release starts `v2`. Read each "Consumer action:" line below.
- The pages use the terms of `CONTEXT.md` (#285): "owner", "consumer", "suppression", "building
  block" and, for the checks that you run locally, "quality gates". `workflow/safety.md` defines
  the owner under `## Owner`. The heading `## Exceptions` in `coding/quality-gates.md` is now
  `## Suppressions`. A test checks that no page and no Unreleased entry uses a word from an
  `_Avoid_:` line.
  Consumer action: change a link to `coding/quality-gates.md#exceptions` to
  `coding/quality-gates.md#suppressions`.
- The fix loop in `workflow/review-and-merge.md` (#279). After a verdict that is not
  APPROVE-RECOMMENDED, the author fixes each finding of every severity with `tdd-loop` and gets a
  new independent review. This repeats until APPROVE-RECOMMENDED. The author does not ask the
  owner whether to fix a finding. In `code-review`, a Low finding now blocks the merge, and
  APPROVE-RECOMMENDED means no open finding. The self-review fixes each finding. The workflow flow
  links the loop.
- Long sentences and semicolons on 11 pages are split, so `check-writing` gives no warning on them.
  Each rule keeps its conditions, its actor and its modality. `ui/typography.md` says "This fails
  Resize text (1.4.4)". `versioning/index.md` wraps at 100 characters in the release section.
- `architecture/adrs.md` has a place rule and an amendment rule (D6 in #154). Store each ADR in
  `docs/adr/` as `NNNN-short-title.md`. If the owner changes a decision, add a dated amendment and
  do not change the old text. ADR 0001 records D2 and corrects the tag pin statement in its Context.
- The bootstrap description, its intro and the skills index name repository protection and the
  README check (the Low on #227). Step 7 is split into short sentences.
- The tests share one `sectionText` and one `flatten` from `test/helpers.mjs` (#250). Three test
  files had their own copies. The test count stays the same.
- One word for each meaning (#247). The rule text in `versioning/index.md` and `workflow/safety.md`
  says "the owner", not "Daniel" or "he". AGENTS.md names Daniel once, in "Owner". The quoted
  message of the Release workflow does not change. Prose says "pull request", not "PR". `plan-work`
  writes NOT RUN, the result value that the other pages use.
- `code-review` and `versioning/index.md` have no sentence over 25 words and no semicolon (#245).
  Six sentences are split. The meaning does not change. A test checks both pages.
- The writing rules have limits that a check can test (#243). A step has at most 20 words. A
  sentence in a description has at most 25 words. Do not use a semicolon. A new "AI prose patterns"
  section gives six examples. The scope includes the text that an agent writes to a person, such as
  the learn tutor. `writing-check` step 2 checks each rule in `writing/index.md` and lists no subset.
- The owner record has one owner, `workflow/safety.md` "Owner records" (#229). It names the fields
  (the owner's exact words, the time, the place, the scope and a session link) and where the record
  goes. `workflow/safety.md` "Owner instructions in chat" keeps one rule and links it. That section
  and "Missing review evidence after merge" are rewritten in the writing rules, with the same
  meaning: no semicolons, and no "durably", "attest", "establish", "genuine", "obtain" or
  "insufficient". `review-and-merge.md` no longer says "The review does not require a feature plan."
- README.md says what dkstack is and who it is for (#235). The top says that dkstack is guidance
  only and is for any team that uses AI coding agents, and a short "Start" list follows. README.md,
  `package.json` and AGENTS.md use one tagline: "Rules and skills for AI coding agents, in one
  place."
- `writing/index.md` has one Scope section (#234). ASD-STE100 applies to all text that people or
  agents read, including product copy: UI text, landing pages, product READMEs, release notes,
  announcements and emails. Nothing is out of scope. `writing-check` and
  `ui/content-and-localization.md` link it. Before, the UI page said that the writing rules did not
  apply to UI copy.
- dkstack pins Node 24 and records its npm exception (#223). `package.json` has
  `"engines": { "node": ">=24" }`, and a test checks that it matches the `node-version` in both
  workflows. CONTRIBUTING.md has an Exceptions section: dkstack has no npm dependencies, so it has no
  lockfile and no audit until the first dependency. A test fails if a dependency comes without
  `package-lock.json`. A new `.editorconfig` sets UTF-8, LF and two-space indents.
- The merge rule has one owner, the Rules of `workflow/review-and-merge.md` (#221).
  `workflow/index.md`, `workflow/safety.md` and `code-review` keep one short
  sentence and link it. The tests check the key facts on the owner page and the links from the
  other pages, not full sentences.
- The release rule has one owner, `workflow/safety.md` (#205). No agent publishes or releases. No
  agent creates a release tag, pushes to a release branch or to `v1`, publishes a package, or
  starts a release or deploy workflow. A tag or branch push that starts such a workflow counts as
  starting it. Before, an agent could do these with the owner's OK for the version. The `release`
  skill stops after it proposes the version and the changelog entry. AGENTS.md, CONTRIBUTING.md
  and `versioning/index.md` link the rule. `safety.md` and `versioning/index.md` say that the rule
  is an honor rule while dkstack agents use the owner's account. "Finish a release" is for Daniel
  only.
- Triage links the stewardship signals in `architecture/stewardship.md#analysis` and no longer
  copies the list (#207). The stewardship test checks the link and bans the copy in triage too.
- A project has one place for its exceptions to dkstack rules (#210). `sample-AGENTS.md` says
  that dkstack owns all other rules, and has an Exceptions section with the fields dkstack rule,
  project rule and reason, and a Project facts section. AGENTS.md "Precedence" has an example
  record. `coding/quality-gates.md` says that a diagnostic exception is not a rule exception and
  links Precedence. Bootstrap step 1 copies `sample-AGENTS.md` as `AGENTS.md`. The other steps
  move down by one.
- Pages link a rule's owner page and do not copy the rule (#211). `code-review` links the title
  rules. `coding/practices.md` links the quality gates. `coding/quality.md` links error handling.
  `coding/index.md` says that `testing.md` points to `tdd/`. `architecture/reversibility.md` links
  the easier to change rule. `tdd/security-testing.md` sends a report to the project's
  `SECURITY.md` and names the dkstack file as an example.
- Each accessibility rule on the forms, interactions, components, motion, typography and layout
  pages has a WCAG criterion number or "(dkstack rule)" (#212). A test reads each bullet that names
  an accessibility topic. `components.md` owns the list of states, and "pressed" is the one word
  for that state. `typography.md` owns the reading width. `forms.md` owns where an error goes.
  The other pages link them.
- The UI test rules in `tdd/ui-testing.md` can be tested (#188). A UI test asserts what makes a
  screen reader announce an error: a live region, an automation property or the announcement API of
  the platform. The manual screen reader pass confirms each announcement and is recorded as the
  minimum evidence in `ui/visual-verification.md` says. The checker examples add
  `performAccessibilityAudit` on iOS.
- The project's design system wins over the Defaults sections of the ui/ pages only (#183). A
  default applies when the project's system does not cover that area. A rule marked
  "(dkstack rule)" still applies. To differ from it, record an exception as AGENTS.md
  "Precedence" says.
- `code-review` gives APPROVE-RECOMMENDED only when each required check is green on the reviewed
  head (#184). If a required check is pending, the reviewer gives no verdict yet. A broken build or
  a failing required check is High, in one row of the severity table.
- Triage routes learning work and CI work (#182). The type list has UI and learning. A Skills line
  routes a request to learn, practice, assess or review a topic to `learn`. The Section map links
  `learning/index.md`, and routes a change to `.github/workflows`, tokens, secrets or repository
  settings to the CI rules in `coding/security.md` and to `workflow/safety.md`. The two writing
  rows are one row. A rule conflict links AGENTS.md "Precedence". AGENTS.md "Sections" lists
  `learning/index.md` and no longer lists the empty tips page. README.md no longer lists it.
  `skills/index.md` links `learning/` next to `learn`.
- The validate workflow is harder to break (#181). A test checks that each `check:*` script is in
  `npm run check` and has a validate step that runs after an earlier failure. A push to `main`
  checks the title of each pushed commit, not only the last one. A new push to a pull request
  cancels the old run of that pull request. A run on `main` is never cancelled. actionlint 1.7.12,
  fixed by SHA-256, checks the workflows with shellcheck.
- The ADR test in `architecture/adrs.md` is narrower (#173). Write an ADR only when the decision
  is hard to reverse, surprising to a new reader without the context, and the result of a real
  trade-off. Record a smaller decision in the map or in the pull request body. `write-adr` step 1
  links the test and does not restate it.
- Dependabot commit and pull request titles in dkstack start with `ci:`, so a short update title
  passes the title check (#154).
- `version-control/index.md` lists all 11 commit types that the title check allows and says that
  other types fail. A test compares the list with the title check (#154).
- `AGENTS.md` has one version rule: if your entry URL names a tag, read each dkstack raw URL on that
  tag in place of `v1`. `README.md` and `versioning/index.md` link the rule. `README.md` tells a
  consumer to run `npx skills update` after a release (#154).
- `ui/visual-verification.md` requires a screen reader or inspector pass of each changed control,
  uses all six WCAG A and AA axe tags, fails a web PASS on any WCAG A or AA axe violation, links the
  component states and says that a local path is not evidence (#154).
- `ui/accessibility.md` says that each WCAG 2.2 A and AA criterion applies and links the quick
  reference. It adds 1.3.4, 2.5.1, 2.5.2 and 2.5.4, and defines a primary touch control. `ui/forms.md`
  states the AA rules of 3.3.8 and 3.3.4 and marks the stricter sign-in rule as a dkstack rule (#154).
- `coding/dependencies.md` owns all supply chain rules in tool-neutral words, with four new rules: a
  lockfile install that fails on a mismatch, an audit on each pull request, an update check at least
  weekly and update titles that pass the title check. `bootstrap` step 7 links them, and step 1 adds
  `.gitattributes` with LF line endings (#154).

### Removed

- The agent roles and `workflow/roles.md` (#191). An agent does not get a role such as implementer,
  reviewer, architect, writer or coordinator. The task and the skills that triage selects tell the
  agent what to do. The kept rules moved. The author rule is in the Rules of
  `workflow/review-and-merge.md`: the author must not review, approve or merge their own pull
  request. The owner, the owner records with the relay rule, and the rule that the owner
  approves material scope changes and every release are in `workflow/safety.md`. The workflow flow
  and `review-spec` name no role.
  Consumer action: if your project links `workflow/roles.md`, link `workflow/safety.md#owner`
  or `workflow/review-and-merge.md#rules` in its place.

### Fixed

- Text from the pre-release audit of 1.6.0. `architecture/dry.md` links the stewardship
  trade-off and no longer says to extract each repeated idea. `coding/security.md` defines a secret
  once. `versioning/index.md` names the commit step as the last step that runs repository code, and
  links the release OK in `workflow/safety.md` and does not copy it. `code-review` links the
  unproven rule in `verify-claim` and does not copy it. `architecture/small-steps.md` no longer
  says that AGENTS.md asks for small commits. The Release workflow comment says that the app token
  does the writes. `triage`, `writing-check` and `stewardship.md` say "person" or "people", not "human".
- The coverage glob in `npm test` has no quotes. In `cmd.exe` the quotes stayed in the value, so
  no file matched and the coverage gate passed with no check (the Low on #242).
- `check-links` checks an HTML `href` in single quotes or with no quotes, not only one in double
  quotes (the Low on #233).
- The push title step in the validate workflow fails when `git log` fails. Before, the process
  substitution hid the error, and the step passed with no title checked (the Low on #190).
- The .NET MAUI theme example in `ui/accessibility.md` names `Application.RequestedTheme` to read
  the theme. `AppThemeBinding` only sets a value for each theme (#224).
- `check-links` closes five parser gaps (#232). It checks an HTML `<a href>`. It accepts `[self](./)`
  in a skill and a target with balanced parentheses. It ignores links in an indented code block,
  but not in an indented paragraph of a list. A repository URL on a ref with a slash, such as
  `blob/release/v1.5.0/...`, resolves.
- The scripts and tests work on a CRLF checkout, and each script can be imported (#206). A new
  `.gitattributes` checks out text with LF. `release.mjs` reads a CRLF CHANGELOG as LF, so
  `check-changelog` accepts a CRLF `## [Unreleased]` line again. The tests read files through one
  `readFile` helper that gives LF. Each script runs its main code only when `process.argv[1]` is
  the script, so an import from `node -e` no longer throws.
- The Release workflow fails early and cleans up on cancel (#180). `check-changelog` fails when
  CHANGELOG.md has no exact `## [Unreleased]` line or no `[Unreleased]:` compare link. A cancelled
  run closes the release pull request or tells how to finish the release, as a failed run does.
  The plan summary shows each commit title as code, so Markdown in a title has no effect. The
  approval message to Daniel has no semicolon.
- README.md and SECURITY.md describe the releases that exist (#209). README "Release status" links
  the latest release. README "Checks" lists each check of `validate`, says that only the release
  job uses the release app secrets, and names Node 24 or later. The ADR line names ADR 0001.
  SECURITY.md says that the latest release on `v1` is supported and that a fix ships as a PATCH
  release on `v1`. A test fails if the text from before the first release comes back.
- `check-links` checks anchors. A link to a Markdown file with `#anchor`, a pure `#anchor` and a
  repository URL with an anchor must match a heading or an HTML id in the target file. It also checks
  reference definitions, as in `[d]: file.md` (#154).
- The title check rejects an em dash (U+2014) and an en dash (U+2013) in a commit or pull request
  title (#154).
- `version-control/feature-branches.md` says to merge `main` into a branch and links review and
  merge. It no longer says to rebase, which conflicted with the rule that forbids a rebase of a pushed
  branch (#154).
- `check-workflows` fails on `secrets: inherit`, on the whole `secrets` context in an expression, on
  the `pull_request_target` and `workflow_run` triggers, on `${{ github.event.* }}` or `${{ inputs.*
  }}` in a `run:` script, and on a checkout step without `persist-credentials: false` (#154).

## [1.5.0] - 2026-11-19

### Added

- `ui/` guidelines (17 pages) and the `ui-design` and `ui-review` skills. `ui/accessibility.md` owns
  the WCAG 2.2 AA rules and thresholds. `ui/visual-verification.md` defines the minimum evidence
  and the PASS, FAIL and NOT RUN results. The defaults apply only when a project has no design
  system (#151).

### Changed

- `triage`, `plan-work`, `tdd-loop` and `code-review` link to the UI guidelines for rendered UI
  work. `code-review` maps UI findings to its severities. `write-pr` and the pull request template
  add a `Visual verification:` line for a rendered UI change. `tdd/ui-testing.md` links to
  `ui/accessibility.md` for the thresholds (#151).
- `coding/logging.md` requires a logging assessment for each change that adds or changes behavior.
  It has a level table with .NET and OpenTelemetry names, and rules for retries, fallbacks,
  expected rejections, log injection, correlation and failure ownership. Metrics and traces are
  out of scope (#149).
- `coding/security.md` defines personal data and the one exception for opaque IDs in logs. It
  says to log each failed sign-in and each denied access at Warning. It says what to log when no
  account matches, and to alert on a pattern, not on one event (#149).
- `plan-work` step 3 records the assessment in an `Observability:` entry for each increment.
  `write-pr` and the pull request template require an `Observability:` line in Evidence (#149).
- `code-review` gives a severity to each logging finding. `tdd-loop`, `tdd/test-design.md`,
  `tdd/test-isolation.md` and `coding/error-handling.md` link to the logging rules (#149).

## [1.4.0] - 2026-11-16

### Added

- Ten testing pages in `tdd/`. They are `red-green-refactor.md`, `test-design.md`, `test-isolation.md`,
  `test-levels.md`, `regression-testing.md`, `deterministic-tests.md`, `coverage.md`,
  `property-testing.md`, `performance-testing.md` and `legacy-code.md`. `tdd/index.md` lists them
  (#136).
- New testing rules. When you change or delete an assertion, state which requirement changed. Do
  not update a snapshot or golden file to make a test pass. Do not commit a focus marker. Do not
  commit a new skip without a linked issue. Do not mock a third-party API directly (#136).
- Four P1 testing pages in `tdd/`: `data-migration-testing.md`, `ui-testing.md`,
  `security-testing.md` and `test-suite-health.md`. `tdd/index.md` lists them.
  `coding/security.md` links to `tdd/security-testing.md` (#147).
- Keep the record of a security defect private. The rule is in `tdd/security-testing.md`.
  `tdd/regression-testing.md` links to it (#147).
- The linked issue for a new skip or quarantine must have an owner (#147).
- `coding/security.md`: where the project has static analysis or secret scanning, run them in CI
  as gates (#147).
- The `learn` skill: an adaptive tutor with five modes in one skill. The modes are Explore, Learn,
  Practice, Assess and Review (#142).
- Learning standards in `learning/`: principles, teaching, assessment, retention, progress and
  behavior scenarios. `README.md` and `skills/index.md` link to them (#142).
- A portable progress block for the `learn` skill. It is one YAML block with `schema_version: 1`
  and an `updated` date. The tutor returns it in the chat and never commits it to a repository (#142).

### Changed

- `tdd/index.md` keeps the purpose, the page list, the core principles and the boundaries. All
  other rules are on the topic pages, and each rule is on one page (#136).
- `coding/testing.md` is now a pointer to `tdd/`. Its rules moved to the `tdd/` pages. `tdd/test-design.md` now has
  the rule "Break the code on purpose once and make sure that a test fails". The rule does not
  change (#136).
- `skills/tdd-loop`: the steps and boundaries now match the `tdd/` pages. The refactor scope rule
  does not change (#136).
- Deviation rule: sometimes you cannot do a test-first red step. Then state the constraint and
  the verification that ran in the pull request. Do not call that work TDD. There is no owner approval
  step. Before this change, `tdd/index.md` and `skills/tdd-loop` said "Do not skip the failing
  step" with no exception (#136).
- Mechanical change: `tdd/index.md` defines it as a rename or a move by a tool, with no
  change in behavior. It does not need a failing test (#136).

## [1.3.1] - 2026-11-11

### Added

- The `Release` workflow. Daniel starts it on `main`. A read-only `plan` job shows the version in
  the run summary. After Daniel approves the `release` environment, the `release` job prepares the
  release in a pull request, merges the pull request when `validate` passes, creates the tag and
  the GitHub release, and fast-forwards `v1`. A breaking change stops it. It never force-pushes
  (#135).
- The `release` job does its writes with a token from the GitHub App of dkstack releases. The
  token is for dkstack only, with Contents, Pull requests and Workflows (write). The app is in no
  ruleset bypass list. `GITHUB_TOKEN` only reads. The secrets `RELEASE_APP_ID` and
  `RELEASE_APP_PRIVATE_KEY` are in the `release` environment. `scripts/check-workflows.mjs`
  lets only this job pass them to `actions/create-github-app-token` (#135).
- `scripts/release.mjs`: works out the next version, writes the plan summary, checks the `release`
  environment, moves the `[Unreleased]` notes to the new section, sets the `package.json` version
  and prints the release notes.

### Changed

- The release pull request gets the normal `pull_request` run of `validate`. If the run waits for
  approval, the `release` job writes the run link to the run summary and waits up to 15 minutes.
  Only Daniel approves the run. No agent and no job approves it. A failure before the merge closes
  the release pull request and deletes its branch.
- `versioning/index.md`: the release steps are now the `Release` workflow, with a one-time setup
  and the steps to finish a release by hand. `CONTRIBUTING.md` links them. ADR 0001 has an
  amendment.

## [1.3.0] - 2026-11-11

This minor release removes pages, skills and scripts by the owner's decision on 2026-11-11
(#127), as an exception to ADR 0001. See the
[amendment](docs/adr/0001-how-consumers-follow-versions.md#amendment-2026-11-11).

### Removed

- `workflow/work.md`: the work contract. The "Owner instructions in chat" section is now in
  `workflow/safety.md`. The issue to merge flow is in `workflow/index.md` and
  `workflow/review-and-merge.md`.
- `workflow/lifecycle.md`: the route from a request to a merge. Use the flow in
  `workflow/index.md` and the rules in `workflow/review-and-merge.md`.
- `workflow/claims.md`: claims, handoff and recovery. No replacement. The author rule in
  `workflow/roles.md` and the hard limits in `workflow/safety.md` still apply.
- `workflow/preflight.md` and `scripts/preflight.mjs`: the tracker preflight and the label
  catalog. No replacement. No label is deleted.
- `workflow/feature-plans.md`: the plan file in `.plans/`. Use the plan-work skill.
- `skills/map-work`: the multi pull request mapping skill. Use the plan-work skill. It plans the
  work as small reviewable increments in one issue and one pull request.
- `scripts/lifecycle.mjs`: the lifecycle router. No replacement. Only tests used it.
- `.plans/agent-claims.md`, `codebase-stewardship.md`, `map-work.md`, `preflight.md`,
  `release-skill.md`, `work-management.md` and `workflow-lifecycle.md`: stale plan files. No
  replacement.
- The tests for the removed pages, skills and scripts.

### Changed

- `skills/triage`: guidance only. Remove the Work route, the plan-work and map-work routing, the
  handoffs and the feature plan line. The owner instructions link points at `workflow/safety.md`.
- `skills/plan-work`: guidance only. Keep the goal, the acceptance criteria, small reviewable
  increments, tests first and a map from each criterion to a test or a check. The plan goes where
  the task asks: the issue, the pull request or the chat. Remove the `.plans/` file, the statuses,
  the claims and the handoff. Add step 7: before you report, compare the plan with the issue, the
  commits and the check results.
- `workflow/safety.md`: add the section "Owner instructions in chat", moved from
  `workflow/work.md`.
- `workflow/roles.md`: remove the role map with team names. The section "Role definitions"
  replaces it. It defines the implementer, the reviewer, the architect, the writer and the
  coordinator with no team names.
- `workflow/review-and-merge.md`: remove the escalation ladder. No replacement. Remove the
  sentences that said dependent work stays blocked. If a fact is missing, unverifiable or
  conflicting, do not treat the pull request as reviewed. Never backdate or fabricate review
  evidence.
- The external request issue template sets no label and does not forbid a split. The four
  fields stay.
- `skills/tdd-loop`, `skills/bootstrap`, `skills/apply-architecture`, `skills/clarify-intent` and
  `skills/code-review`: remove the links to the plan, claim, work and preflight pages. Remove
  bootstrap step 12, the tracker preflight. Remove the escalation sentence from code-review.
- `architecture/stewardship.md`: remove the link to `workflow/work.md`. The page still links
  `workflow/safety.md` and `workflow/roles.md`.
- `workflow/index.md`, `AGENTS.md`, `README.md` and `CONTRIBUTING.md`: remove the links and the
  wording for the removed pages.

### Added

- Tests that pin the moved owner instructions, the role definitions, the issue template fields
  and the removed skill hooks.

### Migration

- map-work: use plan-work. Plan the work as small reviewable increments in one issue and one
  pull request.
- Lifecycle and claims: follow the flow in `workflow/index.md` and the rules in
  `workflow/review-and-merge.md`, `workflow/roles.md` and `workflow/safety.md`. The docs no longer
  tell agents to write a claim or to set `status:`, `agent:` or `needs:` labels.
- Preflight: no replacement. Labels are kept. No label is deleted in any repository.
- Feature plans: use plan-work. Put the plan where the task asks. dkstack no longer reads
  `.plans/` files. Each project decides what to do with its own `.plans/` files.
- Links: when the owner moves `v1`, a raw `v1` URL to a removed page or skill stops resolving.
  Remove those links from your project. Change a link to
  `workflow/work.md#owner-instructions-in-chat` to `workflow/safety.md#owner-instructions-in-chat`.
  A pinned `AGENTS.md` that starts with the triage skill still resolves.

## [1.2.0] - 2026-11-04

### Added

- `workflow/roles.md`: define the human owner under its own heading. A bot or an agent that acts
  through the owner's account is always an agent. Add the relay rule: a relayed decision counts
  as the owner's words only when it quotes the owner's exact words with the time and the place.
  The agent records that quote in the issue or pull request before a later session relies on it.
- `workflow/work.md`: an agent may move an active issue to planning after a new prerequisite link
  to an issue that is not complete, or after a scope change that the owner recorded. The agent
  moves the issue before it writes `RELEASE`. `workflow/feature-plans.md` says how an item leaves
  `BLOCKED`.
- `skills/release`: a "When a piece is missing" section for no changelog entry, no rights to
  create a tag and no OK. Each one stops and reports.
- `skills/triage`: a Subagents section with a fallback that does the steps in order.
- Tests that pin the author never merges rule in `workflow/review-and-merge.md`,
  `workflow/roles.md` and `workflow/index.md`, and that an agent merge needs the independent
  reviewer. Tests that the work.md transition lists have exactly one active to planning item.

### Changed

- Restore the reviewer merge rule. The independent reviewer merges only the reviewed head. The
  author never merges. The human owner may merge a pull request after independent review and
  after all merge checks pass. That includes a pull request that the owner authored.
- `workflow/work.md`: restore the durable record of an owner instruction that a later session
  relies on. List the routine, reversible workflow defects that an agent may repair, and the
  actions that a repair never covers.
- `workflow/work.md`: a closed prerequisite is complete or not complete. The completion evidence
  is the source of the outcome. The tracker's close reason is a copy. If no source exists, fail
  closed.
- `skills/release`: apply the publish rule before the release steps.
- The external request issue template sets the `status:triage` label.

### Removed

- `skills/plan-work`: the `PR` field in the plan format.

### Fixed

- The lifecycle router prepares a mapped child with the parent mapping approval only when the
  child's eligibility is already agent. The approval never allows a merge.
- The lifecycle router stops triage with the reason `scope` unless the pull request count is
  a positive integer.

## [1.1.3] - 2026-11-01

### Changed

- Add a reviewed map-work path for owner-approved child additions to active parents. Keep the initial mapping path and parent lifecycle unchanged. Require the effective claim, preflight, duplicate checks, valid prerequisites and independent review.

- Allow the verified human owner to merge an authored pull request after independent review and
  all merge checks pass. Require explicit owner authorization for any agent merge. Preserve
  independent review, required checks, the reviewed head, squash merge and branch protection.

## [1.1.2] - 2026-11-01

### Changed

- Let agents complete authorized development tasks through PR creation without repeated approval.
  Repair routine issue metadata, retain independent review and required checks, and reserve merges
  and other restricted actions for explicit human-owner approval.

## [1.1.1] - 2026-11-01

### Added

- Post-map handoff checks require verified mapping review evidence during child preparation
  and implementation. Define owner-controlled chat authorization, durable instruction records,
  child promotion responsibilities and exceptional owner attestation for already-merged PRs
  without native review records. Normal independent review and merge gates remain in force.

- `workflow/claims.md`: define durable owner disposition and independent validation for
  malformed claim events. Preserve valid history and require owner recovery for ambiguous
  ownership. Include reconciliation outcomes and the netknife issue 3 example.

- `coding/brace-style.md`: prefer Allman braces where supported. Document Go and formatter
  exceptions, C# and clang-format settings, and CI enforcement. Bootstrap links the guideline
  and selects supported settings without weakening existing quality gates.

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

[Unreleased]: https://github.com/daniel-kindl/dkstack/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/daniel-kindl/dkstack/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/daniel-kindl/dkstack/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/daniel-kindl/dkstack/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/daniel-kindl/dkstack/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/daniel-kindl/dkstack/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/daniel-kindl/dkstack/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/daniel-kindl/dkstack/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/daniel-kindl/dkstack/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/daniel-kindl/dkstack/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/daniel-kindl/dkstack/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/daniel-kindl/dkstack/releases/tag/v1.0.0
