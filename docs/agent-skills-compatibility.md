# Agent Skills interoperability

dkstack follows the [Agent Skills specification](https://agentskills.io/specification).
Engineering rules and client-specific invocation policies stay separate.

## Validation layers

1. **Core specification:** run the reference validator against normalized skill metadata.
2. **dkstack policy:** `npm run check:skills` checks directory layout and invocation hints.
3. **Runtime behavior:** test skill selection and execution with real agents and evidence.

The source `SKILL.md` files include Claude-specific keys.
The reference format permits only its listed core fields.
`scripts/check-agent-skills-ref.py` removes only those known client keys in a temporary copy.
It then runs the upstream reference validator against every copy.
The source files stay unchanged.
This checks core format compatibility, not strict validation of the unmodified files.

### Reference validator setup

The Python reference library is a demonstration tool, not a production dependency.
Install it from the official repository at a pinned commit.
The CI uses commit `83021e2be457a9b6679148719c1f6074f0ad975e`.
It does not use the unrelated PyPI package named `skills-ref`.

Run the reference check with `npm run validate:skills-ref`.
It runs the Python adapter tests, then `scripts/check-agent-skills-ref.py`.
It needs Python 3 and the pinned skills-ref.
Without skills-ref, it prints NOT RUN and exits with code 2.
`npm run check` does not run it.

The `validate` workflow makes an isolated Python virtual environment.
It installs the packages in `.github/skills-ref-requirements.txt`, with exact versions and hashes.
Then it installs skills-ref at the pinned commit and runs `npm run validate:skills-ref`.

## Client compatibility

The invocation keys are client hints. See [invocation](../skills/index.md#invocation).
Never rely on these metadata hints for authorization or security.

Each skill description must permit independent discovery.
`triage` still coordinates multi-domain tasks.
A simple request can activate a matching skill directly.

## Offline skill distribution

Source skill links use dkstack release URLs.
An ordinary `npx skills` installation still requires network access to open these links.

Build portable copies with local rule and skill dependencies:

```bash
node scripts/package-skills.mjs --out dist/agent-skills
node scripts/package-skills.mjs --out dist/offline-code-review code-review
```

The command creates one folder for each selected skill.
Each folder contains the entrypoint, original optional resources, and rewritten references.
The command puts each recursive dependency in `references/dkstack/`.
Each folder also gets `dkstack-source.json` with the source commit and its refs.
The command rejects missing files, unsafe paths, and symlinks.
The output folder must be inside the dkstack checkout, and not the checkout root.
The command stages the bundle before it moves the bundle to the output folder.
A new run replaces an output folder that an earlier run made.
The command refuses any other existing output folder.

If HEAD is not `v1` or a `vX.Y.Z` tag, the command shows a warning.
The bundle can then contain rules that are not released.

Do not change the generated references by hand.
Change the rules only in the dkstack source repository.
Check the bundle with the reference validator before you distribute it.
The generator resolves dkstack raw URLs and supported local file links.
External web links stay external. They need network access.
Install the generated folders in the skill location that each client supports.
The command creates **directories**, not ZIP archives or published releases.

## Skill evaluation

`evals/skill-cases.json` defines positive and negative cases for each skill.
Cases include training and held-out validation prompts.
Evaluate each description while the other skills are available.

Validate the manifest with:

```bash
npm run check:skill-evals
```

Run it with a trusted agent adapter:

```bash
node scripts/skill-evals.mjs run --adapter ./my-agent-adapter --out dist/eval-results --runs 3
```

The adapter must be an executable program.
It receives one JSON request on stdin.
Required request properties are `case_id`, `skill`, `query`, `mode`, and `iteration`.
The `mode` is `with_skill` or `without_skill`.
It must isolate each run and give the agent only the skills for that mode.

The adapter returns one JSON object on stdout.
It must include `activated_skills` as a string array and `evidence` as nonempty text.
An optional `assertion_results` array grades the assertions independently.
Graded entries have `text`, `passed`, and `evidence` properties.
When grading is present, `graded_by` must be `independent-llm`,
`deterministic`, or `human`.

The runner records each result and a `summary.json`.
It checks activation rates across at least three repetitions.
It marks an incomplete run NOT RUN. The JSON value is `NOT_RUN`.
It marks unevaluated behavioral assertions `NOT_GRADED`.
A trigger result other than PASS, or a failed assertion, makes the command exit with code 1.
A trigger PASS is not a behavioral quality pass.
The project does not ship an agent adapter or claim real model evaluations.
The caller supplies model access and independent grading.

See [skill evaluation cases](skill-evaluation-cases.md) for the testing rubric.

## Acceptance

- Repository format checks and unit tests pass.
- The pinned reference validator passes normalized metadata.
- All selected offline bundles contain the full dependency closure.
- Client-specific invocation rules stay unchanged.
- Regression scenarios pass against a real agent before recording behavioral success.
- Report each check that did not run as the [quality gates](../coding/quality-gates.md) page says.

## Sources

- https://agentskills.io/skill-creation/quickstart
- https://agentskills.io/specification
- https://agentskills.io/skill-creation/best-practices
- https://agentskills.io/skill-creation/optimizing-descriptions
- https://agentskills.io/skill-creation/evaluating-skills
- https://agentskills.io/client-implementation/adding-skills-support
