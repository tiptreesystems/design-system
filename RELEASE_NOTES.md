# v0.5.0

This release candidate implements the four graduations ruled in the
2026-08-19 “Consolidated leftover-value rulings” entry in
`docs/DECISION_LEDGER.md`. It ships with/after Ivan's Althea pass; light values
remain re-rulable one-line before the tag is cut.

## Shared theme additions

- Adds text-quaternary as stone-500 in light and stone-550 in dark.
- Adds surface-sunken as stone-150 in light and stone-1000 in dark.
- Adds the web-only scrollbar-thumb wash at 10% black/white alpha.
- Adds border-interactive as stone-350 in light and the ruled off-ramp
  `#464641` literal in dark; the dark value intentionally sits between the
  stone-700 and stone-750 ramp steps.
- Keeps `--tt-color-button-hover-bg` absent. A5 remains deferred to the
  sitting and the v0.4.1 absence assertions remain authoritative.

## Artifacts

The release workflow publishes the npm tarball, Python wheel, `SHA256SUMS`, and
build-provenance attestations. `GeneratedTokens.swift` remains a local build
output; iOS release integration is deferred.
