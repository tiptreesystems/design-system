# Releasing the Tiptree design system

The design system is distributed from immutable Git tags and GitHub Releases.
It is never published to npmjs, PyPI, GitHub Packages, or another package
registry. Each tag is the Swift Package release and produces an npm tarball, a
Python wheel, `SHA256SUMS`, and GitHub build-provenance attestations from the
same source commit.

## Cut a release

1. Update `RELEASE_NOTES.md` (its `# vX.Y.Z` heading is a version surface)
   and the other version surfaces together: `package.json`,
   `python/pyproject.toml`, `tokens/tokens.json`, `icons/icons.json` and
   `python/tiptree_ui/__init__.py`. Run `npm run build`, then
   `node scripts/public-surface.mjs --write` to record the release's public
   surface in `tests/public-surface/vX.Y.Z.json`; anything removed or renamed
   since the previous release goes under a "Removed" or "Renamed" heading in
   the notes, and under 0.x keeps an alias for one minor.
2. Merge the approved release commit to `main`, run `npm run ci`, and compile
   the Swift Package for a generic iOS device from that exact commit.
3. Verify the candidate in every consumer before tagging: Althea
   (`tasc-stack/frontend`), docs, Lacuna, marketing-site, website-v2, and a
   platform-ios compile. Build the artifacts locally exactly as
   `.github/workflows/ci.yml` does (`npm run build`, then `npm pack` and
   `python -m pip wheel python/ --no-deps`, then
   `scripts/check_artifacts.py`), install the tarball into a worktree of each
   npm consumer through a `file:` pin, the wheel into a virtualenv for each
   Python consumer, and the vendored files into a worktree of each static
   site, and run each consumer's own gates unchanged: the
   unknown-custom-property lint, the build, the adapter and pin tests, and a
   diff of the resolved CSS against the previous release. A `file:` pin is
   for this verification only and is never committed. Record the results,
   with each consumer's SHA, in the release's ledger entry; the v0.6.0
   verification (ledger 2026-09-29) is the model.
4. Confirm the repository's immutable-releases setting is enabled.
5. Create and push a matching `vX.Y.Z` tag:

   ```sh
   git switch main
   git pull --ff-only
   npm run ci
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

6. The tag starts `.github/workflows/release.yml` (it triggers on
   `vX.Y.Z` and on `vX.Y.Z-rc.N`). The workflow repeats the
   release gates, builds both packages, checks their contents (below), writes
   their SHA-256 checksums, attests their provenance, and creates the GitHub
   Release with the checked-in notes.
7. Before announcing the release, download every asset, verify it against
   `SHA256SUMS`, and run `gh attestation verify` on the tarball, wheel, and
   checksum file.

   ```sh
   gh attestation verify <DOWNLOADED_ASSET> \
     --repo tiptreesystems/design-system
   ```

Release assets are immutable. Never delete, replace, or re-upload an asset. If
an artifact or its metadata is wrong, fix the source and cut a new version.

### Artifact contents

`scripts/check_artifacts.py` (standard library only) runs in CI's
`candidate-artifacts` job and in the release workflow, after the tarball and
the wheel are built and before anything is checksummed or attested:

```sh
python scripts/check_artifacts.py candidate/npm/*.tgz candidate/python/*.whl
```

It fails unless the wheel holds exactly the files the build wrote under
`python/tiptree_ui/assets/` (so a package-data glob that misses a file fails,
including `assets/icons.json` and `assets/icons.js`); the wheel's
`*.dist-info/licenses/` holds `LICENSE`, `NOTICE` and `LICENSE-CC-BY-4.0.txt`;
its `METADATA` carries `License-Expression: Apache-2.0 AND CC-BY-4.0`; the
tarball holds `package/LICENSE`, `package/NOTICE`,
`package/LICENSE-CC-BY-4.0.txt`, `package/dist/icons/icons.js` and
`package/dist/icons/icons.json`; and the wheel's two icon files are
byte-identical to the tarball's. `npm run ci` builds no wheel, so this check
is not part of it; run it locally after building the candidates as CI does.

### Attribution

The icon artwork is Solar by 480 Design under CC BY 4.0. A consumer that
bundles `icons.js` keeps its `/*! … */` header or ships the package's `NOTICE`
and `LICENSE-CC-BY-4.0.txt` with its third-party notices; the module's
`attribution` property survives a bundler that strips comments. Althea's chat
widget notices must name Solar: its notices builder must read the package's
`NOTICE` and every licence file, not only the first `LICENSE`.

## Pre-releases

A release that a consumer's feature branch must build on before its final
tag ships first as release candidates, `vX.Y.Z-rc.N`.

1. Set every version surface to `X.Y.Z-rc.N` (the notes heading too) and
   write `tests/public-surface/vX.Y.Z-rc.N.json`; run `npm run ci`; merge.
2. Tag `vX.Y.Z-rc.N` and push it, as in step 5 above. `release.yml` accepts
   the pattern `v[0-9]+.[0-9]+.[0-9]+-rc.[0-9]+` beside the final one, its tag
   check compares the literal version strings, and it creates the GitHub
   Release with `--prerelease` when the tag contains `-rc.`. A pre-release is
   as immutable and attested as a release.
3. For the final release, set every surface to `X.Y.Z`, write
   `vX.Y.Z.json`, and tag `vX.Y.Z` as usual. A candidate's snapshot stays in
   the repository, frozen.

Pins: the npm asset is `tiptree-design-system-X.Y.Z-rc.N.tgz`; setuptools
normalises the wheel's version, so its asset is
`tiptree_ui-X.Y.ZrcN-py3-none-any.whl` (for example `0.7.0rc1`) and its pip
URL differs from the tag's spelling. SwiftPM does not resolve a pre-release
under `upToNextMajor`, so iOS never floats onto a candidate. Only a feature
branch may pin a candidate; a default branch never does.

## Pin a consumer

Pin every consumer to the exact immutable release. Swift Package consumers use
the Git tag; npm and Python consumers use the matching release-asset URL. Do not
use a branch, a moving `latest` URL, a workspace path, or a registry alias.

### Swift Package consumers

Add `https://github.com/tiptreesystems/design-system.git` in Xcode, select the
exact `vX.Y.Z` release, link the `TiptreeDesignSystem` product, and commit
`Package.resolved`. The resolved file records the immutable source revision.

