# Small steps

This rule comes from the topic "Don't Outrun Your Headlights" (Topic 27) in The Pragmatic Programmer.

Take small steps. Get feedback after each step. Do not design for a future you cannot see.

Reason: feedback shows you where you are. A large step goes past what you can check, so errors grow before you see them.

## Rules

- Make each step small enough that one check can show if it is correct.
- Get feedback after each step: a test result, a check or a review.
- Do the next step only when the feedback is good.
- Do not design for requirements that you cannot see yet.

## Related rules

- The TDD loop gives feedback after each small step: [tdd/index.md](../tdd/index.md).
- Small commits and short-lived branches give feedback through review: [version-control/feature-branches.md](../version-control/feature-branches.md).
- The general rules in [AGENTS.md](../AGENTS.md) say to prefer the smallest change and to make small commits.
- YAGNI says not to build for future requirements: [yagni.md](yagni.md).

## Good example

You add a feature. You write one failing test, make it pass and run the checks. You open a small pull request and get a review. Then you start the next part.

## Bad example

You add a plugin system and three options for cases that nobody asked for. You write all the code before you run a test. The first review finds a wrong assumption in the base design.
