"""Pure composition tests; Flask is intentionally not required."""

import unittest

from tiptree_ui.blueprint import compose, stylesheet_tags


class ComposeTests(unittest.TestCase):
    def test_composes_in_manifest_order(self):
        css, _ = compose(["button"])
        self.assertLess(css.index(":root {"), css.index(".tt-btn"))
        self.assertIn("[data-theme='dark']", css)

    def test_empty_component_list_is_valid(self):
        css, content_hash = compose([])
        self.assertNotIn(".tt-btn", css)
        self.assertEqual(len(content_hash), 64)

    def test_rejects_unknown_and_duplicate_components(self):
        with self.assertRaisesRegex(ValueError, "unknown component"):
            compose(["missing"])
        with self.assertRaisesRegex(ValueError, "duplicate component"):
            compose(["button", "button"])

    def test_hash_is_stable_and_changes_with_subset(self):
        first_css, first_hash = compose(["button"])
        second_css, second_hash = compose(["button"])
        _, empty_hash = compose([])
        self.assertEqual((first_css, first_hash), (second_css, second_hash))
        self.assertNotEqual(first_hash, empty_hash)

    def test_stylesheet_tag_recomputes_the_composition_url(self):
        _, content_hash = compose(["button"], "light-default")
        self.assertEqual(
            stylesheet_tags(["button"], "light-default"),
            f'<link rel="stylesheet" href="/tt-assets/{content_hash}/tt.css">',
        )


if __name__ == "__main__":
    unittest.main()
