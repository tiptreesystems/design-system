#!/usr/bin/env python3
"""Run the package tests on an installed iPhone simulator; export parity attachments.

No Node, downloaded simulator or app checkout is needed. Set TT_SWIFT_DESTINATION
to an explicit xcodebuild destination to select a particular installed simulator.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1] if len(sys.argv) > 1 else root / ".build/swift-icons").resolve()
output.mkdir(parents=True, exist_ok=True)
destination = os.environ.get("TT_SWIFT_DESTINATION")
if not destination:
    inventory = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "-j"]))
    devices = [device for runtime, items in inventory["devices"].items() if "iOS" in runtime
               for device in items if device["name"].startswith("iPhone")]
    if not devices:
        raise SystemExit("No installed iPhone simulator; install/select one before running this gate")
    devices.sort(key=lambda device: device["state"] != "Booted")
    destination = "platform=iOS Simulator,id=" + devices[0]["udid"]
result = output / "Tests.xcresult"
if result.exists():
    raise SystemExit(f"Result already exists; choose a fresh output directory: {result}")
subprocess.run(["xcodebuild", "test", "-scheme", "TiptreeDesignSystem", "-destination", destination,
                "-parallel-testing-enabled", "NO", "-derivedDataPath", str(output / "DerivedData"),
                "-resultBundlePath", str(result)], cwd=root, check=True)
attachments = output / "attachments"
subprocess.run(["xcrun", "xcresulttool", "export", "attachments", "--path", str(result),
                "--output-path", str(attachments)], check=True)
manifest = json.loads((attachments / "manifest.json").read_text())
expected = {f"native-{theme}-{scale}x.png" for theme in ("light", "dark") for scale in (1, 2)} | {"native-names.txt"}
found = set()
for test in manifest:
    for attachment in test["attachments"]:
        suggested = Path(attachment["suggestedHumanReadableName"])
        # Xcode adds an index and UUID between the attachment stem and extension.
        name = next((item for item in expected if suggested.name == item or (
            suggested.suffix == Path(item).suffix and suggested.stem.startswith(Path(item).stem + "_")
        )), None)
        if name:
            if name in found:
                raise SystemExit(f"Duplicate parity attachment: {name}")
            shutil.copyfile(attachments / attachment["exportedFileName"], output / name)
            found.add(name)
if found != expected:
    raise SystemExit(f"Missing parity attachments: {expected - found}")
print(f"Swift unit tests and native contact sheets: {output}")
