# dkstack

dkstack is a set of rules and skills for AI coding agents. Many repositories read these rules
from one place.

## Language

**Owner**:
The person who approves each change to dkstack and each release of it. The owner is Daniel
Kindl, who acts in person, or the owner's own words in a record. An agent that acts through the
owner's account is never the owner.
_Avoid_: human owner, maintainer

**Consumer**:
A repository whose `AGENTS.md` points to dkstack and follows its rules. dkstack itself is not a
consumer.
_Avoid_: consumer repository, project that points to dkstack

**Exception**:
A recorded difference from a dkstack rule. It names the dkstack rule, the project rule and the
reason.

**Suppression**:
A diagnostic that is switched off at the smallest scope, with a reason and the approval of a
reviewer who is not the author.

**Building block**:
A skill that does one job. One or more larger skills run it, and a task can also use it alone.
_Avoid_: block, sub-skill

**Quality gate**:
A check that a change must pass, for example a test, a warning that is an error or a coverage
threshold.

**Required check**:
A CI job that the code host must show as passing before a merge, for example `validate`. A
required check runs the quality gates.

**Owner record**:
A note on an issue or a pull request that keeps an owner instruction for a later session. It
quotes the owner's exact words.
