# Tiptree Design System

This repository is the framework-agnostic source for Tiptree's visual system and component contracts. It contains the portable token source, generated consumer formats, canonical component CSS, component specifications, Python package data, validation, payload budgets, and a small showcase.

The governing architecture is documented in [`docs/PLAN.md`](docs/PLAN.md). Component contracts live in [`specs/`](specs/). **Integrating an app? Start with [`docs/USING.md`](docs/USING.md)** — proven per-consumer recipes (Python wheel, npm/bundler, static, iOS). Contributors: [`docs/ADDING_A_COMPONENT.md`](docs/ADDING_A_COMPONENT.md); designers: [`docs/DESIGNER_GUIDE.md`](docs/DESIGNER_GUIDE.md); agents: [`CLAUDE.md`](CLAUDE.md).

## Architecture

- `tokens/tokens.json` is the single token source. All portable custom properties use the `--tt-*` namespace.
- `css/components/*.css` is the canonical visual component layer. Source files are unlayered, use opt-in `.tt-*` classes, and contain no global reset or bare-element selectors. The build emits default unlayered files, opt-in layered files, and a full showcase bundle.
- `specs/` defines component anatomy, semantics, states, keyboard behavior, and events. CSS alone cannot define those requirements.
- Generated CSS and Python exports are build products. Do not edit `dist/`, `python/tiptree_ui/_tokens.py`, or `python/tiptree_ui/assets/` directly.
- Bindings are conveniences over the same component contract, not an alternative source of truth. Python, JavaScript, or native helpers must conform to the corresponding specification and canonical styling contract.
- Per-consumer aliases and theme adapters support incremental adoption. Consumers never replace an existing `:root` wholesale.

## Commands

Requires Node 20 or newer. Building the Python wheel requires Python 3.11 or newer; check `python3 --version` rather than assuming the system alias is compatible. The scaffold intentionally has no npm dependencies.

```sh
npm run dev
```

Builds generated files, watches `tokens/` and `css/`, and serves the showcase at `http://localhost:4173`.

```sh
npm run build
npm test
npm run budgets
npm run ci
```

`npm run ci` is the required local check: build, decision tests, and raw/Brotli payload budgets. CI also creates checksummed npm tarball and Python wheel candidates for integration testing. Candidate artifacts are not published automatically.

## Repository map

- `tokens/` — schema seed and canonical token values
- `css/` — hand-authored visual component rules
- `specs/` — engineer-owned semantic and behavioral contracts
- `themes/` — sanctioned brand/theme token overrides
- `registry/` — classification of legacy consumer tokens
- `showcase/` — local visual authoring surface
- `scripts/` and `tests/` — generation and release gates
- `python/` — `tiptree-ui` wheel source and Flask asset integration
- `dist/` — generated npm/package output; never committed

Registry selection, publishing, consumer migrations, integration experiments, and remote repository creation remain gated by the authoritative plan. Engineering cuts releases; the designer approves visual changes.
