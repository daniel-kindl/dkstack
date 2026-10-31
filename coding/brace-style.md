# Brace style

Prefer Allman style where the language and formatter support it. Put each opening brace
on the next line. Align the closing brace with the opening brace.

```text
function example()
{
    work();
}
```

## Language and formatter exceptions

Keep code valid. Language syntax takes precedence over this preference.

- Go requires opening braces on the same line for functions and control statements because
  of semicolon insertion. Follow `gofmt`. See the [Go FAQ](https://go.dev/doc/faq#semicolons).
- If the project's formatter cannot produce Allman style, keep its supported style.
  Record the formatter and the reason in `AGENTS.md` or `CONTRIBUTING.md`.
- Languages without brace-delimited blocks do not need a brace setting.

Keep existing compiler and formatter gates enabled. Do not disable a gate or replace a
formatter only to change brace placement. Do not reformat unrelated code.

## Configuration and enforcement

EditorConfig has no standard brace-placement property. A comment records the preference;
it does not enforce it. Tool-specific properties work only when the selected tool supports
them. See [EditorConfig supported properties](https://editorconfig.org/#supported-properties).

For C# with a formatter that reads Roslyn settings, add this section to `.editorconfig`:

```ini
[*.cs]
csharp_new_line_before_open_brace = all
```

See [Microsoft's C# formatting options](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/style-rules/csharp-formatting-options#csharp_new_line_before_open_brace).

For C and C++ with clang-format, set this option in `.clang-format`:

```yaml
BreakBeforeBraces: Allman
```

Merge the option into the existing configuration. Disable supported options that keep short
blocks on one line if they prevent Allman placement. See [Clang's style options](https://clang.llvm.org/docs/ClangFormatStyleOptions.html#breakbeforebraces).

During bootstrap, select settings for the actual language and formatter. Run the formatter's
check mode in CI to enforce the configuration. An editor setting alone is not a CI gate.
If no supported setting exists, state that the preference is documentation only.
