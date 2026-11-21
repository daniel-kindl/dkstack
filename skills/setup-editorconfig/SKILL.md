---
name: setup-editorconfig
description: "Use when a repository has no .editorconfig or .gitattributes, or has loose settings. One block of bootstrap. Sets strict editor settings, the brace style and LF line endings."
user-invocable: false
---

# Set up editor settings

A building block of [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md). Use it alone, or as a step of bootstrap. Do not weaken an existing quality gate. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).

## Steps

1. Add or update `.editorconfig` with strict settings:
   - `root = true`
   - `charset = utf-8`
   - `end_of_line = lf`
   - `indent_style = space`
   - `trim_trailing_whitespace = true`
   - `insert_final_newline = true`
   - Language-specific indent sizes as needed
   - `trim_trailing_whitespace = false` for Markdown
   - Follow [brace style](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/brace-style.md).
     For C# tools that read Roslyn settings, add `[*.cs]` with
     `csharp_new_line_before_open_brace = all`. For C and C++ with clang-format, merge
     `BreakBeforeBraces: Allman` into `.clang-format`. Check the result with the selected
     formatter and enforce it in CI. Keep Go on `gofmt` and use the documented exceptions.
     EditorConfig has no standard brace-placement property. If the tool has no supported
     setting, record the preference as documentation only. Keep existing quality gates.
   - Also add `.gitattributes` with `* text=auto eol=lf`, so that each checkout has LF line
     endings. `end_of_line` in `.editorconfig` does not change the files that Git checks out.
