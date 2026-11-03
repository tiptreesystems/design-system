# Swift icon export: local verification

2026-11-03. Issue [#3](https://github.com/tiptreesystems/design-system/issues/3).
Branch `tt/swift-icons`, stacked on Android PR #5 head
`4cf546da5268de0ce94d789bd6e9c4ce74afb02d`; canonical release baseline
`3669918e7cb26f8b2ebae66b8c7af88951ca94cf` (v0.10.0).

## Scope and measured results

- All 131 canonical glyphs export through `TiptreeGlyph` and `TiptreeIcon`.
  Node checks exercise the compiler, malformed paths, arcs, identifier collisions,
  alias generation and missing/extra/stale source detection. Swift tests compare
  the enum/cuts/aliases against the bundled canonical registry.
- `npm run ci`: **69 Node tests and 5 Python contract tests passed**, including
  unchanged web and Android budgets, generated-source parity and Swift budgets.
- `python3 -m unittest discover -s tests -p test_icon_parity.py`: **2 tests passed**,
  covering missing/extra/displaced/thickened ink, both themes, invalid catalogs
  and truncated comparison sheets.
- `python3 scripts/test-swift-icons.py <fresh-output>`: **5 Swift tests passed**
  on the installed iPhone 18 Pro, iOS 27.2 simulator, Xcode 27.2 / Swift 6.4.2.
  Tests verify bundled attribution, catalog completeness, sanctioned thin strokes,
  fixed-width rendering at 16/20/40 pt and 1x/2x/3x, foreground tint, opt-in RTL
  reflection and complete native contact sheets. The runner successfully exported
  all five named attachments from its `.xcresult` after simplification.
- A fresh directory containing only `Package.swift`, `Sources/` and the declared
  Swift test sources built for a generic iOS device with signing disabled and
  `PATH=/usr/bin:/bin:/usr/sbin:/sbin` (no Node). There is no package dependency,
  source-generation plugin, SVG conversion or runtime download.
- `GeneratedTokens.swift`, canonical tokens/icons, and **all generated Android
  code/resources are byte-identical to the branch base**. Running the refactored
  comparison against the retained Android proof gave the same 1,572 passing
  results and byte-identical JSON as the original comparator. The optional
  visual-tool refactor does not change Android's 2% tolerance.

| Swift payload | Measured | Gate |
|---|---:|---:|
| Generated icon Swift and notices, raw | 450,318 B | 524,288 B |
| Same payload, concatenated Brotli | 53,151 B | 65,536 B |
| Bundled notice/registry files | 140,666 B | 145,000 B |
| Built resource bundle, including generated Info.plist | 141,398 B | informational |
| Additional authored Swift source | 3,665 B | informational |

The original token source is 48,039 B; all package source/resources now total
502,022 B. Brotli describes source distribution, not an installed app binary.
Linked app size depends on optimization/dead stripping and was not measured;
this task does not migrate or build a product app.

## Native/web rendering proof

The canonical SVGs were rendered with an already installed Chromium. Native
captures use the actual `TiptreeIcon` view through SwiftUI `ImageRenderer`.
There are **1,572 comparisons: 131 glyphs × 3 sizes × 2 themes × 2 densities**.
All pass the Swift profile, with zero ink-support failures.

Apple and Chromium do not rasterize small curves/caps identically. The original
Android 2% mean-RGB criterion failed 392 Swift comparisons, despite identical
geometry/colors. The largest measured error is **4.6743%**, `server-2`, dark,
16 pt at 1x. At 40 pt/2x the maximum is **1.2963%**. A display-scale experiment
did not change this; changing to separate SwiftUI Shapes did not improve parity
and was discarded. No artwork was modified to match one rasterizer.

The explicit Swift acceptance profile is:

- Mean RGB error over the actual viewport: at most **5% at 16/20 pt**, **2.5% at
  40 pt/1x**, and **2% at 40 pt/2x**.
- In addition, every pixel with at least 25% ink coverage must have corresponding
  ink in the other render within **one physical pixel**, in both directions.
  This catches geometry drift independently of edge-color allowance. Regression
  tests deliberately reject missing ink, extra ink, two-pixel displacement and
  an enlarged stroke. A separate native raster test verifies stroke coverage
  stays constant as geometry grows; it permits a quarter pixel of antialiasing
  coverage error rather than assuming coverage is mathematically exact.

This is an engineering comparison profile for maintainer/visual review, not a
claim of pixel equality or designer approval. Complete 1x sheets below include
16, 20 and 40 pt variants for each glyph in [catalog order](swift-icons/names.txt).
The [comparison report](swift-icons/comparison.json) includes the worst cases.
The local run also retained both 2x sheets, difference images and `.xcresult`;
CI retains native sheets and its test result as artifacts.

| Theme | Native SwiftUI | Canonical web |
|---|---|---|
| Light | [Native sheet](swift-icons/native-light-1x.png) | [Web sheet](swift-icons/web-light-1x.png) |
| Dark | [Native sheet](swift-icons/native-dark-1x.png) | [Web sheet](swift-icons/web-dark-1x.png) |

Engineering visual inspection covered every glyph, with close checks of small
caps/curves, `plus-heavy`, filled pins, the rounded `table-header`, thin sparkles
and viewport bounds. No missing glyph, unexpected fill or clipping was found.
Designer/maintainer visual approval remains pending. Accessibility defaults,
image labels, semantic RTL, Dynamic Type ownership and 44 pt controls are
documented; VoiceOver in a product app remains part of consumer adoption.

## codex-simplify and final review

Three independent passes examined tracked changes and task-related untracked
authored files, excluding generated sources, licenses, images and build output.

- **Reuse:** consolidated duplicate native generated-directory checking/writing
  in `scripts/generated-native-files.mjs`, used by `scripts/build-android.mjs`
  and `scripts/build-swift-icons.mjs`. Existing SVG validation, shared geometry
  and common image-comparison code are reused rather than duplicated.
- **Quality:** clarified attachment-name matching in `scripts/test-swift-icons.py`;
  `scripts/icon_parity.py` now rejects empty/duplicate catalogs and incorrectly
  sized sheets. `tests/test_icon_parity.py` covers those false-pass risks.
- **Efficiency:** retained lazy per-glyph paths and foreground shading. No further
  performance change was justified; raster caching would complicate tint, density
  and layout while adding memory. No speculative parser expansion was added.

The cleanup invalidated native generation checks, comparator results and the
test-runner/export receipt. All were rerun successfully; generated native bytes
were unchanged. The Swift library and clean-build inputs did not change during
cleanup, so their clean-package proof remains applicable.

The complete task diff was reviewed for source ownership, generator determinism,
resource inclusion, release/CI integration, naming/alias behavior, stroke/fill/RTL
semantics, test strength and scope. The test target explicitly names the lowercase
`tests/` path so case-sensitive filesystems work. Exact copied CC BY license bytes
include their canonical trailing blank line; that generated file is the only
task-specific `git diff --check` exclusion. No token/artwork edits, app migration,
registry publication, release tag or designer ruling is included.
