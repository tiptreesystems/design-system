#!/usr/bin/env python3
"""Compare native Compose renders with Chromium SVGs. Requires Pillow for this optional visual gate."""
import json
from pathlib import Path
import shutil
import sys
from icon_parity import compare

directory = Path(sys.argv[1])
if len(sys.argv) > 2:
    # AGP collects PlatformTestStorage files before uninstalling the test APK.
    collected = Path(sys.argv[2])
    for filename in [f"native-{theme}-{density}x.png" for theme in ("light", "dark") for density in (1, 2)] + ["native-names.txt"]:
        matches = list(collected.rglob(filename))
        if len(matches) != 1:
            raise SystemExit(f"Expected exactly one collected {filename}; found {len(matches)}")
        shutil.copyfile(matches[0], directory / filename)
report = compare(directory)
print(json.dumps(report, indent=2))
sys.exit(1 if report["failed"] else 0)
