"""Release discovery, retained artifacts and fail-closed Pages assembly; no network."""
import hashlib
import io
import json
from pathlib import Path
import stat
import sys
import tempfile
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_maven_site as site


def maven_zip(version, edit=None):
    stem = f"{site.ARTIFACT}-{version}"
    aar = b"retained AAR bytes " + version.encode()
    sources = b"retained sources " + version.encode()
    module = {
        "formatVersion": "1.1",
        "component": {"group": site.GROUP, "module": site.ARTIFACT, "version": version},
        "variants": [{"name": "release", "files": [{"name": stem + ".aar", "url": stem + ".aar",
                     "size": len(aar), "sha256": hashlib.sha256(aar).hexdigest()}]}],
    }
    files = {
        stem + ".aar": aar,
        stem + "-sources.jar": sources,
        stem + ".module": json.dumps(module).encode(),
        stem + ".pom": (f'<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion>'
                        f'<groupId>{site.GROUP}</groupId><artifactId>{site.ARTIFACT}</artifactId>'
                        f'<version>{version}</version><packaging>aar</packaging></project>').encode(),
    }
    files = {str(site.MODULE_PATH / version / name): content for name, content in files.items()}
    for name, content in list(files.items()):
        for algorithm in site.HASHES:
            files[f"{name}.{algorithm}"] = hashlib.new(algorithm, content).hexdigest().encode()
    if edit:
        edit(files)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    return buffer.getvalue()


class Releases:
    def __init__(self, *versions):
        self.records = []
        self.archives = {}
        for version in versions:
            self.add(version)
        self.calls = []

    def add(self, version, **flags):
        content = maven_zip(version)
        name = f"tiptree-design-system-android-{version}-maven.zip"
        self.archives[version] = (name, content)
        self.records.append({"tag_name": f"v{version}", "draft": False, "prerelease": False,
                             "assets": [{"name": name, "size": len(content)},
                                        {"name": "SHA256SUMS", "size": 1024}], **flags})

    def __call__(self, *arguments):
        self.calls.append(arguments)
        if arguments[0] == "api":
            assert "--paginate" in arguments and "--slurp" in arguments
            return json.dumps([[record] for record in self.records]).encode()
        version = arguments[2][1:]
        name, content = self.archives[version]
        directory = Path(arguments[-1])
        directory.mkdir()
        (directory / name).write_bytes(content)
        (directory / "SHA256SUMS").write_text(hashlib.sha256(content).hexdigest() + "  " + name + "\n")
        return b""


