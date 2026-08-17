"""Pure composition tests; Flask is intentionally not required."""

import unittest

from tiptree_ui.blueprint import compose, stylesheet_tags


class ComposeTests(unittest.TestCase):
    def test_composes_published_tokens_and_theme(self):
        css, _ = compose([])
        self.assertIn(":root {", css)
        self.assertIn("[data-theme='dark']", css)
        self.assertNotIn(".tt-btn", css)

    def test_empty_component_list_is_valid(self):
        css, content_hash = compose([])
        self.assertNotIn(".tt-btn", css)
        self.assertEqual(len(content_hash), 64)

    def test_rejects_unknown_components(self):
        with self.assertRaisesRegex(ValueError, "unknown component"):
            compose(["missing"])

    def test_hash_is_stable_and_changes_with_theme(self):
        first_css, first_hash = compose([], "light-default")
        second_css, second_hash = compose([], "light-default")
        _, dark_hash = compose([], "dark-default")
        self.assertEqual((first_css, first_hash), (second_css, second_hash))
        self.assertNotEqual(first_hash, dark_hash)

    def test_stylesheet_tag_recomputes_the_composition_url(self):
        _, content_hash = compose([], "light-default")
        self.assertEqual(
            stylesheet_tags([], "light-default"),
            f'<link rel="stylesheet" href="/tt-assets/{content_hash}/tt.css">',
        )


if __name__ == "__main__":
    unittest.main()
