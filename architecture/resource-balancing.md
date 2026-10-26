# Resource balancing

If you acquire a resource, you must release it.

Pair every acquisition with a release. Do not leave resources open.

Ensure release happens even when an error occurs.

## Rules

- Acquire a resource only when you need it.
- Release the resource as soon as you finish with it.
- Place the release in a path that always runs, including error paths.
- Do not rely on the caller to release a resource you acquired.
- Prefer scopes or constructs that guarantee release.
- Do not acquire a resource you do not use.

## Good example

An operation that needs a temporary resource.

```
acquire resource
use resource
release resource
```

The release is paired with the acquisition. The resource does not stay open after the operation.

## Bad example

An operation acquires a resource and returns without releasing it on some paths.

```
acquire resource
if error
  return
use resource
release resource
```

On the error path the resource is never released. The resource leaks.

## Another good example

A construct that ties the lifetime of the resource to a scope. When the scope ends, the resource is released automatically, even if an error occurs.

```
with resource
  use resource
// resource is released here, success or failure
```

## Another bad example

Multiple places acquire the same kind of resource. Release logic is scattered and easy to miss on new paths.

A new error path is added later. The release is forgotten. The resource leaks under that condition.