### npm consumers

Pin the release tarball in `package.json`:

```json
{
  "dependencies": {
    "@tiptree/design-system": "https://github.com/tiptreesystems/design-system/releases/download/vX.Y.Z/tiptree-design-system-X.Y.Z.tgz"
  }
}
```

Run `npm install` and commit `package-lock.json`. The lockfile records the
resolved immutable URL and its integrity hash; CI must install it with
`npm ci`.

### pip consumers

In a `requirements.txt`, pin the wheel URL and the SHA-256 value published in
`SHA256SUMS`:

```text
tiptree-ui @ https://github.com/tiptreesystems/design-system/releases/download/vX.Y.Z/tiptree_ui-X.Y.Z-py3-none-any.whl \
    --hash=sha256:<SHA256_FROM_RELEASE>
```

Use pip's hash-checking mode for the complete requirements set. The URL selects
the immutable release asset; the hash verifies its bytes.

In `pyproject.toml` (`[project] dependencies`, as uv projects declare them), the
hash travels as the PEP 508 URL fragment instead:

```toml
dependencies = [
    "tiptree-ui @ https://github.com/tiptreesystems/design-system/releases/download/vX.Y.Z/tiptree_ui-X.Y.Z-py3-none-any.whl#sha256=<SHA256_FROM_RELEASE>",
]
```

`--hash` is a requirements-file option, not part of a dependency specifier, so
build backends reject it in `pyproject.toml`; Lacuna hit this at its v0.6.0
bump. Re-lock and commit the lockfile, and verify that its `tiptree-ui` entry
(`uv.lock` for uv) records the same `sha256` before opening the consumer PR.

### Poetry consumers

Pin the same wheel URL in `pyproject.toml`:

```toml
tiptree-ui = { url = "https://github.com/tiptreesystems/design-system/releases/download/vX.Y.Z/tiptree_ui-X.Y.Z-py3-none-any.whl" }
```

Regenerate and commit `poetry.lock`. Verify that its `tiptree-ui` entry records
the same `sha256:<SHA256_FROM_RELEASE>` value before opening the consumer PR.

### Static sites

A site with no build step vendors the CSS instead of installing the package.
Copy `dist/css/primitives.css` and exactly one theme file from
`dist/css/themes/` out of the release tarball byte-for-byte, keeping the
`GENERATED` header that names the release. Pin them with a test in the site's
repository that asserts each file's sha256 against the release's copy and that
every page links both files with a version query
(`primitives.css?v=X.Y.Z`), so no browser cache serves an older copy after a
bump; an opt-in check that downloads the tarball and byte-compares the two
files proves the hashes were not typed by hand. Bump by replacing the files,
the hashes in the test, and the version queries.

Copy `dist/icons/icons.js` too when the site uses icons, pin its sha256 in the
same test, and import it with `?v=X.Y.Z`.
