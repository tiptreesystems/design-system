# Android local verification — 2026-11-03

Engineering evidence for [Android export #4](https://github.com/tiptreesystems/design-system/issues/4).
This is an unpublished candidate, not designer approval, a release or production adoption.
Local verification and cleanup were completed before submission for upstream review.
No release, tag or registry publication is part of this submission.

## Recorded inputs

| Checkout | Local task branch | Base commit |
|---|---|---|
| design-system | `tt/android-exports` | `3669918e7cb26f8b2ebae66b8c7af88951ca94cf` (v0.10.0) |
| isolated platform-android worktree | `tt/design-system-android` | `a72fb9775822f3427bc0cd6164cb27187d5ea768` |
| consumer platform-core submodule | pinned 0.1.0 | `97ded14a7587eeaae3e10829533e5f4975aa55ff` |

The live Android checkout's concurrent `feat/chat-experience` work was preserved.
The integration proof uses the recorded committed baseline, not that unfinished work.
Canonical `tokens/tokens.json`, `icons/icons.json` and generated Swift sources are unchanged.
The design-system changes are submitted for review; the isolated Android consumer
proof remains local and uncommitted.

## Passing local gates

| Gate | Result |
|---|---|
| `npm run ci` | 64 Node tests (including 7 Android tests), 5 Python tests; no failures/skips; source parity and all payload budgets passed |
| Existing Swift package | Signing-free generic iOS build succeeded |
| Existing npm/wheel artifacts | Candidate tarball and Python wheel passed `scripts/check_artifacts.py` |
| Android library | Debug/release AARs, test APK, 3 JVM tests, lint and candidate archive passed |
| Library on Pixel 10 emulator, API 37 | 4 instrumentation tests; no failures/errors/skips |
| Native/SVG icon comparison | All 1,572 comparisons passed: 131 glyphs × 3 sizes × 2 densities × 2 themes |
| Isolated Althea consumer | Debug APK/test APK, 46 JVM tests, lint and 27 emulator tests passed; no test failures/errors/skips |
| Workflow syntax | CI/release YAML parsed; embedded shell steps passed `bash -n`; remote Actions were not run |

The library has zero lint errors and two Compose BOM update warnings. The consumer
has zero errors and 22 warnings: dependency updates (9), unused resources (7),
icon formats (3), Kotlin extension suggestions (2), and a modifier parameter (1).
These warnings were retained; this proof does not claim a warning-free application.

Builds used the installed Android Studio JDK 25, Gradle 9.8.2, AGP 9.5.0,
SDK 37 and Compose BOM 2026.02.01. Library Java bytecode targets 17; the proposed
CI job uses JDK 21. Tests explicitly selected `emulator-5554`; the connected
physical phone was not used. No new emulator or browser was downloaded.

## Artifact receipt

Coordinate: `com.tiptreesystems:design-system-android:0.10.0-android.local`.
The canonical source version remains 0.10.0. This new artifact is not attached
to that existing release; the maintainer chooses its eventual release version.

| Measurement | Actual bytes | Budget bytes |
|---|---:|---:|
| Generated Kotlin/XML/notices/registry | 286,751 | 327,680 |
| Generated payload, Brotli | 38,153 | 49,152 |
| Release AAR | 139,072 | 196,608 |
| Maven-layout ZIP | 182,532 | 327,680 |

Archive: `android/build/candidate/tiptree-design-system-android-0.10.0-android.local-maven.zip`.

SHA-256:

```text
3b0323a0cc936967594d2e4b1e5c6999bec4e6ff281f00e0b99bf8b8cef1d520
```

The artifact checker verified AAR classes/resources, byte-exact notices and icon
provenance, generated sources, Maven metadata/dependencies and SHA-256/SHA-512
sidecars. The integration resolves the staged Maven artifact through an explicit
environment variable and exact version catalog pin; it does not copy library
sources into Althea or publish into a global Maven cache.

## Rendering and integration review

The generated painter preserves fixed 1.5 dp strokes and sanctioned 1 dp details
at 16/20/40 dp. Its native circle/ellipse conics retain the SVG geometry. The
comparison used canonical SVGs in an already-installed Chromium headless shell;
the largest per-glyph mean RGB difference was **0.9218954%**, below the 2% edge
rasterization allowance. Worst case: `check-circle`, dark, 20 dp, density 1.
Light/dark contact sheets were visually inspected for missing shapes, clipping
and stroke behavior; mechanical comparison complements that review.

Review captures at density 1 (each glyph is shown at 16/20/40 dp):

| Theme | Native Compose | Canonical SVG |
|---|---|---|
| Light | [Native sheet](android-icons/native-light-1x.png) | [Chromium sheet](android-icons/web-light-1x.png) |
| Dark | [Native sheet](android-icons/native-dark-1x.png) | [Chromium sheet](android-icons/web-dark-1x.png) |

Each row contains six glyphs, ordered by [catalog names](android-icons/names.txt).
The [comparison receipt](android-icons/comparison.json) covers both densities.
Full-resolution density-2 sheets and differences can be regenerated locally.

Additional reproducible local files (ignored build outputs):

- `android/build/icon-parity/`: canonical/native/difference contact sheets,
  `names.txt` and `comparison.json`.
- `android/design-system/build/reports/`: library tests and lint.
- Consumer `app/build/reports/`: Althea tests and lint.
- Consumer `app/build/outputs/connected_android_test_additional_output/`:
  retained `ui-captures/` for auth review/verification, chat, sessions and
  session status screens in light/dark appearances.

The consumer delegates its palette, typography and shapes to `TiptreeTheme`,
injects its bundled Inter font, references the packaged XML splash color and
uses shared icons for Back and the empty-conversation action. The old local
color generator and duplicated design-system notices were removed. Brand marks,
launcher configuration, screen layouts and product logic remain app-owned.

Auth verification/review, chat, sessions and session-status captures were inspected.
Back remains above the auth form and the shared glyph renders correctly. These
fixture captures do not validate activity window chrome: light-screen status icons
have low contrast, and the standalone chat fixture places its top label under
the status bar because it does not mount the product scaffold. Full-activity
window/inset review remains necessary before treating these as release screenshots.

## Findings resolved during implementation and review

- Scaling the canvas before stroking caused measurable small-icon differences.
  Transforming the paths first and then drawing fixed-width strokes resolved
  the failure without relaxing the comparison threshold.
- Generator regression cases now reject empty/hex easing arguments, float
  overflow/underflow and malformed units. Scientific notation remains valid
  Kotlin. Omitted SVG circle/ellipse centers correctly default to zero.
- Canonical heading family lists now choose the injected font slot instead of
  silently keeping a hardcoded heading-family assumption.
- Compose uses nonlinear font scaling and separates visible control bounds from
  touch bounds. Tests assert the measured line-height ratio and 48 dp touch area,
  rather than an incorrect linear scale or 40 dp visual bound.
- API 37 required a current Espresso dependency; Lifecycle 2.9.4's lint artifact
  called removed AGP APIs. Espresso 3.7.0 and a Lifecycle 2.10.0 minimum constraint
  resolved those compatibility failures.
- Reuse review consolidated duplicate consumer capture helpers and uses retained
  test storage, so AGP cleanup no longer deletes screenshots before inspection.
- Quality review checked generators, adapter mappings, packaging, workflows,
  consumer integration and the complete task diff, including untracked files.
- Efficiency review confirmed lazy glyph initialization/path parsing and cached
  transformed paths, theme conversion and typography; no runtime SVG dependency.

## Remaining boundaries

Only API 37 was exercised; the declared minimum API 23 was not run. The physical
device, release minification and remote CI remain untested. Backend OAuth was
not retested because these tests use local fixtures. Consumer screenshots are
engineering layout evidence, not visual approval of the theme mapping or app
system bars. Font-family defaults, Material mappings and native shadow policy
remain explicit review items in `android/README.md`. Maintainer/design review,
release numbering and integration with concurrent Android work must precede
production adoption.

## Standalone codex-simplify follow-up

Three independent local passes reviewed reuse, quality and efficiency across
the same 48 authored files selected from unstaged changes and task-related
untracked files in both task branches. Generated exports, imported wrapper
launchers/binaries and build output were excluded; no prior-commit fallback
was needed. Findings were combined before applying these four code changes:

| Lens | Exact file | Change |
|---|---|---|
| Reuse | `scripts/build-android.mjs` | Read the icon registry once; use that same snapshot for generation and bundled provenance. |
| Reuse / efficiency | `scripts/android-tokens.mjs` | Compile numeric validation patterns once and reuse them; calculate float conversion once per value. Validation rules and emitted values are unchanged. |
| Quality / efficiency | `android/design-system/src/androidTest/kotlin/com/tiptreesystems/designsystem/TiptreeRenderingTest.kt` | Remove the unused background argument and transparent no-op draw. Scope contact-sheet and per-glyph bitmap ownership with cleanup in `finally`. |
| Efficiency | `scripts/check_android_artifact.py` | Decompress each primary archive entry once and reuse its bytes for both checksums and content checks. All assertions remain. |

This receipt is the only documentation edit in the cleanup. Consumer files,
public APIs, runtime library code, canonical sources and generated bytes are
unchanged. No additional test cases were needed: the existing malformed-input,
source-parity, artifact and all-glyph rendering checks exercise these edits.

Rejected changes: a broader painter/theme rewrite would replace existing lazy
path parsing, transformed-path caching and remembered theme conversion without
fixing duplication. An extra stroke-style cache would add density-dependent
state without a measured need. A generic filesystem traversal abstraction or
token-classification cache would add machinery to small generation-only loops.
The existing explicit code was retained.

The edits invalidated generator/validation results and the instrumentation
capture receipt. The standalone pass completed the affected checks:

- `npm run ci`: all 64 Node and 5 Python tests passed, along with exact source
  parity and unchanged payload budgets.
- `check_android_artifact.py`: passed against the same ZIP and SHA-256 recorded
  above; sources, notices, metadata and both checksum algorithms remain checked.
- Library debug/release builds, test APK and lint passed. Lint remains at zero
  errors and two dependency-update warnings. The 3 JVM tests were up to date
  with unchanged tested inputs; 4 instrumentation tests reran on the Pixel
  emulator with zero failures/errors/skips.
- The new native captures passed all 1,572 SVG comparisons and all four PNG
  sheets were byte-identical to their pre-cleanup captures. Canonical web
  reference images were reused because their sources and rendering script did
  not change.
- The complete cleanup diff was reviewed against a pre-edit snapshot and
  `git diff --check` passed. All consumer file hashes match that snapshot;
  its prior 46 JVM/27 emulator tests, build and lint results remain applicable.
  The Swift/npm/wheel evidence also remains applicable to unchanged outputs.

No commit, push, PR or publication was performed during this follow-up.

For upstream submission, the staged whitespace check excludes only the imported
`android/gradlew.bat` (its original CRLF endings) and generated CC-BY licence
(the canonical licence's extra final newline). Both were separately checked
byte-for-byte against their originals; all other staged files pass. Neither
upstream file was rewritten merely to normalize whitespace.
