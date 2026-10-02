"""Check the npm tarball and the Python wheel before they are retained.

Usage: python scripts/check_artifacts.py <tarball.tgz> <wheel.whl>

Run after `npm run build`, `npm pack` and `pip wheel python/`. Fails unless
the wheel holds every file the build wrote under python/tiptree_ui/assets/
(set equality, so a missed package-data glob fails), the licence files and
the licence expression travel in both artifacts, and the wheel's icon files
are byte-identical to the tarball's. Standard library only.
"""

from __future__ import annotations

import sys
import tarfile
import zipfile
from pathlib import Path

LICENCE_EXPRESSION = "Apache-2.0 AND CC-BY-4.0"
LICENCE_FILES = ("LICENSE", "NOTICE", "LICENSE-CC-BY-4.0.txt")
ICON_FILES = ("icons.js", "icons.json")
ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "python" / "tiptree_ui" / "assets"


def check(tarball_path: str, wheel_path: str) -> list[str]:
    errors: list[str] = []

    built = {
        f"tiptree_ui/assets/{path.relative_to(ASSETS).as_posix()}"
        for path in ASSETS.rglob("*")
        if path.is_file()
    }
    if not built:
        errors.append(f"no built assets under {ASSETS}; run npm run build first")

    with zipfile.ZipFile(wheel_path) as wheel:
        names = set(wheel.namelist())
        packaged = {name for name in names if name.startswith("tiptree_ui/assets/")}
        for name in sorted(built - packaged):
            errors.append(f"wheel is missing {name}")
        for name in sorted(packaged - built):
            errors.append(f"wheel carries {name}, which the build did not write")
        for icon in ICON_FILES:
            if f"tiptree_ui/assets/{icon}" not in names:
                errors.append(f"wheel is missing tiptree_ui/assets/{icon}")

        dist_info = {name.split("/", 1)[0] for name in names if ".dist-info/" in name}
        if len(dist_info) != 1:
            errors.append(f"expected one .dist-info directory, found {sorted(dist_info)}")
        else:
            (info,) = dist_info
            for licence in LICENCE_FILES:
                if f"{info}/licenses/{licence}" not in names:
                    errors.append(f"wheel is missing {info}/licenses/{licence}")
            metadata = wheel.read(f"{info}/METADATA").decode("utf-8")
            if f"License-Expression: {LICENCE_EXPRESSION}" not in metadata.splitlines():
                errors.append(f"wheel METADATA lacks License-Expression: {LICENCE_EXPRESSION}")
        wheel_icons = {
            icon: wheel.read(f"tiptree_ui/assets/{icon}")
            for icon in ICON_FILES
            if f"tiptree_ui/assets/{icon}" in names
        }

    with tarfile.open(tarball_path, "r:gz") as tarball:
        members = set(tarball.getnames())
        required = [f"package/{licence}" for licence in LICENCE_FILES]
        required += [f"package/dist/icons/{icon}" for icon in ICON_FILES]
        for name in required:
            if name not in members:
                errors.append(f"tarball is missing {name}")
        for icon in ICON_FILES:
            name = f"package/dist/icons/{icon}"
            if name in members and icon in wheel_icons:
                handle = tarball.extractfile(name)
                if handle is None or handle.read() != wheel_icons[icon]:
                    errors.append(f"wheel tiptree_ui/assets/{icon} differs from tarball {name}")

    return list(dict.fromkeys(errors))


def main(argv: list[str]) -> int:
    tarballs = [arg for arg in argv if arg.endswith(".tgz")]
    wheels = [arg for arg in argv if arg.endswith(".whl")]
    if len(tarballs) != 1 or len(wheels) != 1 or len(argv) != 2:
        print("usage: check_artifacts.py <tarball.tgz> <wheel.whl>", file=sys.stderr)
        return 2
    errors = check(tarballs[0], wheels[0])
    for error in errors:
        print(f"FAIL  {error}", file=sys.stderr)
    if errors:
        return 1
    print(f"verified: {Path(tarballs[0]).name} and {Path(wheels[0]).name} carry the assets, icons and licences")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
