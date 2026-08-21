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
- Python and Swift exports are generated from the same source for non-CSS
  consumers.
- No component CSS is currently published. The dormant Button material under
  `specs/`, `docs/`, and `tests/parity/` records the delivery and parity research
  that established the component-graduation method.

Generated CSS and language exports are build products. Do not edit `dist/`,
`python/tiptree_ui/_tokens.py`, or `python/tiptree_ui/assets/` directly.

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

`npm run ci` is the required local gate: deterministic generation, decision
tests, Python composition tests, and raw/Brotli payload budgets. CI also builds
unpublished npm and wheel candidates. Releases are immutable GitHub Release
assets; consumers pin exact URLs and lockfile hashes.

## Repository map

- `tokens/` — canonical primitive and semantic values
- `themes/` — sanctioned sub-brand override policy
- `showcase/` — local tokens/themes explorer
- `scripts/` and `tests/` — generation, release gates, and retained parity engine
- `specs/` and `docs/` — contracts, dormant research, decisions, and integration
- `python/` — generated token access and optional Flask asset composition
- `dist/` — generated package output; never committed

The code, tokens, styles, and specifications are licensed under the
[Apache License 2.0](LICENSE). Tiptree names and brand identity remain trademarks
and are not licensed to imply affiliation; see [NOTICE](NOTICE).
