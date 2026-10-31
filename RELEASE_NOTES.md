# v0.10.0

Two values, from Ivan's rulings 12.263 and 12.264 in the Althea prototype,
recorded in the 2026-10-30 entry in `docs/DECISION_LEDGER.md`: the hairline
is 1px on every screen, and the box's rim while you write is a neutral one
stone past its rest, not the accent. Nothing is added or renamed; the
hairline's high-density media block is removed.

## Tokens

- Changed, web-only: `border-hairline` is 1px at every density. The
  `@media (resolution >= 192dpi)` block that set it to 0.5px in
  `primitives.css` and `tokens.css` is gone: a line of one device pixel on a
  rounded rim is drawn across two half-bright pixels, so a corner read
  beaded beside its straight run.

## Roles

- Changed: `color-border-box-focus` → `{stone-400}` (`#bebeb3`) on paper and
  `{stone-650}` (`#5c5c55`) in the dark (was the accent in both themes): the
  box's rim while you write is barely firmer than the rim at rest (1.21:1
  against `#d0d0c8` on paper; 1.77:1 against the rim at rest drawn over the
  dark page). `color-focus-ring`, the keyboard's ring, keeps the accent.

## What each consumer does at its bump

- Every consumer: on a dense screen, every line, rim and divider drawn at
  `--tt-border-hairline` turns from 0.5px to 1px; anything that offsets or
  sums by the hairline moves by half a pixel there. Delete any local media
  block that set the hairline itself.
- Every consumer that reads `color-border-box-focus`: a focused field's rim
  turns from teal to the neutral stone; a field that should keep the accent
  while focused reads `color-focus-ring` instead.
- Althea: its box and the fields that read the role take the new rim with no
  CSS change; its lines on a dense screen take the 1px.
- platform-ios: `colorBorderBoxFocus` changes; it reads no hairline.
- Pin the release only after its tag.

## Removed / Renamed

- Removed: the high-density block of `border-hairline`
  (`@media (resolution >= 192dpi) :root` in `primitives.css` and
  `tokens.css`). The name stays, at 1px.

## Artifacts

npm tarball, Python wheel, `SHA256SUMS` and provenance attestations. The
`v0.10.0` tag is the Swift Package release; its diff changes
`colorBorderBoxFocus` in both themes and adds nothing.
