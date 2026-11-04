# Swift icon export

Implementation for [#3](https://github.com/tiptreesystems/design-system/issues/3).
These APIs first ship in **v0.11.0**; v0.10.0 and earlier do not contain them.
Pin the release only after its tag. iOS app adoption is separate ([platform-ios#75](https://github.com/tiptreesystems/platform-ios/issues/75)).

## Native representation and ownership

`icons/icons.json` remains the only artwork/provenance source. The build generates
all 131 canonical drawings as native SwiftUI `Path` operations and a discoverable
`TiptreeGlyph` enum. Curves, native conics, fills (including even-odd), round caps,
joins, cuts and optical corrections come from that registry. There is no runtime
SVG parser, Node step, network fetch, app-local SVG copy or additional dependency.
Paths are cached lazily per glyph; tint and layout remain dynamic.

The exporter uses the existing SVG allowlist and shared Android/Swift geometry.
It compiles `M/L/H/V/C/A/Z` (absolute and relative), including repeated arguments.
Unsupported commands fail generation so a new form requires a tested compiler
change. It does not silently approximate unsupported artwork.

`TiptreeIcon` draws in a square of positive, finite points (20 by default), mapping
the 24-unit viewBox to that square **before stroking**. CSS px maps to iOS pt:
the normal stroke remains 1.5 pt at 16, 20 and larger sizes; sanctioned sparkle
parts in `moon-stars` and `stars-minimalistic` remain 1 pt. Miter limit is SVG's 4.
Fills scale with geometry. The viewport clips at its bounds, like the web SVG.
Avoid applying `scaleEffect` to resize an icon: it also scales the finished stroke.

The Swift token export is unchanged: this issue adds no fonts, typography,
spacing, component library, brand assets or application role mapping.

## SwiftUI usage and previews

After adding the released Swift Package product `TiptreeDesignSystem`:

```swift
import SwiftUI
import TiptreeDesignSystem

struct NewItemButton: View {
    @ScaledMetric(relativeTo: .body) private var iconSize = 20.0
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            TiptreeIcon(.add, size: iconSize)
                .foregroundStyle(TiptreeTokens.Colors.colorTextPrimary)
                .frame(minWidth: 44, minHeight: 44)
                .contentShape(Rectangle())
        }
        .accessibilityLabel("New item")
    }
}
```

- **Decorative by default:** omit `label`. The icon is hidden from accessibility;
  a button or surrounding `Label` supplies its localized name once.
- **Meaningful standalone image:** `TiptreeIcon(.moonStars, label: Text("Night mode"))`
  exposes an image trait and localized label. The library never derives a spoken
  label from a drawing name.
- **RTL:** `.arrowLeft` always draws left by default. For a semantic *back* role,
  pass `mirrorsInRightToLeft: true`; only a right-to-left layout then reflects it.
  Do not mirror non-directional drawings or logos automatically.
- **Size versus touch:** 16/20 pt describes visible geometry, not a touch target.
  The host owns at least a 44 x 44 pt interactive area and Dynamic Type policy.
  Use a host `@ScaledMetric` as above when the visible icon should grow with text.
- **Tint:** use `.foregroundStyle(...)`, including semantic colors and supported
  SwiftUI shape styles. The drawing uses the inherited foreground shading.
- **Previews:** open `TiptreeIcon.swift` for representative sizes or
  `tests/TiptreeDesignSystemTests/IconContactSheet.swift` for the complete catalog.

## Names, compatibility and attribution

Enum cases are canonical kebab-case names converted to lower camel case
(`.moonStars`, `.plusHeavy`). `rawValue` preserves the canonical name;
`TiptreeGlyph.allCases` contains canonical drawings only. `TiptreeGlyph.named(_:)`
resolves canonical names and registry aliases; unknown names return `nil`.
Names that collide with each other or the generated API fail the source gate.

The catalog remains provisional. A registry rename is exported as a deprecated
Swift static alias with the registry's `since` version and a compiler rename hint.
Aliases are not independent enum cases. Withdrawals and removals follow the same
versioned registry/release policy as web; hosts pin an exact version, review release
notes and update their app-owned role maps deliberately. This export adds no
permanent-stability promise and no aliases from `prototype-names.json`.
The existing withdrawal rule also applies to the native form: the first minor
cut after the Althea landing PR closes unmerged or is reverted withdraws the
export; a minor cut while that PR remains open withdraws nothing. See the
[operating guide](OPERATING_GUIDE.md) and release notes.

The SwiftPM resource bundle contains `Notices/NOTICE`, `Notices/LICENSE`,
`Notices/LICENSE-CC-BY-4.0.txt` and `Notices/icons.json`, copied byte-for-byte.
The last file records every glyph's source, license and modifications, including
Solar by 480 Design under CC BY 4.0. Use `TiptreeIconResources.notice`,
`.apacheLicense`, `.creativeCommonsLicense` and `.registry` for acknowledgement
UI or exports. These optional URLs avoid exposing SwiftPM's bundle naming as API;
package tests require all four to exist. Preserve the bundle when distributing
the app. Brand marks and the unknown-provenance `comment` extension are excluded.

## Verification and distribution

```sh
npm run ci
xcodebuild build -scheme TiptreeDesignSystem -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO
python3 scripts/test-swift-icons.py /tmp/swift-icon-proof
TT_PARITY_BROWSER='/path/to/installed/Chromium' node scripts/android-icon-reference.mjs /tmp/swift-icon-proof
python3 scripts/compare-swift-icons.py /tmp/swift-icon-proof
```

The canonical reference generator is shared with Android despite its historical
name. The Swift comparison additionally bounds antialiasing differences and
requires visible ink in both renders to stay within one physical pixel. They render canonical SVG and compare all glyphs at 16/20/40, light/dark,
1x/2x. Pillow is required only for the optional engineering comparison, never by
consumers. `TT_SWIFT_DESTINATION` selects an installed simulator; the test runner
does not download one. Use a new output directory for each retained result.

Committed generated Swift files and notices are checked **before** regeneration.
Missing/extra files and stale bytes fail `npm run ci`. Generation and bundled
notices have separate budgets in `swift-icons.budgets.json`; existing web and
Android budgets remain unchanged. Swift build/test gates also run on release
tags. The tagged package contains its source/resources and builds without Node.
No files are added to an already published tag or release. Measured local proof,
contact sheets and remaining review limits are in
[the verification receipt](evidence/swift-icons-local-verification.md).
