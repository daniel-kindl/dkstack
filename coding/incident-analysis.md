# Incident analysis

Use this page for outages, corrupt state, security incidents and severe regressions. An incident
does not give permission to deploy or to change infrastructure.

## During the incident

- Find the impact, the affected versions, the start time and the current evidence.
- Preserve the relevant logs and timestamps. Do not collect credentials or personal data.
- Diagnose with read-only actions first.
- Some mitigations are owner-only: a production deploy or redeploy, a rollback, a release, a
  production migration, and a change to production settings or infrastructure. Do not start one.
  Stop and ask the owner, and give the evidence. See [safety](../workflow/safety.md#rules).
- Keep a mitigation that reduces the impact apart from a verified fix of the root cause.
- Record each action, its authorization, its result and the open questions.

## After containment

This section owns the failure analysis after an incident.

- Build a timeline from confirmed events and source references.
- Find the trigger, the cause and the conditions that helped the failure.
- Find the missed detection, the gaps in tests and the weak points in recovery.
- Create follow-up issues for the corrective actions, with acceptance criteria that you can measure.
- Make sure that you can detect the incident and recover safely next time.

Do not blame a person from incomplete evidence. Never invent a timeline. Never say that a
mitigation ran when it did not.

See [debugging](debugging.md), [logging](logging.md) and [safety](../workflow/safety.md).
