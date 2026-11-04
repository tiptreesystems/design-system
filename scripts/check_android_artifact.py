#!/usr/bin/env python3
"""Validate the local Maven-layout candidate, its byte-exact notices and public Kotlin sources."""
import hashlib
import io
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile

root = Path(__file__).resolve().parents[1]
archive_path = Path(sys.argv[1])
limits = json.loads((root / "android/budgets.json").read_text())
assert archive_path.stat().st_size <= limits["mavenArchive"], "Maven archive exceeds budget"
with zipfile.ZipFile(archive_path) as archive:
    paths = archive.namelist()
    assert all(not name.startswith("/") and ".." not in Path(name).parts for name in paths)
    aar_name, = [name for name in paths if name.endswith(".aar")]
    pom_name, = [name for name in paths if name.endswith(".pom")]
    sources_name, = [name for name in paths if name.endswith("-sources.jar")]
    module_name, = [name for name in paths if name.endswith(".module")]
    contents = {name: archive.read(name) for name in (aar_name, pom_name, sources_name, module_name)}
    aar_bytes = contents[aar_name]
    assert len(aar_bytes) <= limits["aar"], "AAR exceeds budget"
    for name, content in contents.items():
        for suffix, algorithm in (("sha256", hashlib.sha256), ("sha512", hashlib.sha512)):
            assert archive.read(f"{name}.{suffix}").decode().strip() == algorithm(content).hexdigest(), f"Bad {suffix}: {name}"
    module = json.loads(contents[module_name])
    assert module["component"]["group"] == "com.tiptreesystems"
    assert module["component"]["module"] == "design-system-android"
    namespace = {"m": "http://maven.apache.org/POM/4.0.0"}
    pom = ET.fromstring(contents[pom_name])
    assert pom.find("m:version", namespace).text == module["component"]["version"]
    assert pom.find("m:dependencies", namespace) is not None, "Missing transitive dependencies"
    assert len(pom.findall("m:licenses/m:license", namespace)) == 2
    with zipfile.ZipFile(io.BytesIO(aar_bytes)) as aar:
        for name in ("LICENSE", "NOTICE", "LICENSE-CC-BY-4.0.txt"):
            assert aar.read(f"assets/tiptree-design-system/{name}") == (root / name).read_bytes()
        assert aar.read("assets/tiptree-design-system/icons.json") == (root / "icons/icons.json").read_bytes()
        assert "tt_brand_black" in aar.read("R.txt").decode(), "XML token resources missing"
        with zipfile.ZipFile(io.BytesIO(aar.read("classes.jar"))) as classes:
            for name in ("TiptreeTokens", "TiptreeColors", "TiptreeIcons", "TiptreeThemeKt", "TiptreeIconKt"):
                assert f"com/tiptreesystems/designsystem/{name}.class" in classes.namelist(), f"Missing {name}"
    with zipfile.ZipFile(io.BytesIO(contents[sources_name])) as sources:
        for filename in ("TiptreeTokens.kt", "TiptreeColors.kt", "TiptreeIcons.kt"):
            matches = [name for name in sources.namelist() if name.endswith(f"/{filename}")]
            assert len(matches) == 1, f"Missing/duplicate {filename} in sources"
            expected = root / "android/design-system/src/main/generated/kotlin/com/tiptreesystems/designsystem" / filename
            assert sources.read(matches[0]) == expected.read_bytes()

receipt = {"archive": archive_path.name, "version": module["component"]["version"],
           "archive_bytes": archive_path.stat().st_size, "aar_bytes": len(aar_bytes),
           "sha256": hashlib.sha256(archive_path.read_bytes()).hexdigest()}
print(json.dumps(receipt, indent=2))
