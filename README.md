# Tiptree Design System

The recorded truth of what Tiptree applications share: portable primitives,
light/dark semantic themes, generated consumer formats, and verification. It is
tokens and themes first; a component becomes public only after a real repository
adopts its shared contract.

The operating guide is [`docs/OPERATING_GUIDE.md`](docs/OPERATING_GUIDE.md). Integrators start
with [`docs/USING.md`](docs/USING.md); contributors use
[`docs/ADDING_A_COMPONENT.md`](docs/ADDING_A_COMPONENT.md); design decisions are
append-only in [`docs/DECISION_LEDGER.md`](docs/DECISION_LEDGER.md).

## Published contract

- `tokens/tokens.json` is the single value source. Portable custom properties use
  the `--tt-*` namespace.
- `primitives.css` provides locked brand anchors, color ramps, type, radii,
  motion, focus geometry, and elevation primitives.
- `themes/light-default.css`, `themes/dark-default.css`, and
  `themes/explicit.css` provide the semantic theme surface.
- `icons.js` (and `icons.json`) is the icon library: one frozen, data-only ES
  module of Solar Linear glyphs keyed by what they draw, generated from
  `icons/icons.json`, which records each glyph's provenance and licence. It is
  provisional at 0.7.0, also ships in the wheel as `tiptree_ui/assets/icons.json`
  and `icons.js`, and has no Swift form.
- Python and Swift exports are generated from the same source for non-CSS
  consumers. The Swift export is committed as an importable Swift Package
  source so Xcode consumers do not need Node or a synchronization script.
- No component CSS is currently published. The dormant Button material under
  `specs/`, `docs/`, and `tests/parity/` records the delivery and parity research
  that established the component-graduation method.

Generated CSS and language exports are build products. Do not edit `dist/`,
`Sources/TiptreeDesignSystem/GeneratedTokens.swift`,
`python/tiptree_ui/_tokens.py`, or `python/tiptree_ui/assets/` directly. The
Swift Package source is generated but committed so it is present in Git tags.

## Local explorer

Requires Node 20 or newer. The repository has no npm dependencies.

```sh
npm run dev
```

This rebuilds on token changes and serves the tokens/themes explorer at
`http://localhost:4173`. Light and dark semantic values remain visible
side-by-side; the page-level toggle changes only the explorer chrome.

## Verification

```sh
npm run build
npm test
npm run budgets
npm run ci
```

`npm run ci` is the required local gate: committed Swift-source parity,
deterministic generation, decision tests, Python composition tests, and
raw/Brotli payload budgets. CI also compiles the Swift Package and builds
unpublished npm and wheel candidates. Releases are immutable Git tags and
GitHub Release assets; consumers pin exact versions, URLs, and lockfiles.

## Repository map

- `tokens/` — canonical primitive and semantic values
- `icons/` — the icon registry (`icons.json`) and the prototype port's rename map
- `registry/` — legacy-token classifications and app-local icon extensions
- `themes/` — sanctioned sub-brand override policy
- `showcase/` — local tokens/themes explorer
- `scripts/` and `tests/` — generation, release gates, and retained parity engine
- `specs/` and `docs/` — contracts, dormant research, decisions, and integration
- `python/` — generated token access and optional Flask asset composition
- `Sources/` and `Package.swift` — committed generated Swift source and its package manifest
- `dist/` — generated package output; never committed

The code, tokens, styles, and specifications are licensed under the
[Apache License 2.0](LICENSE). The icon artwork from Solar by 480 Design is
licensed under [CC BY 4.0](LICENSE-CC-BY-4.0.txt), so the package licence is
`Apache-2.0 AND CC-BY-4.0`; [NOTICE](NOTICE) carries the attribution and the
changes made. Tiptree names and brand identity remain trademarks and are not
licensed to imply affiliation; see [NOTICE](NOTICE).
