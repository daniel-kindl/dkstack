# Incident analysis

Use this guidance for outages, corrupt state, security incidents, and severe regressions. Do not equate an incident review with permission to deploy or change infrastructure.

## During the incident

- Establish the impact, affected versions, start time, and current evidence.
- Preserve relevant logs and timestamps without collecting credentials or personal data.
- Prefer read-only diagnosis. Escalate owner-only mitigations to the owner.
- Separate a mitigation that reduces impact from a verified root-cause fix.
- Track each action, its authorization, its result, and open uncertainties.

## After containment

- Build a timeline using confirmed events and source references.
- Distinguish triggering event, underlying cause, and contributing conditions.
- Identify missed detection, gaps in tests, and recovery weaknesses.
- Create follow-up issues for corrective actions with measurable acceptance criteria.
- Verify that the incident can be detected and safely recovered from next time.

Avoid assigning blame from incomplete evidence. Never fabricate a timeline or claim a mitigation ran when it did not.

See [debugging](debugging.md), [logging](logging.md), and [workflow safety](../workflow/safety.md).
