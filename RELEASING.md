# Releasing the Tiptree design system

The design system is distributed from immutable GitHub Releases. It is never
published to npmjs, PyPI, GitHub Packages, or another package registry. Each tag
produces an npm tarball, a Python wheel, `SHA256SUMS`, and GitHub build-provenance
attestations from the same source commit.

## Cut a release

1. Update `RELEASE_NOTES.md` and all four version surfaces together: `package.json`,
   `python/pyproject.toml`, `tokens/tokens.json`, and
   `python/tiptree_ui/__init__.py`.
2. Merge the approved release commit to `main` and run `npm run ci` from that
   exact commit.
3. Confirm the repository's immutable-releases setting is enabled.
4. Create and push a matching `vX.Y.Z` tag:

   ```sh
   git switch main
   git pull --ff-only
   npm run ci
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```

5. The tag starts `.github/workflows/release.yml`. The workflow repeats the
   release gates, builds both packages, writes their SHA-256 checksums, attests
   their provenance, and creates the GitHub Release with the checked-in notes.
6. Before announcing the release, download every asset, verify it against
   `SHA256SUMS`, and run `gh attestation verify` on the tarball, wheel, and
   checksum file.

   ```sh
   gh attestation verify <DOWNLOADED_ASSET> \
     --repo tiptreesystems/design-system
   ```

Release assets are immutable. Never delete, replace, or re-upload an asset. If
an artifact or its metadata is wrong, fix the source and cut a new version.

## Pin a consumer

Use the exact release asset URL. Do not use a branch, a moving `latest` URL, a
workspace path, or a registry alias.

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

Pin the wheel URL and the SHA-256 value published in `SHA256SUMS`:

```text
tiptree-ui @ https://github.com/tiptreesystems/design-system/releases/download/vX.Y.Z/tiptree_ui-X.Y.Z-py3-none-any.whl \
    --hash=sha256:<SHA256_FROM_RELEASE>
```

Use pip's hash-checking mode for the complete requirements set. The URL selects
the immutable release asset; the hash verifies its bytes.

### Poetry consumers

Pin the same wheel URL in `pyproject.toml`:

```toml
tiptree-ui = { url = "https://github.com/tiptreesystems/design-system/releases/download/vX.Y.Z/tiptree_ui-X.Y.Z-py3-none-any.whl" }
```

Regenerate and commit `poetry.lock`. Verify that its `tiptree-ui` entry records
the same `sha256:<SHA256_FROM_RELEASE>` value before opening the consumer PR.
