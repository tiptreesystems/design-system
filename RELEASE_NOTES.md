# v0.9.0

Tokens and one glyph, from the Althea prototype's findings against 0.8.0 and
its open proposals, on Ivan's rulings and Richard's of 2026-10-13, all
recorded in the 2026-10-13 entry in `docs/DECISION_LEDGER.md`. Two colour
roles, three corner roles, two speeds and the `sort` glyph are new. Released
values change: the focus ring on paper, the tooltip, the dark primary action,
the box's rim while you write, the small text's line, the control heights
(now in rem) and the shadows' strengths. Nothing is removed or renamed.

## Tokens

- Changed: `font-line-height-small` `1.5` → `calc(22 / 14)`. Every text at
  14 stands on a line of 22 (21 before). Web-only.
- Changed: `control-hero`, `-large`, `-default` and `-small`, 56, 44, 36 and
  28px → 3.5, 2.75, 2.25 and 1.75rem: the same pixels at the default text
  size; at a larger text size a control grows with its words and its glyph.
- New corner roles over the ladder (cross-platform): `radius-block`
  (`{radius-20}`, a block that holds rows), `radius-field` (`{radius-16}`, a
  field and anything that is one) and `radius-row` (`{radius-12}`, a row or
  an item not inside a block, and a tip).
- New speeds (cross-platform): `speed-brisk` 0.15s, what opens (a tip, a
  menu, a dialog, a section), and `speed-slow` 0.4s, what Althea adds to the
  page arriving, beside `speed-quick` 0.1s and `speed-regular` 0.25s.
- `z-overlay` is now documented: a layer that floats without stopping the
  page, under the popovers. A modal's veil stands one under its dialog,
  `calc(var(--tt-z-dialog) - 1)`. No value changes.

## Roles

- Changed, light: `color-focus-ring` `#5e9cff` → the accent
  (`{color-accent}`, `#3c8286`), the ring every control draws: 4.33:1 on
  `color-bg-primary`, 3.92:1 on `color-bg-secondary` and 4.44:1 on white, up
  from 2.67:1. The dark ring keeps its value, now by reference to the accent.
- Changed: `color-surface-tooltip` → `brand-black` (`#1b1b1b`) in both
  themes, a note laid on the page (was black at 80% on paper and `stone-200`
  in the dark).
- New `color-text-on-tooltip`: the words on a tooltip, white in both themes
  (17.22:1). It resolves like `color-action-primary-fg` and is an alias of it.
- Changed, dark: `color-action-primary-bg` `#2e585a` → `teal-700`
  (`#3a5759`) and `-bg-hover` `#43696b` → `#4e686a` (teal-700 mixed 90% with
  white). White on them reads 7.81:1 and 5.98:1. Light is unchanged.
- Changed: `color-border-box-focus` → the accent in both themes (was
  `#bdbdb3` and white at 20%): the box's rim takes the accent while you write
  in it.
- New `color-mark-done`: a step that is done, the palette green
  (`{color-green}`, `#27a644`) in both themes, beside the other five marks.
  Draw it on the primary ground only: on paper it reads 3.09:1 on
  `color-bg-primary` and 2.80:1 on `color-bg-secondary`.
- Changed, web-only: the shadows at the strengths they were drawn, as
  `rgb(… / n%)` strings: light `shadow-lift`, `-block`, `-box` and
  `-overlay`; dark `shadow-lift` (which `-block` and `-box` read) and
  `-overlay`. Each layer moves by at most 0.2 of a point; nothing visible.
- A rule, no value change: `color-text-quaternary` is for marks beside words
  and disabled labels only. Words take `color-text-tertiary` or firmer, which
  reads 4.5:1 or more on both grounds in both themes; the quaternary ink
  reads 4.08:1 and 3.69:1 on paper.

## Icons

- New `sort` (Solar `sort-linear`): three lines, the longest first, for a
  filter. 131 glyphs. `sort-vertical`, the two arrows, is unchanged. Solar
  under CC BY 4.0, already credited in `NOTICE`.

## What each consumer does at its bump

- Every consumer: move any words off `color-text-quaternary` onto
  `color-text-tertiary`; keep the quaternary ink for marks and disabled
  labels. Draw `color-mark-done` on the primary ground only. Text at 14 that
  reads `font-line-height-small` gains a pixel of line (21 → 22); move any
  text at 14 that sits on another line onto `font-size-small` with
  `font-line-height-small`.
- Lacuna: its tooltip inks its words with `color-text-on-inverse`, which is
  the brand black in the dark; switch it to `color-text-on-tooltip`, or the
  dark tooltip is black on black. Its focus rings turn from blue to teal on
  paper, and its text at 14 that reads `font-line-height-small` (the
  highlights page's inputs) gains the pixel of line. Its vendored chat widget
  bakes the package's CSS in, and moves only when a widget is rebuilt from a
  frontend commit that pins 0.9.0; the wheel bump alone leaves it as is.
- docs: its words on the quaternary ink
  (`docs_server/web/src/styles/components/cards.css:66`, `code-block.css:27`,
  `collapsible-item.css:44`) move to the tertiary.
- website-v2 (and the homepage copy marketing-site carries): replace the
  vendored `primitives.css` and theme file byte for byte, the sha256s in the
  pin test and the `?v=0.9.0` queries. The focus ring on paper turns teal,
  small text gains a pixel of line, and controls grow above the default text
  size.
- Althea: the ring, the dark primary, the box's rim and the 22 line arrive
  through the roles it already aliases; map the sidebar filter's glyph to
  `sort`. A dark surface that reads `color-surface-tooltip` (the lightbox's
  veil) turns near-black: keep it or give it a role of its own.
- platform-ios: the Swift source gains nine identifiers and the changed
  colours below; it reads none of the changed roles today.
- Pin the release only after its tag.

## Removed / Renamed

- None.

## Artifacts

npm tarball, Python wheel, `SHA256SUMS` and provenance attestations. The
`v0.9.0` tag is the Swift Package release; its diff adds two colours
(`colorTextOnTooltip` and `colorMarkDone`, each with its `UIColor`),
`Radius.block`, `.field` and `.row`, and `Duration.brisk` and `.slow`, and
changes `colorFocusRing` (light), `colorSurfaceTooltip`,
`colorBorderBoxFocus` and, in the dark, `colorActionPrimaryBg` and
`colorActionPrimaryBgHover`.
