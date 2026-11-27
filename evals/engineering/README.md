# Engineering agent evaluations

These scenarios test completed engineering outcomes, not only skill activation.
They complement the agent skill evaluation work in PR #384.

## Contract

Each scenario supplies an intentionally broken module and independent oracle tests.
An agent receives the goal and a disposable copy of the `starter` directory.
The agent must not see the oracle source while solving the task.
Use the same agent, model, tools, time budget, and task prompt for both arms.

- Baseline arm: run without DKSTACK guidance.
- Treatment arm: run with the pinned DKSTACK version.
- Repeat each arm at least three times with clean workspace and independent seeds.
- Keep model version, wall time, token use, attempts, and tool-call records.
- Report negative outcomes, unsupported claims, and unrun checks separately.
- Evaluate the same held-out tasks after improving the rules.

## Commands

Check the scenario manifest without running fixture code:

```bash
node evals/engineering/run.mjs check
node evals/engineering/run.mjs list
```

Grade a candidate after isolating it in a disposable, network-restricted sandbox:

```bash
node evals/engineering/run.mjs grade framed-transport /sandbox/agent-output --execute-untrusted
```

This command executes the candidate code through a child Node.js process.
The runner strips common environment secrets and sets a time limit.
It is NOT a security sandbox. Run it only inside a suitable external sandbox.
Do not pass a production checkout, secret-bearing environment, or untrusted host.

A scenario passes only when the broken starter fails its oracle and the candidate passes.
Store the JSON results for review. The baseline and treatment comparisons are manual
until a trusted isolated agent adapter is available. The included tests do not imply
any real agent improved. Report those runs as NOT RUN until executed.

## Acceptance

- Manifest paths exist and contain no symlink entries at the listed paths.
- Each starter is intentionally broken and fails at least one independent test.
- A corrected implementation passes each scenario oracle.
- The evaluation remains independent of self-reported agent success.
- Live comparative results require actual isolated agent executions.
