# Time and dates

Keep an instant in UTC. Keep the time zone of a civil time. Get the time from a clock that tests
can control.

Apply this page to production code. For time in tests, see
[tdd/deterministic-tests.md](../tdd/deterministic-tests.md).

## Rules

- Store and send an instant in UTC, for example a log time or the time of a payment. Use RFC 3339
  text with an offset, for example `2026-11-25T14:30:00Z`. Reason: one instant has one value in
  each system, and the text sorts in time order.
- Convert an instant to local time only to show it to a person. Format it for the user's locale.
  See [content and localization](../ui/content-and-localization.md).
- Store a future civil time with its IANA time zone ID, for example `Europe/Prague`, not only with
  an offset. Examples are a meeting or the time a shop opens. Reason: the offset of a zone changes
  with daylight saving time and with the law. The ID gives the right offset at that date.
- Do not read the system clock in domain code. Give the code a clock, for example `TimeProvider`
  in .NET or `java.time.Clock` in Java, or a function that returns the current time. Reason: a
  test can then set the time. See [tdd/deterministic-tests.md](../tdd/deterministic-tests.md).
- Measure a duration with a monotonic clock, for example `performance.now()` in JavaScript,
  `time.monotonic()` in Python or `Stopwatch` in .NET. Reason: the wall clock can jump forward
  or back when the system sets the time.
- Use the date and time library of the platform for calendar arithmetic and parsing. Do not add
  `86400` seconds for "one day" and do not parse dates with your own code. Reason: a day in a
  zone with daylight saving time can have 23 or 25 hours.

## Good example

A booking service stores `startsAt: "2027-03-28T09:00"` with `zone: "Europe/Prague"`. The
reminder job gets a clock. It computes the instant with the time zone library at the time of the
reminder. A test sets the clock to the night of the daylight saving change and checks the
reminder time.

## Bad example

A booking service stores the start as `2027-03-28T09:00+01:00`. The clocks in Prague change to
`+02:00` that night. The reminder comes one hour late. The job calls `new Date()` directly, so no
test can set the time to that night.

Related: [configuration](../architecture/configuration.md).
