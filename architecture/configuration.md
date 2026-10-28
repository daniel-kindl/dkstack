# Configuration

Set application values with external configuration.

Put values that change between environments or over time in configuration, not in code. Configuration keeps decisions reversible. See [reversibility.md](reversibility.md). For where to keep configuration files, see [coding/practices.md](../coding/practices.md).

## Rules

- Read configuration through a small API. Do not read configuration in many places in the code.
- Validate configuration when the application loads it. Stop on a value that is not valid.
- Consider a configuration service. The application gets values at runtime, and you change them without a new deployment. Make the service validate each change.
- Do not put secrets in code.
- Do not put secrets in configuration files under version control. Get secrets from a secret store or from the environment.

## Good example

One module loads and validates the configuration. Other code asks that module for a value.

```
config = load_config()
timeout = config.timeout()
```

## Bad example

Code in many places reads the environment directly, and a secret is in the source.

```
timeout = env("TIMEOUT")
api_key = "sk-12345"
```

A change to a key name needs edits in many places. The secret is in the repository history.

Related: [reversibility.md](reversibility.md), [dry.md](dry.md), [separation-of-concerns.md](separation-of-concerns.md).
