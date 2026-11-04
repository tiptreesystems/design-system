# Android library

Proposed in design-system #4 and merged in #5; it first ships in v0.11.0. It
has not been adopted on a consumer's main branch. v0.10.0 and earlier releases
have no Android artifact. Do not claim designer approval from the engineering
checks.

The library is generated from `tokens/tokens.json` and `icons/icons.json`.
It requires Android API 23+ and Compose; it does not use Swift, JNI, a runtime
SVG dependency, Node in the consuming build, or runtime downloads. Building
the candidate uses JDK 17+, SDK 37, the checked-in Gradle wrapper and Node 20+
for generation. The project has no npm dependencies.

## Build and verify locally

From the repository root, with `ANDROID_HOME` pointing at the installed SDK:

```sh
npm run ci
android/gradlew -p android :design-system:assembleDebug :design-system:assembleRelease \
  :design-system:testDebugUnitTest :design-system:lintDebug \
  :design-system:assembleDebugAndroidTest :design-system:candidateArchive
ANDROID_SERIAL=emulator-5554 android/gradlew -p android :design-system:connectedDebugAndroidTest
python3 scripts/check_android_artifact.py android/build/candidate/*-maven.zip
```

`candidateArchive` writes only to `android/build/`. Its default artifact version
is `<canonical-version>-android.local`; the canonical source version remains
unchanged. This deliberately cannot masquerade as an already-published release.
An approved future release passes `-PandroidVersion=X.Y.Z` after all canonical
version surfaces have advanced together. Generated Kotlin, XML resources and
notices are committed under `design-system/src/main/generated/`; edit generators,
then run `npm run build`. `npm run ci` fails on stale, missing or extra exports
before regenerating anything. Native compilation remains a separate required gate.

## Gradle consumption and distribution

Each approved release retains a Maven-layout ZIP (AAR, sources, POM, Gradle
module metadata and checksums), `SHA256SUMS` and provenance on GitHub Releases.
After a stable release, the workflow also serves its exact files through this
repository's GitHub Pages site. No Maven Central or GitHub Packages publication
is required. Gradle reads the standard Maven endpoint directly; consuming builds
need no Python, GitHub CLI, custom downloader, credentials or copied Kotlin sources.

After the first Android release and Pages setup in `RELEASING.md`:

```kotlin
// settings.gradle.kts, inside dependencyResolutionManagement.repositories
exclusiveContent {
    forRepository {
        maven {
            name = "TiptreeDesignSystem"
            url = uri("https://tiptreesystems.github.io/design-system/maven")
        }
    }
    filter { includeModule("com.tiptreesystems", "design-system-android") }
}
// app/build.gradle.kts — accept stable 0.x releases, never cross into 1.x
implementation("com.tiptreesystems:design-system-android") {
    version { strictly("[0.11.0,1.0.0)") }
}
```

The equivalent version-catalog requirement is
`tiptreeDesignSystem = { strictly = "[0.11.0,1.0.0)" }`. 0.11.0 is the first
release with an Android artifact.
The feed lists stable releases only; RCs remain downloadable ZIPs for explicit
candidate testing. A strict upper bound also rejects a transitive dependency
that would require the next major. New 0.x releases can still contain the
provisional API changes described by the catalog policy; review their release notes.

Gradle normally caches dynamic version selections for 24 hours. Use
`--refresh-dependencies` to resolve a newer compatible release immediately,
`--offline` to reuse cached dependencies, and `:app:dependencyInsight --dependency
design-system-android --configuration debugRuntimeClasspath` to inspect the result.
Offline use requires a prior successful resolution. A new dependency affects
the next build, not an already installed application. Consumers that require a
repeatable release build can use Gradle dependency locking and verification.

Before that first release, or for local integration, use `android/build/maven`
or the verified extracted ZIP as the repository URL and select the exact candidate:

```kotlin
implementation("com.tiptreesystems:design-system-android:0.11.0-android.local")
```

Use `--refresh-dependencies` when rebuilding the same unpublished local version.
No machine-specific path or local candidate pin belongs in a production release.
The Compose BOM matches the first Android consumer (2026.02.01). Lifecycle runtime
has a 2.10.0 minimum constraint because 2.9.4's custom lint checks use APIs removed
in AGP 9.5. Dependency-update notices are informational; code lint errors still fail.

## API and units

```kotlin
TiptreeTheme(darkTheme = isSystemInDarkTheme(), fonts = TiptreeFonts(sans = appInter)) {
    Text("Hello", color = TiptreeTheme.colors.colorTextPrimary,
        style = TiptreeTheme.typography.regular)
    TiptreeIcon(TiptreeIcons.AltArrowLeft, contentDescription = "Back", autoMirror = true)
}
```

