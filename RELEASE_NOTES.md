# v0.11.0

Two native exports, from issues #3 and #4 (PRs #6 and #5), recorded in the
2026-11-03 and 2026-11-04 entries in `docs/DECISION_LEDGER.md`: the icon
catalog for SwiftUI in the Swift Package, and the first Android library, with
tokens, a Compose theme and the icon catalog. No token value, role, glyph or
web file changes; nothing is removed or renamed.

## Swift Package

- Added: `TiptreeIcon`, a SwiftUI view that draws any of the 131 canonical
  glyphs as native paths at 1.5 pt strokes (1 pt for the sanctioned sparkle
  parts) at every size, tinted by the foreground style, decorative unless
  given a `label`, mirrored in right-to-left layouts only when asked.
- Added: `TiptreeGlyph`, one case per canonical name in lower camel case
  (`.moonStars`); `rawValue` keeps the canonical name and `named(_:)` also
  resolves registry aliases.
- Added: `TiptreeIconResources` (`.notice`, `.apacheLicense`,
  `.creativeCommonsLicense`, `.registry`) over the bundled `Notices/`
  resources: `NOTICE`, both licences and the provenance registry, byte-exact.
- `TiptreeTokens` is unchanged. No runtime SVG parser, Node step or new
  dependency; iOS 17+ as before. See `docs/SWIFT_ICONS.md`.

## Android (new)

- Added: `com.tiptreesystems:design-system-android:0.11.0`, an AAR for API
  23+ with Compose: `TiptreeTokens` (primitives, 148 cross-platform names
  and 74 web-only names in dp, sp, em, milliseconds and Bézier easing),
  `TiptreeColors.light` / `.dark`, `TiptreeTheme` with its Material mapping
  and `TiptreeFonts`, and `TiptreeIcons` / `TiptreeIcon` for the 131 glyphs
  at fixed strokes. Shadows, stacking levels and the scrollbar thumb are not
  exported. Fonts are not bundled.
- The AAR carries `NOTICE`, both licences and the provenance registry under
  `assets/tiptree-design-system/`.
- Served from the Maven mirror at
  `https://tiptreesystems.github.io/design-system/maven` once the release
  workflow deploys it. See `android/README.md`.

## What each consumer does at its bump

- Althea, docs, Lacuna, marketing-site, website-v2: nothing. The tarball,
  the wheel and every generated CSS and icon file are unchanged apart from
  the version they name.
- platform-ios: nothing is required; the token diff is the version comment.
  Adopting the icons is platform-ios#75: link `TiptreeDesignSystem`, draw
  through `TiptreeIcon` behind the app's own role map, and show the bundled
  notices in the app's acknowledgements.
- platform-android: add the Maven mirror as an exclusive repository for
  `com.tiptreesystems`, require `[0.11.0,1.0.0)`, and show the bundled
  notices in the app's licences screen.
- Pin the release only after its tag.

## Removed / Renamed

Nothing.

## Artifacts

npm tarball, Python wheel, and, new in this release, the Android Maven ZIP
(`tiptree-design-system-android-0.11.0-maven.zip`: AAR, sources, POM, Gradle
module metadata and checksums), with `SHA256SUMS` and provenance attestations
over all three. The `v0.11.0` tag is the Swift Package release; its diff adds
the icon API and its resources and changes no token.
