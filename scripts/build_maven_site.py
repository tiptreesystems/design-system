#!/usr/bin/env python3
"""Rebuild a static Maven site from checksum-verified, stable GitHub Releases.

Release ZIPs are the retained source of truth. Only the version index changes;
historical AAR/POM/module/source files are copied byte-for-byte on every deploy.
No Gradle consumer needs this script, GitHub CLI, or GitHub credentials.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import stat
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

GROUP = "com.tiptreesystems"
ARTIFACT = "design-system-android"
MODULE_PATH = Path("com/tiptreesystems") / ARTIFACT
STABLE_TAG = re.compile(r"v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", re.ASCII)
MAX_ARCHIVE = 4 * 1024 * 1024
MAX_EXPANDED = 32 * 1024 * 1024
HASHES = ("md5", "sha1", "sha256", "sha512")


def gh(*arguments):
    return subprocess.check_output(["gh", *arguments], timeout=180)


def release_versions(pages):
    versions = {}
    for release in (release for page in pages for release in page):
        match = STABLE_TAG.fullmatch(release["tag_name"])
        if not match or release["draft"] or release["prerelease"]:
            continue
        version = release["tag_name"][1:]
        archive = f"tiptree-design-system-android-{version}-maven.zip"
        assets = {asset["name"]: asset for asset in release["assets"]}
        if not any(name.startswith("tiptree-design-system-android-") for name in assets):
            continue  # Releases before the Android export remain unchanged.
        if (archive not in assets or "SHA256SUMS" not in assets
                or not 0 < assets[archive]["size"] <= MAX_ARCHIVE
                or not 0 < assets["SHA256SUMS"]["size"] <= 1024 * 1024):
            raise ValueError(f"Incomplete or oversized Android release: {version}")
        if version in versions:
            raise ValueError(f"Duplicate release: {version}")
        versions[version] = archive
    return dict(sorted(versions.items(), key=lambda item: tuple(map(int, item[0].split(".")))))


def archive_files(path, version, sums):
    checksums = [line.split() for line in sums.splitlines()]
    expected = [fields[0] for fields in checksums if len(fields) == 2 and fields[1] == path.name]
    if (path.stat().st_size > MAX_ARCHIVE or len(expected) != 1
            or hashlib.sha256(path.read_bytes()).hexdigest() != expected[0]):
        raise ValueError(f"Archive SHA-256 mismatch: {path.name}")
    prefix = MODULE_PATH / version
    stem = f"{ARTIFACT}-{version}"
    artifacts = {str(prefix / f"{stem}{suffix}") for suffix in (".aar", ".pom", ".module", "-sources.jar")}
    allowed = artifacts | {f"{name}.{algorithm}" for name in artifacts for algorithm in HASHES}
    directories = {str(parent) + "/" for name in allowed for parent in Path(name).parents if str(parent) != "."}
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        if (len(entries) > 256 or len({entry.filename for entry in entries}) != len(entries)
                or sum(entry.file_size for entry in entries) > MAX_EXPANDED
                or any(stat.S_ISLNK(entry.external_attr >> 16) for entry in entries)
                or any(entry.filename not in (directories if entry.is_dir() else allowed) for entry in entries)):
            raise ValueError(f"Unsafe Maven archive: {path.name}")
        files = {entry.filename: archive.read(entry) for entry in entries if not entry.is_dir()}
    if files.keys() != allowed:
        raise ValueError(f"Missing Maven files: {path.name}")
    for name in artifacts:
        for algorithm in HASHES:
            if files[f"{name}.{algorithm}"].decode().strip() != hashlib.new(algorithm, files[name]).hexdigest():
                raise ValueError(f"Bad {algorithm}: {name}")
    pom = ET.fromstring(files[str(prefix / f"{stem}.pom")])
    ns = "{http://maven.apache.org/POM/4.0.0}"
    if [pom.findtext(ns + field) for field in ("groupId", "artifactId", "version")] != [GROUP, ARTIFACT, version]:
        raise ValueError(f"POM identity mismatch: {version}")
    module = json.loads(files[str(prefix / f"{stem}.module")])
    if [module["component"].get(field) for field in ("group", "module", "version")] != [GROUP, ARTIFACT, version]:
        raise ValueError(f"Module identity mismatch: {version}")
    for variant in module["variants"]:
        for artifact in variant.get("files", []):
            name = str(prefix / artifact["url"])
            if (name not in artifacts or artifact["name"] != artifact["url"]
                    or artifact["size"] != len(files[name])
                    or artifact["sha256"] != hashlib.sha256(files[name]).hexdigest()):
                raise ValueError(f"Module artifact mismatch: {version}")
    return files


def write_metadata(root, versions):
    metadata = ET.Element("metadata")
    ET.SubElement(metadata, "groupId").text = GROUP
    ET.SubElement(metadata, "artifactId").text = ARTIFACT
    versioning = ET.SubElement(metadata, "versioning")
    ET.SubElement(versioning, "latest").text = versions[-1]
    ET.SubElement(versioning, "release").text = versions[-1]
    entries = ET.SubElement(versioning, "versions")
    for version in versions:
        ET.SubElement(entries, "version").text = version
    ET.indent(metadata)
    content = ET.tostring(metadata, encoding="utf-8", xml_declaration=True) + b"\n"
    path = root / MODULE_PATH / "maven-metadata.xml"
    path.write_bytes(content)
    for algorithm in HASHES:
        path.with_name(f"{path.name}.{algorithm}").write_text(hashlib.new(algorithm, content).hexdigest())


def build_site(output, repository, required_tag=None, run_gh=gh):
    if output.exists():
        raise ValueError("Output must not exist; build a fresh site before deploying")
    pages = json.loads(run_gh("api", "--paginate", "--slurp", f"repos/{repository}/releases?per_page=100"))
    versions = release_versions(pages)
    if not versions or (required_tag and required_tag.removeprefix("v") not in versions):
        raise ValueError("No Android releases, or the required release is missing; keep the existing site")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="maven-site-", dir=output.parent) as directory:
        staging = Path(directory)
        site = staging / "site"
        for version, name in versions.items():
            download = staging / version
            run_gh("release", "download", f"v{version}", "--repo", repository,
                   "--pattern", name, "--pattern", "SHA256SUMS", "--dir", str(download))
            files = archive_files(download / name, version, (download / "SHA256SUMS").read_text())
            for name, content in files.items():
                target = site / "maven" / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(content)
        write_metadata(site / "maven", list(versions))
        (site / "index.html").write_text(
            '<!doctype html><html lang="en"><meta charset="utf-8">'
            '<title>Tiptree Android Maven repository</title>'
            '<h1>Tiptree Android Maven repository</h1>'
            '<p>Gradle repository: <code>https://tiptreesystems.github.io/design-system/maven</code></p>'
            '<p><a href="https://github.com/tiptreesystems/design-system/blob/main/android/README.md">'
            'Setup, version ranges and local candidates</a></p></html>\n')
        site.rename(output)
    return list(versions)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--repository", default="tiptreesystems/design-system")
    parser.add_argument("--require-tag")
    args = parser.parse_args()
    print("Maven site versions:", ", ".join(build_site(args.output, args.repository, args.require_tag)))
