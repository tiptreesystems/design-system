# Using the design system (consumer guide)

For developers integrating a Tiptree app. Every recipe below was proven end-to-end in
the v0.2.0 integration slice (evidence: `DECISION_LEDGER.md`). Rollback commands per
consumer: `ROLLBACK.md`. Component markup contracts: `../specs/`.

## The rules that apply to every consumer

1. **Install a versioned artifact** (npm package or Python wheel). Never copy files.
2. **Compose, don't bulk-import:** `primitives.css` + **exactly one theme file** + the
   component files you use. `tokens.css` is a dark-default back-compat composition —
   **wrong for light-default apps (Althea, Lacuna)**; never import it there.
3. **Write the markup the spec defines** (e.g. `specs/button.md`) — element choice,
   classes, ARIA. Don't invent variants; ask for them (`ADDING_A_COMPONENT.md`).
4. **Never override `.tt-*` rules or hard-code brand values** in app CSS. Need a
   different look? That's a token/variant/theme request, not a local patch.
5. Upgrades arrive as version-bump PRs. One version everywhere — CSS, wheel, npm, and
   Swift tokens ship from the same tag.

## Python apps (Lacuna today; docs builder later)

```toml
# pyproject.toml
dependencies = ["tiptree-ui==0.2.0"]   # wheel: GitHub Release asset or vendored file
```

```python
# app factory — serves one immutable, content-hashed stylesheet
from tiptree_ui.blueprint import create_blueprint, stylesheet_tags
app.register_blueprint(create_blueprint(components=["button"], theme="light-default"))

# page <head> — same explicit args recompute the same hashed URL
head_html += stylesheet_tags(components=["button"], theme="light-default")
```

```python
# markup, per specs/button.md
f'<button class="tt-btn tt-btn--primary tt-btn--md" type="button">Save</button>'
```

Media pipelines (no Flask needed): `from tiptree_ui import for_brand` →
`for_brand("tiptree", theme="light")["color-accent"]` gives concrete hex for prompts
and renderers.

## JS-bundled apps (Althea; docs while it bundles)

```bash
npm install @tiptree/design-system        # or the tarball path pre-registry
```

```css
/* once per CSS entry bundle (public.css AND app.css in Althea) */
@import url('@tiptree/design-system/primitives.css');
@import url('@tiptree/design-system/themes/light-default.css');
@import url('@tiptree/design-system/components/button.css');
```

Components render the spec markup from your JS (hand-written today; bindings are
pending the API experiment). The default component build is **unlayered** on purpose —
it must beat legacy bare-element rules (`base.css button {...}`) by normal specificity.
The `layered/` variants exist only for hosts whose entire cascade is layered.

## Static sites (docs snapshot)

Compose one file at build time from the installed package's `manifest.json`
(primitives + theme + components, in manifest order), write it as
`tt.<contenthash>.css`, link it from the page. One composed bundle per page class —
never one `<link>` per component.

## iOS (platform-ios)

Copy the release's generated `GeneratedTokens.swift` (SwiftUI `Color` + UIKit
`UIColor`, `CGFloat` radii, `TimeInterval` durations — cross-platform tokens only).
Native components are not shared yet; keep building app-local SwiftUI on these
constants. WKWebViews should consume a small generated token sheet, never full
component CSS.

## Theming

Your app picks exactly one polarity file: `themes/light-default.css` (Althea, Lacuna),
`themes/dark-default.css` (hub-style), or `themes/explicit.css` (you control the
`data-theme` attribute yourself). Sub-brand looks are token overrides that live in THIS
repo (`themes/`), designer-ruled — never app-local CSS.