| API | Contract |
|---|---|
| `TiptreeTokens.Colors` | Primitive colors; RGBA source alpha becomes Android ARGB without loss. |
| `TiptreeColors.light/dark`, `TiptreeTheme.colors` | All cross-platform semantic colors. Source overlay alpha remains intact. |
| `TiptreeTokens.Radius`, `.Space`, `.Size`, `.Stroke` | `Dp`: 1 CSS px maps to 1 dp; 1 rem maps to 16 dp. These do not scale with font size. |
| `TiptreeTokens.Type` | Font sizes in sp; relative letter spacing in em; line heights as multipliers; exact numeric weights. Native text scales with the user's Android font setting. |
| `TiptreeTokens.FontFamilies` | Canonical family-name lists, not downloaded or bundled fonts. |
| `TiptreeTokens.Duration`, `.Easing` | Integer milliseconds and native cubic Bézier curves. |
| `TiptreeTheme.typography` | Body/heading styles from the shared scale and injected families; Material mapping is a convenience layer. |

The declared cross-platform set (148 tokens at this baseline) is complete. The
Android adaptation additionally covers 74 existing web-only names: typography,
spacing, control/glyph sizes, easing and border/focus geometry. It does not change
their canonical applicability or add values. The 14 exclusions are seven shadow
recipes, six browser stacking levels and scrollbar-thumb color. CSS multi-layer
shadow blur/spread has no automatic Material elevation equivalent; native shadow
design remains a separate decision. Visual control heights are not touch-target
sizes; consumers keep accessible targets and allow text-driven layout growth.

`TiptreeFonts` defaults to explicit platform sans/serif/monospace fallbacks. Those
are not the branded fonts. Applications supply Inter, Literata and their code
font as needed, including variable-font weight axes. Display/page/title/section
use the serif slot; subheadings/body use sans. Display has no family token, so
its serif choice is an explicit candidate adapter policy. Neither font files nor
application layouts/components are shipped. Material's primary uses the link
role because it serves both text and controls. For a canonical primary-action
button, use `colorActionPrimaryBg/Fg` explicitly. The mapping composites the
translucent open surface over the canvas only for Material's opaque container;
the raw semantic token is always available unchanged. Shapes map to the existing
4/8/row/field/block radii. This adapter is an engineering proposal for review,
not a claim that Material components reproduce the web component contract.

## Icons, accessibility and provenance

`TiptreeIcons` exports every canonical drawing with PascalCase Kotlin names;
`named()` supports registry names and aliases and returns null for unknown names.
Aliases retain the registry's deprecation version. Renames/withdrawals follow
the provisional catalog policy in `docs/OPERATING_GUIDE.md`; names are not promised
permanent before 1.0. Do not use prototype role names as a shared API.

A generated path representation feeds a small Compose `Painter`. Geometry fits
the 24-unit grid; strokes remain 1.5 dp at 16, 20 or 40 dp, with the sanctioned
1 dp sparkle strokes preserved. Ordinary scaled vector drawables do not meet
that non-scaling-stroke contract. SVG primitives are converted upstream; Compose
parses only generated path data once per used glyph. There is no XML/SVG renderer
dependency and no conversion work on each frame. Filled/solid shapes, fill rules,
caps, joins and optical corrections come from the canonical registry.

Use `Modifier.size()` to select visual size; default is the shared large glyph
(20 dp). Labels are contextual and localized by the app. Pass null for decoration
or when a parent already provides the label. Only directional actions opt in to
RTL mirroring (`autoMirror = true`); artwork itself is not automatically mirrored.
Place interactive icons in accessible controls such as `IconButton`, with touch
targets independent of the visible glyph. Brand/provider marks and adaptive
launcher configuration remain app-owned. Unknown-provenance extensions stay out.

The AAR includes `assets/tiptree-design-system/NOTICE`, `LICENSE`,
`LICENSE-CC-BY-4.0.txt` and the byte-exact canonical `icons.json` with per-glyph
provenance/modifications. Applications must expose those notices in their usual
licenses/acknowledgements surface; bundled notices alone do not create that UI.

## Rendering proof and previews

Open `TiptreePreviews.kt` in Android Studio for light, dark and large-text previews.
All previews and instrumentation tests are backend-free. The emulator suite
renders every icon at 16/20/40 dp and densities 1/2, checks fixed stroke coverage,
tint, RTL opt-in, labels/touch targets, theme changes and font scaling.

After instrumentation, compare Gradle's retained contact sheets with canonical
SVGs rendered in an already-installed Chromium (the script downloads no browser):

```sh
TT_PARITY_BROWSER=/path/to/chromium node scripts/android-icon-reference.mjs
python3 scripts/compare-android-icons.py android/build/icon-parity \
  android/design-system/build/outputs/connected_android_test_additional_output
```

The comparison requires Pillow. Each group of three cells is 16/20/40; groups
follow `names.txt` in six columns. Review the sheets and difference images. The
mechanical threshold is 2% mean RGB error per glyph viewport for rasterizer edge
differences; it complements the fixed-stroke assertions and human review.
Artifact/source budgets are in `budgets.json` and checked without changing the
existing web budgets. `docs/evidence/android-local-verification.md` records the
actual local results and remaining review limits.
