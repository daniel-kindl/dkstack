#!/usr/bin/env python3
"""Check core Agent Skills conformance while preserving client extension fields.

The reference validator accepts only fields from the standard. DKSTACK also
ships Claude-specific invocation hints. Normalize those hints in a temporary
copy before calling the official validator. Policy checks remain separate.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import sys

EXTENSIONS = {"user-invocable", "disable-model-invocation"}


def normalize_frontmatter(content: str) -> str:
    lines = content.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        raise ValueError("Missing YAML frontmatter")
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        raise ValueError("Missing YAML closing delimiter")
    for line in lines[1:end]:
        if line.startswith((" ", "\t")):
            continue
        key = line.split(":", 1)[0].strip()
        if key in EXTENSIONS:
            value = line.partition(":")[2].strip()
            if value not in ("true", "false"):
                raise ValueError(f"Invalid extension boolean: {key}")
    filtered = [lines[0]]
    filtered += [line for line in lines[1:end]
                 if line.split(":", 1)[0].strip() not in EXTENSIONS
                 or line.startswith((" ", "\t"))]
    filtered += lines[end:]
    return "".join(filtered)


def check_all(root: Path, validate_function) -> list[str]:
    errors: list[str] = []
    skills = sorted((root / "skills").glob("*/SKILL.md"))
    if not skills:
        return ["No Agent Skills found"]
    with TemporaryDirectory(prefix="dkstack-ref-") as temp:
        for path in skills:
            target = Path(temp) / path.parent.name
            target.mkdir()
            try:
                content = normalize_frontmatter(path.read_text(encoding="utf-8"))
                (target / "SKILL.md").write_text(content, encoding="utf-8")
                errors += [f"{path}: {message}" for message in validate_function(target)]
            except (OSError, ValueError) as error:
                errors.append(f"{path}: {error}")
    return errors


def main() -> int:
    try:
        from skills_ref import validate
    except ImportError:
        print("NOT RUN: the official skills-ref is not installed. Install it from the pinned upstream commit.", file=sys.stderr)
        return 2
    root = Path(__file__).resolve().parents[1]
    errors = check_all(root, validate)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("All DKSTACK skills pass core Agent Skills reference validation")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
