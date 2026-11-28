# Engineering agent evaluations

These scenarios test completed engineering outcomes, not only skill activation.
Skill activation checks are a separate suite in [skill evaluation cases](../../docs/skill-evaluation-cases.md).

## Contract

Each scenario supplies a broken module and independent oracle tests.
An agent receives the goal and a disposable copy of the `starter` directory.
The agent must not see the oracle source while solving the task.
Use the same agent, model, tools, time budget, and task prompt for both arms.

- Baseline arm: run without dkstack guidance.
- dkstack arm: run with the pinned dkstack version.
- Run each candidate in a clean workspace.
- Keep model version, wall time, token use, attempts, and tool-call records.
- Report negative outcomes, unsupported claims, and unrun checks separately.
- Evaluate the same held-out tasks after improving the rules.

## Scenarios

Each scenario below names the coding page that owns its rule.

- `framed-transport` parses length-prefixed frames across network chunks. See [networking](../../coding/networking.md).
- `retry-idempotency` retries transient work with a stable identity and a bound on attempts. See [reliability](../../coding/reliability.md).
- `async-cancellation` passes a cancellation signal and stops further work after abort. See [concurrency practices](../../coding/concurrency-practices.md).

## Commands

Check the scenario manifest without running fixture code:

```bash
node scripts/engineering-evals.mjs check
node scripts/engineering-evals.mjs list
```

Grade a candidate after isolating it in a disposable, network-restricted sandbox:

```bash
node scripts/engineering-evals.mjs grade framed-transport /sandbox/agent-output --execute-untrusted
```

This command executes the candidate code through a child Node.js process.
The runner passes only `PATH` and `DKSTACK_CANDIDATE_ROOT` to the child process.
The runner starts the oracle in its own process group.
It sends SIGKILL to that group at the 30-second time limit, and when the oracle exits.
This stops every process that remains in the group.
A candidate that starts its own session or process group can outlive the time limit.
The runner is not a security sandbox.
Run untrusted candidates only inside a suitable external sandbox.
Do not pass a production checkout, secret-bearing environment, or untrusted host.

A scenario passes only when the broken starter fails its oracle and the candidate passes.
Store the JSON results for review.

Compare a baseline arm with a dkstack arm:

```bash
node scripts/engineering-evals.mjs compare <id> [--baseline <dir>] [--dkstack <dir>] [--execute-untrusted]
```

The command writes a JSON report to standard output.
The report has `starter_passed`, one record per arm, and `comparison`.
Compare grades one candidate per arm. That is one graded run per arm.
An arm status is PASS, FAIL or NOT_RUN.
The comparison is `DKSTACK_BETTER`, `BASELINE_BETTER`, `SAME`, `NOT_RUN` or `INVALID_STARTER`.
Standard error prints one line per arm, then a comparison line.
An arm with no candidate is NOT RUN, and then the comparison is NOT RUN.
When the starter already passes its oracle, no arm runs.
Each arm is then NOT RUN, and the comparison is INVALID_STARTER.
The command prints a scenario error.
A candidate also needs `--execute-untrusted`.
The command exits 0 after a valid comparison, including NOT RUN.
It exits 1 for an invalid starter, or on another error.
A usage error exits 2.

Until a real agent runs, report the comparison as NOT RUN.
There is no isolated agent adapter yet.

## Acceptance

- Manifest paths exist and are not symlinks.
- The real path of each listed file stays inside the evaluation root.
- Each starter is broken and fails at least one independent test.
- A corrected implementation passes each scenario oracle.
- The evaluation remains independent of self-reported agent success.
- Live comparative results require actual isolated agent executions.
