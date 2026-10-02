# v0.6.0

This release makes the Althea prototype's September tuning canon, as ruled in
the 2026-09-29 entry in `docs/DECISION_LEDGER.md`: the prototype
(the `althea-prototype` repository's `explore.css` and its vendored `brand.css`) is the
source of truth for every value, and everything it introduced is shared. Three
independent consumers (the homepage, docs, and the prototype) already carry the
direction. The 2026-08-18 light-canvas gate is satisfied, so Althea's pin bump
targets this release; docs and Lacuna re-bump from v0.5.0.

## Re-ruled values

- Dark ladder: stone-850 `#282826`, stone-875 `#222220`, stone-900 `#1b1b1a`,
  stone-950 `#161615`, stone-1000 `#10100f`. These primitives are
  cross-platform, so iOS renders the change.
- Light canvas: stone-050 `#fcfcfb`.
- Light accent moves to the new ramp steps teal-550 `#3c8286` and teal-650
  `#346f72` (hover); the dark accent and both links are unchanged.
- Text greys: light secondary/tertiary/quaternary one step darker
  (stone-750/650/550); dark one step lighter (stone-300/400/500).
- Light border-primary becomes stone-350, a ruled collapse onto
  border-interactive in light only.

## Shared theme additions

- `color-bg-ground` (stone-050 / new stone-1050 `#0d0d0c`): the flat canvas
  docs and the homepage map to; Althea's page stays `color-bg-primary`.
- `color-row-hover` (stone-150 / 11% white) and `color-surface-open`
  (stone-200 / 15% white) beside the unchanged `color-surface-hover`.
- `color-border-section`, `color-keycap-bg`, `color-keycap-bg-hover`.
- Four marks and two channel greens: `color-mark-new`, `color-mark-live`,
  `color-mark-idle`, `color-mark-community`, `color-channel-whatsapp`,
  `color-channel-sms`.
- `shadow-lift`, web-only and themed, with the prototype's alphas resolved to
  hex.

## Shared primitives and web-only scales

- `stone-1050`, `teal-550`, `teal-650`, `radius-20`.
- The control scale `control-hero`, `control-large`, `control-default`,
  `control-small` (56 / 44 / 36 / 28 px).
- `font-code` (the Google Sans Code stack; `font-mono` stays true mono), the
  Inter weights `font-weight-light/normal/medium/semibold/bold`
  (300 / 400 / 510 / 590 / 680), the six-step body scale `font-size-*` with
  `font-line-height-*` and `font-letter-spacing-*`, and the four-step heading
  register `font-heading-*` (size, line-height, letter-spacing, weight, and
  the serif/sans family for page, section and sub).

## Artifacts

The release workflow publishes the npm tarball, Python wheel, `SHA256SUMS`,
and build-provenance attestations. The immutable `v0.6.0` Git tag is the Swift
Package source-control release; because five dark primitives change, the tag
follows the iOS screenshot pass recorded in the ledger.
