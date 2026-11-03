#!/usr/bin/env python3
"""Compare native Compose renders with Chromium SVGs. Requires Pillow for this optional visual gate."""
import json
from pathlib import Path
import shutil
import sys
from PIL import Image, ImageChops, ImageStat

directory = Path(sys.argv[1])
if len(sys.argv) > 2:
    # AGP collects PlatformTestStorage files before uninstalling the test APK.
    collected = Path(sys.argv[2])
    for filename in [f"native-{theme}-{density}x.png" for theme in ("light", "dark") for density in (1, 2)] + ["native-names.txt"]:
        matches = list(collected.rglob(filename))
        if len(matches) != 1:
            raise SystemExit(f"Expected exactly one collected {filename}; found {len(matches)}")
        shutil.copyfile(matches[0], directory / filename)
names = (directory / "names.txt").read_text().splitlines()
if (directory / "native-names.txt").read_text().splitlines() != names:
    raise SystemExit("Native and canonical icon catalogs differ")
results = []
for theme in ("light", "dark"):
    for density in (1, 2):
        native = Image.open(directory / f"native-{theme}-{density}x.png").convert("RGB")
        web = Image.open(directory / f"web-{theme}-{density}x.png").convert("RGB")
        if native.size != web.size:
            raise SystemExit(f"Canvas mismatch: {native.size} != {web.size}")
        difference = ImageChops.difference(native, web)
        difference.save(directory / f"difference-{theme}-{density}x.png")
        for index, name in enumerate(names):
            for variant, size in enumerate((16, 20, 40)):
                left = ((index % 6) * 3 + variant) * 56 * density + (56 - size) * density // 2
                top = (index // 6) * 56 * density + (56 - size) * density // 2
                patch = difference.crop((left, top, left + size * density, top + size * density))
                error = sum(ImageStat.Stat(patch).mean) / (3 * 255)
                # At most 2% mean RGB error over the actual glyph viewport. Rasterizers
                # can differ at antialiased edges; geometry/stroke changes must still fail.
                results.append(dict(glyph=name, theme=theme, density=density, size=size,
                                    mean_rgb_error=error, passed=error <= 0.02))
report = dict(comparisons=len(results), failed=sum(not row["passed"] for row in results),
              worst=sorted(results, key=lambda row: row["mean_rgb_error"], reverse=True)[:20])
(directory / "comparison.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
sys.exit(1 if report["failed"] else 0)
