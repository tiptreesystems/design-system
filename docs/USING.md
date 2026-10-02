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

## Corners, the hairline and surfaces

The corner ladder is 4 / 8 / 12 / 16 / 20 / 24 / 28 / full, with numeric names
only; an app maps its own role names onto them (`--radius-sm` → `--tt-radius-8`,
`--radius-md` → `--tt-radius-12`, `--radius-2xl` → `--tt-radius-24`,
`--radius-3xl` → `--tt-radius-28`). What each step is for, from the Althea
prototype:

| Token | What takes it |
|---|---|
| `radius-4` | a small mark set in a line: a key, a badge, the checkbox, inline code |
| `radius-8` | a small control's ground: the title in a bar, a plain menu's item |
| `radius-12` | a row or an item that is not inside a block; a tip |
| `radius-16` | a field and anything that is one (search, text area, a form's group, a code block, a figure); a row inside a block; a menu |
| `radius-20` | a block that holds rows |
| `radius-24` | your message; the chat box at one line |
| `radius-28` | the chat box on the home |
| `radius-full` | pills and round buttons |

A corner inside a corner is the outer corner less the gap: a block at 20 with
4 of padding holds rows at 16; a menu at 16 with 4 holds items at 12; the box
at 24 with 6 holds round controls of 36. `radius-6` stays for Lacuna and is
off the ladder: no new use.

`--tt-border-hairline` is 1px, and 0.5px under
`@media (resolution >= 192dpi)`, which `primitives.css` (and `tokens.css`)
already carries; alias it (`--border-hairline: var(--tt-border-hairline)`)
and delete the app's own media block.

Three surfaces and a control ring: a block in the flow
(`color-surface-block`, `color-border-block`, `shadow-block`), the box
(`color-surface-box`, `color-border-box`, firming to `color-border-box-focus`
on `:focus-within`, `shadow-box`), and anything that floats (the existing
`color-surface-card`, `color-border-overlay`, `shadow-overlay`); a control's
ring is `color-border-control`. An overlay draws its edge inside its shadow
list, `box-shadow: var(--tt-shadow-overlay), 0 0 0 1px var(--tt-color-border-overlay)`,
so a host that silences elevation sets a layer such as `0 0 #0000`, never
`none`, which would drop the ring with it.

## Icons

`@tiptree/design-system/icons.js` is one frozen, data-only ES module (provisional
at 0.7.0: if no Althea release importing it has merged when 0.8.0 is cut, 0.8.0
withdraws it). Each glyph is keyed by what it draws, in Solar's current Iconify
names (`close`, `close-circle`, `magnifier`, `pin-filled`), and carries its cut
(`linear` at rest; `filled`, the Bold of the same drawing, for an on state;
`solid` for `menu-dots`, `grip-dots` and `plus-heavy` only) and its body for a
24 viewBox.
Provenance and licence per glyph stay in `icons.json`.

```js
import { ICONS } from '@tiptree/design-system/icons.js';

// The app's own helper and class; the package ships data, not markup helpers.
export const icon = (name, size = 16) =>
  `<svg viewBox="${ICONS.viewBox}" width="${size}" height="${size}" aria-hidden="true" focusable="false" class="app-icon">${ICONS.glyphs[name].body}</svg>`;

// Role names live in the app: a role map from what the control means to what
// the glyph draws.
export const ROLES = { search: 'magnifier', dismiss: 'close', send: 'arrow-up', pinned: 'pin-filled' };
```

- **Test that every mapped name exists.** An unknown name is a silent empty
  glyph in a template helper, so the app asserts
  `Object.values(ROLES).every((name) => name in ICONS.glyphs)`.
- **Size and colour only.** Every stroked shape carries
  `vector-effect="non-scaling-stroke"` at `stroke-width` 1.5, so the line is
  1.5px at 16, 20 or any size (the sparkles of `moon-stars` and
  `stars-minimalistic` draw at 1px, by Solar's design). Set `width`/`height` and `color`
  (`currentColor` paints the glyph); delete CSS `stroke-width` rules aimed at
  icons, which now mean screen pixels. One resting ink; centre the glyph in
  its box.
- **A glyph the registry lacks** goes in the app's extension file (same schema
  as `icons/icons.json`, imported with `scripts/icon-body.mjs`), registered in
  `registry/icon-extensions.md` and folded into the package at the next minor.
  Brand marks are not icons and stay app assets.
- **Attribution.** A bundle that strips legal comments still carries the
  module's `attribution` property; ship the package's `NOTICE` and
  `LICENSE-CC-BY-4.0.txt` with the app's third-party notices.
- **Python:** no API; read the data with
  `importlib.resources.files('tiptree_ui') / 'assets' / 'icons.json'`.
- **Static sites:** vendor `dist/icons/icons.js` byte-for-byte from the
  release tarball like the CSS, pin its sha256 in the same test, and import it
  with `?v=X.Y.Z`.
- There is no Swift form; iOS keeps its own assets.

## Components

There are currently no published components. A shared component is added only
after a real repository consumes the proposed contract and the migration evidence
passes `docs/ADDING_A_COMPONENT.md`. Dormant Button research is historical input,
not an importable API.
