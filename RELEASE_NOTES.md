# v0.5.1

This is a distribution-only release. Token names, references, applicability,
and resolved light/dark values are unchanged from v0.5.0.

## Swift Package

- Adds the `TiptreeDesignSystem` Swift Package library for iOS 17 and newer.
- Commits the generated Swift source consumed by Swift Package Manager while
  preserving `tokens/tokens.json` as the only authored value source.
- Fails the release gate when the committed Swift package source is stale.
- Compiles the package for a generic iOS device in pull-request and release CI.

## Existing artifacts

The release workflow continues to publish the npm tarball, Python wheel,
`SHA256SUMS`, and build-provenance attestations. The immutable `v0.5.1` Git tag
is the Swift Package source-control release.
