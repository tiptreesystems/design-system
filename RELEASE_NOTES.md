# v0.7.0

The design system now ships the icon library and the type foundations the
Althea rebuild runs on, as ruled in the v0.7.0 entry of 2026-10-01 in
`docs/DECISION_LEDGER.md`. The `althea-prototype` repository is the source of
truth for the new values. The icon export is provisional: its first consumer is
Althea's rebuild, and 0.8.0 withdraws it if no Althea release that imports it
has merged by then. The rebuild's first step proved this build in Althea before
the tag.

## Icons (new, provisional)

- `@tiptree/design-system/icons.js`: one frozen, data-only ES module of 130
  glyphs keyed by what they draw, in Solar's current Iconify names (`close`,
  `close-circle`, `magnifier`, `pin-filled`), each with its cut (`linear` at
  rest; `filled` for `pin-filled`; `solid` for `menu-dots`, `grip-dots` and
  `plus-heavy`) and its body for a 24 viewBox. `icons.json` carries each
  glyph's provenance: 113 Solar glyphs verbatim, 3 modified (`microphone`,
  `ghost`, `history-2`) and 14 Tiptree drawings, among them `plus-heavy`, New
  conversation's plus with its bars drawn filled, the one optical correction
  kept in the drawing. Both also ship in the wheel at
  `tiptree_ui/assets/icons.json` and `icons.js`. No Swift form.
- Every stroked shape carries `vector-effect="non-scaling-stroke"`, so the
  1.5 line is 1.5px at any size (the sparkles of `moon-stars` and
  `stars-minimalistic` draw at 1px, by Solar's design): set size and colour
  only, and remove CSS `stroke-width` rules aimed at icons, which now mean
  screen pixels.
- Role names stay in each app, with a test that every mapped name exists. A
  glyph an app needs first goes in its extension file, registered in
  `registry/icon-extensions.md`. Brand marks are not icons.
- Solar by 480 Design, CC BY 4.0. The package licence is now
  `Apache-2.0 AND CC-BY-4.0`; see `NOTICE` and `LICENSE-CC-BY-4.0.txt`. The
  module keeps a `/*! … */` header and an `attribution` property.

## Tokens

- New, web-only: `border-hairline` (1px, and 0.5px at
  `(resolution >= 192dpi)`).
- New, cross-platform: `radius-28` (Swift `r28`). The corner ladder is
  4 / 8 / 12 / 16 / 20 / 24 / 28 / full; `radius-6` stays, off the ladder.
- New Button roles: `color-action-primary-bg`, `-bg-hover` and `-fg`
  (light `teal-600` / `teal-700` / white; dark `#2e585a` / `#43696b` /
  white) and `color-button-secondary-bg-hover` (light `stone-150`; dark
  `#40403f`). The dark values are the prototype's glass Button made opaque;
  the glass itself is the component's material, not a token.
- New surface roles for the three surfaces and the control ring:
  `color-surface-block`, `color-surface-box`, `color-border-block`,
  `color-border-box`, `color-border-box-focus`, `color-border-control`,
  `color-border-overlay` (cross-platform) and `shadow-block`, `shadow-box`,
  `shadow-overlay` (web-only). An overlay's fill is the existing
  `color-surface-card`.
- Changed: `font-sans` leads with `'Inter Variable', 'Inter', 'Inter Fallback'`;
  `font-serif` adds `'Literata Fallback'`; `font-heading-sub-weight` is
  `{font-weight-medium}` (510, was 500), visible where a consumer aliases it
  and renders the variable face.
- Unchanged: motion and z-index. Not minted: `font-label-mono` and
  `surface-alpha-*`.

## Generator and gates

- `tokens.json` accepts a `media` map of named, allow-listed queries; the
  block is emitted after `:root` in `primitives.css` and `tokens.css`, never
  in a theme file, and the Python and Swift exports keep the base value.
- `tokens.css` and the three theme files gain 1 KiB of raw budget for the
  ten surface roles; the icon module and `icons.json` are budgeted.
- A public-surface snapshot per release (`tests/public-surface/`) fails on
  any unrecorded change of a name; the release workflow checks the tarball's
  and the wheel's contents, and publishes `vX.Y.Z-rc.N` tags as pre-releases
  when a release needs one.

## Removed / Renamed

- None.

## Artifacts

npm tarball, Python wheel, `SHA256SUMS` and provenance attestations. The
`v0.7.0` tag is the Swift Package release; its diff is additions only: `r28`,
the four Button colours and seven surface colours.
