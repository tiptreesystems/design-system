# Using the design system

The current production contract is primitives plus one theme policy. No shared
component CSS is published. Althea is the first consumer and uses an alias adapter:
its established token names remain stable while their values flow from `--tt-*`.

## Rules for every consumer

1. Pin an immutable GitHub Release artifact URL and commit its lockfile or hash.
2. Import `primitives.css` plus exactly one theme file.
3. Alias existing app tokens onto `--tt-*`; never replace an app's entire `:root`.
4. Keep consumer dark blocks at `:root[data-theme='dark']`. A bare attribute
   selector can lose to later `:root` declarations by source order.
5. Request shared values here. Deliberate sub-brand overrides live in `themes/`,
   never as unexplained app-local forks.

## JS-bundled applications

Pin the exact release asset rather than a floating registry range:

```json
{
  "dependencies": {
    "@tiptree/design-system": "https://github.com/tiptreesystems/design-system/releases/download/v0.4.0/tiptree-design-system-0.4.0.tgz"
  }
}
```

Import the chosen polarity in every CSS entry that needs tokens:

```css
@import url('@tiptree/design-system/primitives.css');
@import url('@tiptree/design-system/themes/light-default.css');

:root {
  --existing-app-canvas: var(--tt-color-bg-primary);
  --existing-app-text: var(--tt-color-text-primary);
}
```

`light-default.css` paints light at `:root`, opts that light paint out of browser
Auto Dark with `color-scheme: only light`, and exposes dark values under
`[data-theme='dark']`. `dark-default.css` reverses the default polarity.
`explicit.css` emits only attribute-scoped blocks.

## Python consumers

The wheel exposes resolved values for media pipelines and optional
content-addressed Flask composition:

```python
from tiptree_ui import for_brand
from tiptree_ui.blueprint import create_blueprint, stylesheet_tags

dark = for_brand("tiptree", theme="dark")
accent = dark["color-accent"]

app.register_blueprint(create_blueprint(components=[], theme="light-default"))
head_html = stylesheet_tags(components=[], theme="light-default")
```

The empty component list is intentional until a production consumer graduates a
shared component. The manifest remains the stable composition mechanism for that
future growth.

## Swift Package consumers

For iOS, the immutable Git release version and committed `Package.resolved`
replace the release-asset URL and lockfile/hash rule above. The CSS import,
alias, and selector rules do not apply to native consumers.

Add the repository URL in Xcode and select an immutable release version:

```text
https://github.com/tiptreesystems/design-system.git
```

Link the `TiptreeDesignSystem` product to every target that imports it, then use
the generated namespace through an app-owned semantic adapter:

```swift
import TiptreeDesignSystem

let accent = TiptreeTokens.Colors.colorAccent
```

Commit `Package.resolved`. Native components and application-specific semantic
aliases remain app-local; the package currently publishes tokens only. Package
consumers do not run Node or the token generator.

## Static sites

A static site with a build step may compose primitives plus one theme into a
content-hashed build artifact. A site without one vendors verbatim copies of
`primitives.css` and one theme file from the release, pinned by a test that
checks their sha256s and that every page links them with a version query; that
is the sanctioned form, not a fork (`RELEASING.md`, Static sites).

## Components

There are currently no published components. A shared component is added only
after a real repository consumes the proposed contract and the migration evidence
passes `docs/ADDING_A_COMPONENT.md`. Dormant Button research is historical input,
not an importable API.
