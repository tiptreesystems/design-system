"""Compare native icon sheets against canonical browser SVGs (optional Pillow gate)."""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageStat


def compare(directory, *, swift=False):
    directory = Path(directory)
    names = (directory / "names.txt").read_text().splitlines()
    if not names or len(names) != len(set(names)):
        raise ValueError("Canonical icon names must be nonempty and unique")
    if (directory / "native-names.txt").read_text().splitlines() != names:
        raise ValueError("Native and canonical icon catalogs differ")
    results = []
    for theme in ("light", "dark"):
        for density in (1, 2):
            native = Image.open(directory / f"native-{theme}-{density}x.png").convert("RGB")
            web = Image.open(directory / f"web-{theme}-{density}x.png").convert("RGB")
            if native.size != web.size:
                raise ValueError(f"Canvas mismatch: {native.size} != {web.size}")
            expected = (1008 * density, ((len(names) + 5) // 6) * 56 * density)
            if native.size != expected:
                raise ValueError(f"Unexpected contact-sheet size: {native.size} != {expected}")
            difference = ImageChops.difference(native, web)
            difference.save(directory / f"difference-{theme}-{density}x.png")
            support_gap = ink_support_gap(native, web) if swift else None
            for index, name in enumerate(names):
                for variant, size in enumerate((16, 20, 40)):
                    left = ((index % 6) * 3 + variant) * 56 * density + (56 - size) * density // 2
                    top = (index // 6) * 56 * density + (56 - size) * density // 2
                    bounds = (left, top, left + size * density, top + size * density)
                    error = sum(ImageStat.Stat(difference.crop(bounds)).mean) / (3 * 255)
                    # Apple and Skia rasterize small curves/caps differently. Swift
                    # requires BOTH bounded color error AND bidirectional ink support
                    # within one physical pixel. Keep the Android 2% gate unchanged.
                    limit = (0.05 if size <= 20 else 0.025 if density == 1 else 0.02) if swift else 0.02
                    gap = support_gap.crop(bounds).getbbox() is not None if swift else False
                    results.append(dict(glyph=name, theme=theme, density=density, size=size,
                                        mean_rgb_error=error,
                                        **({"limit": limit, "ink_outside_one_pixel": gap} if swift else {}),
                                        passed=error <= limit and not gap))
    report = dict(comparisons=len(results), failed=sum(not row["passed"] for row in results),
                  worst=sorted(results, key=lambda row: row["mean_rgb_error"], reverse=True)[:20])
    if swift:
        report["profile"] = "swift: 5% at 16/20pt, 2.5% at 40pt/1x, 2% at 40pt/2x; ink support within 1px"
        report["ink_support_failures"] = sum(row["ink_outside_one_pixel"] for row in results)
    (directory / "comparison.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def ink_support_gap(native, web):
    """Find visible ink farther than one raster pixel from the other renderer.

    25% coverage includes thin antialiased details without treating rounding noise
    as geometry. Colors are measured from the canonical sheet, not hardcoded.
    Both missing and extra ink fail; a color-error allowance cannot hide drift.
    """
    reference = web.convert("L")
    background = reference.getpixel((0, 0))
    extremes = reference.getextrema()
    foreground = max(extremes, key=lambda value: abs(value - background))
    if foreground == background:
        raise ValueError("Empty canonical icon sheet")
    threshold = background + (foreground - background) * 0.25
    def mask(image):
        return image.convert("L").point(lambda value: 255 if (
            value < threshold if foreground < background else value > threshold
        ) else 0)
    a, b = mask(native), mask(web)
    return ImageChops.lighter(
        ImageChops.subtract(a, b.filter(ImageFilter.MaxFilter(3))),
        ImageChops.subtract(b, a.filter(ImageFilter.MaxFilter(3))),
    )
