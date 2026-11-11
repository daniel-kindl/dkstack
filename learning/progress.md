# Optional progress

Track progress in the current conversation when useful. The learner does not need a file, a repository, an account or a database.

Export only on request. Return a portable Markdown block that can be copied into a new session or saved as a file by a tool when the learner authorizes that action.

## State fields

Use a Markdown document with the following readable fields. Do not require machine parsing.

- **schema_version**: `1`.
- **topic** and **goal**.
- **mode**: Explore, Learn, Practice, Assess or Review.
- **concepts**: Name, estimated level or unknown, evidence and any assistance.
- **misconceptions**: Only observed misconceptions, with corrections if known.
- **review**: Concepts to revisit and optional suggested timing.
- **next**: The next action.

Example state:

```yaml
schema_version: 1
topic: Basic probability
goal: Solve unfamiliar probability problems
mode: Learn
concepts:
  - name: Independent events
    level: 2
    evidence:
      - "Explained the difference in own words"
    assistance: none
misconceptions:
  - "Confused independent and mutually exclusive events"
review:
  - "Independent events"
next: "Apply the rule to an unfamiliar example"
```

The example is fictional. Never use it as evidence of a real learner's progress.

## Resume

Accept a pasted state block or a readable equivalent. Check for contradictions and missing fields. Keep missing evidence unknown. Restore the topic and next step without a repeated diagnostic unless the state is stale, unclear or the learner requests one.

Do not store sensitive personal details or copy entire conversations into exported progress. Do not claim automatic cross-session memory.
