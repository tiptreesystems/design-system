"""Optional visual-tool regressions: python3 -m unittest discover -s tests -p test_icon_parity.py."""
import sys
from pathlib import Path
import unittest
from tempfile import TemporaryDirectory
from PIL import Image, ImageChops, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from icon_parity import compare, ink_support_gap


class InkSupportTests(unittest.TestCase):
    def test_rejects_invalid_catalog_and_truncated_sheets(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            for names in ["", "add\nadd\n"]:
                (root / "names.txt").write_text(names)
                with self.assertRaisesRegex(ValueError, "nonempty and unique"):
                    compare(root, swift=True)
            (root / "names.txt").write_text("add\n")
            (root / "native-names.txt").write_text("close\n")
            with self.assertRaisesRegex(ValueError, "catalogs differ"):
                compare(root, swift=True)
            (root / "native-names.txt").write_text("add\n")
            for kind in ["native", "web"]:
                Image.new("RGB", (16, 16)).save(root / f"{kind}-light-1x.png")
            with self.assertRaisesRegex(ValueError, "Unexpected contact-sheet size"):
                compare(root, swift=True)

    def test_rejects_missing_extra_displaced_and_thicker_geometry_in_both_themes(self):
        for background, ink in [(252, 27), (22, 240)]:
            base = Image.new("RGB", (80, 80), (background,) * 3)
            ImageDraw.Draw(base).line((40, 10, 40, 70), fill=(ink,) * 3, width=3)
            self.assertIsNone(ink_support_gap(base, base).getbbox())
            # One physical pixel of rasterizer support is tolerated.
            self.assertIsNone(ink_support_gap(ImageChops.offset(base, 1, 0), base).getbbox())
            shifted = ImageChops.offset(base, 2, 0)
            missing = Image.new("RGB", base.size, (background,) * 3)
            thicker = base.copy()
            ImageDraw.Draw(thicker).line((40, 10, 40, 70), fill=(ink,) * 3, width=7)
            extra = base.copy()
            ImageDraw.Draw(extra).rectangle((10, 10, 14, 14), fill=(ink,) * 3)
            self.assertIsNotNone(ink_support_gap(missing, base).getbbox())
            with self.assertRaisesRegex(ValueError, "Empty canonical"):
                ink_support_gap(base, missing)
            for candidate in [shifted, thicker, extra]:
                self.assertIsNotNone(ink_support_gap(candidate, base).getbbox())
                self.assertIsNotNone(ink_support_gap(base, candidate).getbbox())


if __name__ == "__main__":
    unittest.main()
