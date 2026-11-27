"""Tests for the Agent Skills reference-validator compatibility adapter."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "check-agent-skills-ref.py"
SPEC = importlib.util.spec_from_file_location("dkstack_ref_validator", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class NormalizeTests(unittest.TestCase):
    def test_strip_only_known_client_extensions(self):
        original = (
            "---\nname: test\ndescription: Test\n"
            "user-invocable: false\ndisable-model-invocation: true\n"
            "metadata:\n  team: test\n---\n# Content\n"
        )
        result = MODULE.normalize_frontmatter(original)
        self.assertNotIn("user-invocable", result)
        self.assertNotIn("disable-model-invocation", result)
        self.assertIn("metadata:\n  team: test", result)
        self.assertTrue(result.endswith("# Content\n"))

    def test_preserve_nested_keys_even_when_named_like_extension(self):
        result = MODULE.normalize_frontmatter(
            "---\nname: x\nmetadata:\n  user-invocable: opaque\n---\n"
        )
        self.assertIn("  user-invocable: opaque", result)

    def test_missing_frontmatter_rejected(self):
        with self.assertRaisesRegex(ValueError, "Missing YAML frontmatter"):
            MODULE.normalize_frontmatter("# No frontmatter")

    def test_missing_closing_delimiter_rejected(self):
        with self.assertRaisesRegex(ValueError, "Missing YAML closing delimiter"):
            MODULE.normalize_frontmatter("---\nname: x\n")

    def test_wrong_extension_type_rejected(self):
        with self.assertRaisesRegex(ValueError, "Invalid extension boolean"):
            MODULE.normalize_frontmatter("---\nuser-invocable: yes\n---\n")

    def test_reference_validator_called_for_every_folder(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("alpha", "beta"):
                folder = root / "skills" / name
                folder.mkdir(parents=True)
                (folder / "SKILL.md").write_text(
                    f"---\nname: {name}\ndescription: Test\n---\n"
                )
            seen = []
            def fake_validate(path):
                seen.append(path.name)
                return [] if path.name != "beta" else ["fake error"]
            errors = MODULE.check_all(root, fake_validate)
            self.assertEqual(seen, ["alpha", "beta"])
            self.assertEqual(len(errors), 1)
            self.assertIn("beta/SKILL.md", errors[0])

    def test_no_skills_is_error(self):
        with TemporaryDirectory() as tmp:
            self.assertEqual(MODULE.check_all(Path(tmp), lambda path: []),
                             ["No Agent Skills found"])


if __name__ == "__main__":
    unittest.main()
