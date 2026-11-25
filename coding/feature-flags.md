# Feature flags

A feature flag turns a code path on or off at run time. A flag is temporary. Remove it when its
job is done.

Use a flag to merge work that is not finished, or to roll out a change to a part of the users
first. Apply this page to each flag that you add or change.

## Rules

- Give each flag an owner and a linked issue that removes it. Write the issue number beside the
  flag definition. Reason: a flag with no owner stays in the code after nobody remembers why.
- Name the flag for the behavior that it turns on, for example `newCheckoutFlow`. See
  [naming.md](naming.md).
- Test each state of the flag that can reach production. Reason: the path that is off today is
  on tomorrow, and the change of state must not break the code.
- Give each flag a safe default. The safe default is the state that is correct for users now. For
  a flag in rollout it is off. When the full rollout is done, change the default to on, and then
  remove the flag. When the source of the flag is not available, the code uses the default. It
  logs the failure once. Reason: an outage of the flag service must not turn on code that is not
  finished. It must not turn off code that all users already use.
- Remove the flag after the full rollout. Remove the dead path and its tests in the same change.
  Reason: each flag doubles the number of paths that a reader must understand.
- Do not nest a flag in the path of another flag. Reason: two nested flags give four paths, and
  some of them are never tested.
- A flag is not configuration and not a permission. A flag is temporary and has a removal issue.
  Configuration stays for the life of the product. Put a value that differs between
  environments in configuration. See
  [architecture/configuration.md](../architecture/configuration.md). Check what a user may do
  with the permission model of the product. Reason: a permission that is a flag has no audit and
  is removed with the flag.
- A long-lived operations switch, for example a switch that turns off an expensive feature during
  an incident, is configuration. Document it as configuration, not as a flag.

## Good example

The flag `newCheckoutFlow` has the owner `payments` and the comment `Remove: #412`. Its default
is off. Tests run the checkout with the flag on and off. After the rollout to all users, the
default changes to on. Then one pull request removes the flag, the old flow and the old tests, and
closes #412.

## Bad example

The flag `beta2` has no owner and no issue. It was turned on for all users a year ago. The old
path is still in the code, and nobody tests it. A second flag inside the new path turns on a
discount for staff. The default of `beta2` is still off. When the flag service is down, all users
see the old checkout. It no longer works with the new prices.

Related: [reversibility](../architecture/reversibility.md),
[small steps](../architecture/small-steps.md).
