# v0.8.0

Tokens only: the spacing scale, the title step and the glyph sizes the Althea
rebuild's atoms read, taken from the Althea prototype's package proposals of
2026-10-02 (rows 1, 3 and 5), and three roles and one value the atoms need to
match the prototype, all recorded in the 2026-10-03 entry in
`docs/DECISION_LEDGER.md`. The nineteen proposal tokens are new and web-only;
their sizes are in rem, so they grow with the reader's text size. The three
roles are cross-platform, so the Swift source gains six identifiers. One
released value changes: the light danger grounds.

## Tokens

- New spacing scale: `space-025`, `-050`, `-075`, `-100`, `-150`, `-200`,
  `-250`, `-300`, `-400`, `-500`, `-600` and `-800`, from 0.125 to 4rem (2, 4,
  6, 8, 12, 16, 20, 24, 32, 40, 48 and 64 at the default text size). A name
  states a step, with 100 at 8, so it stays true as the scale grows with the
  text. One scale for every padding, margin and gap.
- New title step in the heading register, between page and section:
  `font-heading-title-family` (`{font-serif}`), `-size` 2rem, `-line-height`
  1.25, `-letter-spacing` -0.015em and `-weight` `{font-weight-normal}` (400).
  The register now runs display, page, title, section, sub.
- New glyph sizes: `glyph-small` 1rem (16, in the small and default controls)
  and `glyph-large` 1.25rem (20, in the large and hero controls). The glyph's
  line stays 1.5px at both.
- Python's `TOKENS['base']` carries the nineteen, resolved.

## Roles

- New `color-action-secondary-border`: the ring on a pill, a chip or a field
  at rest, light `stone-300` (`#dcdcd4`), dark `#464641`, a step lighter than
  the content line in the light. `color-button-secondary-border` keeps
  `stone-550` and its 3:1 edge for the consumers that still draw it.
- New `color-mark-expired`: a task whose window has closed, light `citron-600`,
  dark `citron-300`, beside the other four marks.
- New `color-badge-neutral-bg`: the quiet tint behind a category word, 7% of
  the ink (light `#4d4d4712`, dark `#ffffff12`); its words take
  `color-text-secondary`.
- Changed, light only: `color-action-danger-bg` `#b04a3f` → `#c84a4a`,
  `-bg-hover` `#963f36` → `#b34242` and `-bg-pressed` `#7f352e` → `#b34242`,
  the brand red deepened as the prototype paints it; white on them is 4.63:1
  and 5.56:1. Dark and `-fg` are unchanged. Visible wherever a consumer
  aliases these roles in the light, including iOS through the Swift Package.
- Deprecated: `color-keycap-bg` and `-bg-hover`. Nothing has read them since
  the prototype's keys lost their ground (2026-09-25); they stay until the
  next major removes them.
- Not in this release: the corner roles, the control sizes in rem, the
  shadows at their drawn strengths, Button and its glass, the ghost grounds,
  the control-colour family, a 16 type step and a pure-black primitive. The
  ledger entry says when each is taken up.

## Removed / Renamed

- None.

## Artifacts

npm tarball, Python wheel, `SHA256SUMS` and provenance attestations. The
`v0.8.0` tag is the Swift Package release; its diff adds three colours
(`colorActionSecondaryBorder`, `colorMarkExpired`, `colorBadgeNeutralBg`, each
with its `UIColor`) and changes the light danger values.