class MavenSiteTests(unittest.TestCase):
    def test_rebuild_retains_all_versions_exactly_and_indexes_stable_numeric_order(self):
        releases = Releases("0.12.0", "0.9.0", "1.0.0", "0.13.0-rc.1")
        releases.add("0.99.0", draft=True)
        releases.add("0.98.0", prerelease=True)
        releases.records.append({"tag_name": "v0.8.0", "draft": False, "prerelease": False, "assets": []})
        with tempfile.TemporaryDirectory() as directory:
            first = Path(directory) / "first"
            versions = site.build_site(first, "example/repo", "v0.12.0", releases)
            self.assertEqual(versions, ["0.9.0", "0.12.0", "1.0.0"])
            for version in versions:
                with zipfile.ZipFile(io.BytesIO(releases.archives[version][1])) as archive:
                    for name in archive.namelist():
                        self.assertEqual((first / "maven" / name).read_bytes(), archive.read(name))
            metadata_path = Path("maven") / site.MODULE_PATH / "maven-metadata.xml"
            metadata = ET.parse(first / metadata_path)
            self.assertEqual(metadata.findtext("versioning/release"), "1.0.0")
            self.assertEqual([node.text for node in metadata.findall("versioning/versions/version")], versions)
            for algorithm in site.HASHES:
                self.assertEqual((first / f"{metadata_path}.{algorithm}").read_text(),
                                 hashlib.new(algorithm, (first / metadata_path).read_bytes()).hexdigest())
            self.assertEqual(len(releases.calls), 4)  # one paginated listing + three stable downloads
            releases.add("0.13.0")
            second = Path(directory) / "second"
            site.build_site(second, "example/repo", run_gh=releases)
            for path in (first / "maven" / site.MODULE_PATH / "0.12.0").iterdir():
                self.assertEqual(path.read_bytes(), (second / path.relative_to(first)).read_bytes())
            self.assertIn("0.13.0", (second / metadata_path).read_text())

    def test_missing_or_malformed_release_never_yields_a_partial_deployment(self):
        cases = [Releases(), Releases("0.12.0"), Releases("0.12.0", "0.13.0")]
        cases[2].records[-1]["assets"].pop()  # archive without checksum file
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "site"
            for releases in cases:
                with self.subTest(releases=releases.records), self.assertRaises(ValueError):
                    site.build_site(output, "example/repo", "v0.13.0", releases)
                self.assertFalse(output.exists())
            releases = Releases("0.12.0", "0.13.0")
            releases.archives["0.13.0"] = (releases.archives["0.13.0"][0], b"bad archive")
            with self.assertRaises(zipfile.BadZipFile):
                site.build_site(output, "example/repo", run_gh=releases)
            self.assertFalse(output.exists())
            output.mkdir()
            marker = output / "previous"
            marker.write_text("keep")
            with self.assertRaisesRegex(ValueError, "must not exist"):
                site.build_site(output, "example/repo", run_gh=releases)
            self.assertEqual(marker.read_text(), "keep")

    def test_duplicate_oversized_and_misnamed_release_assets_fail(self):
        releases = Releases("0.12.0")
        record = releases.records[0]
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            site.release_versions([[record, record]])
        for mutation in (lambda r: r["assets"][0].update(size=site.MAX_ARCHIVE + 1),
                         lambda r: r["assets"][0].update(name="tiptree-design-system-android-wrong-maven.zip")):
            copy = json.loads(json.dumps(record))
            mutation(copy)
            with self.assertRaisesRegex(ValueError, "Incomplete or oversized"):
                site.release_versions([[copy]])

    def test_archive_integrity_identity_and_safe_extraction(self):
        version = "0.12.0"
        prefix = str(site.MODULE_PATH / version / f"{site.ARTIFACT}-{version}")
        def alter_identity(files):
            name = prefix + ".pom"
            files[name] = files[name].replace(b"<version>0.12.0", b"<version>0.99.0")
            for algorithm in site.HASHES:
                files[f"{name}.{algorithm}"] = hashlib.new(algorithm, files[name]).hexdigest().encode()
        changes = [lambda f: f.update({"../escape": b"bad"}),
                   lambda f: f.update({prefix + ".aar": b"tampered"}),
                   lambda f: f.pop(prefix + ".pom.sha512"), alter_identity]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "artifact.zip"
            for edit in changes:
                content = maven_zip(version, edit)
                path.write_bytes(content)
                with self.subTest(edit=edit), self.assertRaises(ValueError):
                    site.archive_files(path, version, hashlib.sha256(content).hexdigest() + "  artifact.zip")
            content = maven_zip(version)
            path.write_bytes(content)
            with self.assertRaisesRegex(ValueError, "SHA-256"):
                site.archive_files(path, version, "0" * 64 + "  artifact.zip")
            with patch.object(site, "MAX_EXPANDED", 1), self.assertRaisesRegex(ValueError, "Unsafe"):
                site.archive_files(path, version, hashlib.sha256(content).hexdigest() + "  artifact.zip")
            with zipfile.ZipFile(path, "a") as archive:
                link = zipfile.ZipInfo("link")
                link.external_attr = (stat.S_IFLNK | 0o777) << 16
                archive.writestr(link, "../../outside")
            with self.assertRaisesRegex(ValueError, "Unsafe"):
                site.archive_files(path, version, hashlib.sha256(path.read_bytes()).hexdigest() + "  artifact.zip")


if __name__ == "__main__":
    unittest.main()
