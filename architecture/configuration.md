# Configuration

Parameterize the application with external configuration.

Values that change between environments or over time go in configuration, not in code. For why
this keeps decisions reversible, see [reversibility.md](reversibility.md). For where to keep
configuration files, see [coding/practices.md](../coding/practices.md).

## Rules

- Read configuration through a small API. Do not read configuration all over the code.
- Validate configuration when the application loads it. Stop on a value that is not valid.
- Consider configuration as a service. The application gets values at runtime, and you change
  them without a new deployment. The service validates each change.
- Do not put secrets in code.
- Do not put secrets in configuration files under version control. Get secrets from a secret
  store or from the environment.

## Good example

One module loads and validates the configuration. Other code asks that module for a value.

```
config = load_config()
timeout = config.timeout()
```

## Bad example

Code in many places reads the environment directly, and a key is in the source.

```
timeout = env("TIMEOUT")
api_key = "sk-12345"
```

A change to a key name needs edits in many places. The secret is in the repository history.

Related: [reversibility.md](reversibility.md), [dry.md](dry.md),
[separation-of-concerns.md](separation-of-concerns.md).
