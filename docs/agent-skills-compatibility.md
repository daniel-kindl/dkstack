# Agent Skills interoperability

DKSTACK follows the [Agent Skills specification](https://agentskills.io/specification).
Engineering rules and client-specific invocation policies remain separate.

## Validation layers

1. **Core specification:** run the reference validator against normalized skill metadata.
2. **DKSTACK policy:** `npm run check:skills` checks directory layout and invocation hints.
3. **Runtime behavior:** test skill selection and execution with real agents and evidence.

The source `SKILL.md` files include Claude-specific keys.
The reference format permits only its listed core fields.
`scripts/check-agent-skills-ref.py` removes only those known client keys in a temporary copy.
It then runs the upstream reference validator against every copy.
The source files remain unchanged.
This checks core format compatibility, not strict validation of the unmodified files.

### Reference validator setup

The Python reference library is a demonstration tool, not a production dependency.
Install it from the official repository at a pinned commit.
The CI uses commit `83021e2be457a9b6679148719c1f6074f0ad975e`.
It does not use the unrelated PyPI package named `skills-ref`.

The `validate` workflow installs it into an isolated Python virtual environment.
Then it runs `scripts/check-agent-skills-ref.py`.
The Python adapter also has a standard-library unittest suite.

## Client compatibility

`disable-model-invocation` and `user-invocable` are Claude-specific settings.
Codex has a separate `agents/openai.yaml` policy.
Other agents may ignore both.
Never rely on these metadata hints for authorization or security.

Each skill description must permit independent discovery.
`triage` still coordinates multi-domain tasks.
A simple request can activate a matching skill directly.

## Offline skill distribution

Source skill links use DKSTACK release URLs.
An ordinary `npx skills` installation still requires network access to open these links.

Build portable copies with local rule and skill dependencies:

```bash
node scripts/package-skills.mjs --out dist/agent-skills
node scripts/package-skills.mjs --out dist/offline-code-review code-review
```

The command creates one folder per selected skill.
Each folder contains the entrypoint, original optional resources, and rewritten references.
Recursive dependencies are placed in `references/dkstack/`.
The command rejects missing files, unsafe paths, symlinks, and existing output directories.
It stages the bundle before publishing it to the output folder.
Run it again in a new output directory to avoid overwriting existing artifacts.

Do not modify the generated references independently.
Keep the DKSTACK source repository as the only authoritative source.
Check the bundle with the reference validator before distributing it.
The generator resolves DKSTACK raw URLs and supported local file links.
External web links remain external and are not guaranteed offline.
Install the generated folders in the skill location supported by each client.
The command creates **directories**, not ZIP archives or published releases.

## Skill evaluation

`evals/skill-cases.json` defines 144 positive and negative cases for all 31 skills.
Cases include training and held-out validation prompts.
Descriptions must be evaluated with competing skills discoverable.

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
It must isolate each run and expose the appropriate available skills.

The adapter returns one JSON object on stdout.
It must include `activated_skills` as a string array and `evidence` as nonempty text.
An optional `assertion_results` array grades the assertions independently.
Graded entries have `text`, `passed`, and `evidence` properties.
When grading is present, `graded_by` must be `independent-llm`,
`deterministic`, or `human`.

The runner records each result and a `summary.json`.
It checks activation rates across at least three repetitions.
It marks incomplete runs `NOT_RUN`.
It marks unevaluated behavioral assertions `NOT_GRADED`.
A trigger PASS is not a behavioral quality pass.
The project does not ship an agent adapter or claim real model evaluations.
The caller supplies model access and independent grading.

See [skill evaluation cases](skill-evaluation-cases.md) for the testing rubric.

## Acceptance

- Repository format checks and unit tests pass.
- The pinned reference validator passes normalized metadata.
- All selected offline bundles contain the full dependency closure.
- Client-specific invocation rules remain unchanged.
- Regression scenarios pass against a real agent before recording behavioral success.
- Every unrun check is reported as NOT RUN.

## Sources

- https://agentskills.io/skill-creation/quickstart
- https://agentskills.io/specification
- https://agentskills.io/skill-creation/best-practices
- https://agentskills.io/skill-creation/optimizing-descriptions
- https://agentskills.io/skill-creation/evaluating-skills
- https://agentskills.io/client-implementation/adding-skills-support
