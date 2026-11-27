# Engineering agent evaluations

These scenarios test completed engineering outcomes, not only skill activation.
Skill activation checks are a separate suite.

## Contract

Each scenario supplies a broken module and independent oracle tests.
An agent receives the goal and a disposable copy of the `starter` directory.
The agent must not see the oracle source while solving the task.
Use the same agent, model, tools, time budget, and task prompt for both arms.

- Baseline arm: run without dkstack guidance.
- dkstack arm: run with the pinned dkstack version.
- Repeat each arm at least three times with a clean workspace.
- Keep model version, wall time, token use, attempts, and tool-call records.
- Report negative outcomes, unsupported claims, and unrun checks separately.
- Evaluate the same held-out tasks after improving the rules.

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
It kills the candidate with SIGKILL after 30 seconds.
No candidate process remains after the time limit.
It is NOT a security sandbox. Run it only inside a suitable external sandbox.
Do not pass a production checkout, secret-bearing environment, or untrusted host.

A scenario passes only when the broken starter fails its oracle and the candidate passes.
Store the JSON results for review.

Compare a baseline arm with a dkstack arm:

```bash
node scripts/engineering-evals.mjs compare <id> [--baseline <dir>] [--dkstack <dir>] [--execute-untrusted]
```

The command writes a JSON report to standard output.
The report has `starter_passed`, one record per arm, and `comparison`.
An arm status is PASS, FAIL or NOT_RUN.
The comparison is `DKSTACK_BETTER`, `BASELINE_BETTER`, `SAME` or `NOT_RUN`.
Standard error prints one line per arm, then a comparison line.
An arm with no candidate is NOT RUN, and then the comparison is NOT RUN.
A candidate also needs `--execute-untrusted`.
The command exits 0 when it writes the report.
It exits 1 on an error. A usage error exits 2.

Until a real agent runs, report the comparison as NOT RUN.
There is no isolated agent adapter yet.

## Acceptance

- Manifest paths exist and are not symlinks.
- The real path of each listed file stays inside the evaluation root.
- Each starter is broken and fails at least one independent test.
- A corrected implementation passes each scenario oracle.
- The evaluation remains independent of self-reported agent success.
- Live comparative results require actual isolated agent executions.
