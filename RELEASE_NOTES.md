# v0.5.0

This release implements the four graduations ruled in the
2026-08-19 “Consolidated leftover-value rulings” entry in
`docs/DECISION_LEDGER.md`. Publication is authorized by the later “v0.5.0 gate
narrowed to Althea adoption” entry: docs already renders these values, Lacuna
does not consume the four roles, and Althea adoption remains gated on Ivan's
pass. A later light-value re-ruling ships immutably as v0.5.1.

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
