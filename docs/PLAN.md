# Tiptree Design System — Operating Plan (v3.0)

**Status:** the plan for a system that now exists. v2.x (archived at `DESIGN_SYSTEM_PLAN_v2_ARCHIVE.md`) was the de-risking document for questions that are now answered in production; this is the operating document for what's true and what's next. Decisions live in `design-system/docs/DECISION_LEDGER.md` — this file never duplicates them, it points at them.

## 1. What is true (2026-08-13)

- **The design system is the recorded truth of what's shared** — tokens and themes first, components only by graduation. It is not an aspirational component library; the estate's history (five token systems, a widget that drifted for months, 57 copies of a wrong teal) is what aspiration-without-adoption produces.
- **Distribution is immutable GitHub Releases from the public repo** (`RELEASING.md`): npm tarball + Python wheel + checksums + provenance per `vX.Y.Z` tag. Consumers pin exact asset URLs with lockfile/hash integrity. Never npmjs, PyPI, or any registry. A bad release is fixed by a new version, never a re-upload.
- **Althea is the first production consumer** (v0.3.1): both CSS bundles import `primitives.css` + `themes/light-default.css` via exports subpaths; 12 tokens alias byte-identically; Althea's dark mode is built on this foundation with app-local dark values pending graduation. `frontend/web/src/assets/styles/llms.md` documents the consumer side.
- **Design authority is Richard + Martin**, exercised through swatch-sheet sessions. Every value ruling is one line in a token file — cheap to make, cheap to reverse, always recorded. Ivan's palette (the docs dark values) remains the inherited canon; his return would find every ruling documented and revisable.
- **The showcase is becoming a tokens/themes explorer** reflecting genuine adoption. Button's published CSS export is removed at v0.4.0 (never consumed in production); its knowledge — the parity harness, the identity/geometry split, the 37-geometry finding, the knob contract — stays in-repo as the dormant spec and the ledger record.

## 2. Roadmap (each step independently shippable; no step depends on a later one)

1. **Explorer cleanup** — showcase reframed to published primitives + light/dark semantic tokens side-by-side; Button entry removed; the adoption rule written into `ADDING_A_COMPONENT.md`: *a component enters the showcase when a real repository consumes its contract, never before.*
2. **v0.4.0 — graduate Althea's shipped dark reality into the DS.** Moves into `tokens.json`: the danger ramp, the four status recipes (pale foreground on deep tint), focus-ring color, the inverse-chrome pair, accent-on-surface. Ships the two owed fixes (ledger 2026-08-13): `color-scheme: only light` in light-polarity files (Chrome Auto Dark opt-out — plain `light` does not opt out) with the decision test updated, and stronger `--tt-color-button-secondary-*` values (currently fail WCAG 1.4.11's 3:1 non-text edge in both themes). Removes the Button CSS export. Althea then bumps its pin and deletes every app-local dark entry that graduated — its `tokens.css` shrinks as the DS grows.
3. **docs adapter** — the second consumer. docs already has complete dual-theme mechanics and a palette verified byte-identical to the DS dark values; the work is mechanical: its two hex-heavy files (~277 of 327 raw hex) become aliases onto `--tt-*` via `themes/dark-default.css` (dark-on-`:root` is its sanctioned polarity). Wheel consumption at build time from the release assets. Its theme boot migrates to the estate key contract (`theme-pref` + `theme`), reading the old single key once as fallback.
4. **Lacuna adapter** — one gate: the teal ruling (`#4a7c7c` drift vs. sub-brand), a swatch decision for Richard + Martin; if sub-brand, it becomes `themes/lacuna.css` in the DS, never app-local CSS. Then: 17 tokens aliased; the three phantom tokens (broken in production today) fixed; the ~84 unnamed status hexes re-pointed at the graduated recipes; `conference_page.py`'s competing `:root` unified; `FEEDBACK_CSS` tokenized; drifted-teal SVGs to `currentColor`.
5. **Components, strictly by graduation.** First is the **theme boot/toggle module** — three hand-rolled copies exist today (Althea's `theme.js`, docs' `theme.js`, Lacuna's inline cycle); demand proven ×3. Then Badge (all three repos have one; it rehearses the status recipes), Toast, and Button resurrected from its dormant spec only when a consolidation actually wants it. Every component port follows the identity/geometry split and the migration acceptance rule (geometry byte-identical ≤0.5px; identity deltas designer-gated and recorded).

Deferred, unchanged from the dark-mode plan: the Althea hardcoded-color sweep (harness-gated when it happens; harness parked at `feature/dark-mode-stage1` with one known defect recorded), the chat-widget reconciliation (source lives unmerged on `feature/chat-widget`; contract: `--tt-*` + host `[data-theme]`, never `prefers-color-scheme`), iOS (force-lights itself; out of scope until that changes).

## 3. Invariants (each earned by a demonstrated failure — do not relearn them)

- **Alias adapters, never wholesale `:root` swaps.** Consumers keep their token names; values flow from the DS. Migration is re-pointing, not renaming.
- **Dark blocks in consumers use `:root[data-theme='dark']`**, never the bare attribute — equal specificity loses to later `:root` declarations by source order, silently.
- **Identity/geometry split.** The library owns identity (color, states, focus, radius, font identity, anatomy); apps own geometry via component custom properties. Identity divergence is drift; geometry divergence is sanctioned.
- **Immutable releases; consumers pin exact URLs.** Version skew is a lockfile grep, never a mystery. Bumping = edit the URL, `npm install`, commit both files.
- **Adoption-driven growth.** Nothing ships in the package or shows in the showcase without a real consumer. Speculative surface is how drift gets a head start.
- **Values are one-line re-rulable.** This is what makes design-authority handoffs, taste corrections, and divergence dispositions cheap. Guard it: no value may require a migration to change.
- **Status families derive from recipes** (fg / deep-tint bg / border per hue), never per-token improvisation; any fg==bg resolved pair is a defect.
- **Verification is sized to blast radius.** Changes to live light rendering get mechanical proof (parity/visual checks); flag-gated or value-identical changes get computed-value checks and a punch list. Ceremony is for the irreversible and the invisible.

## 4. Divergence governance (the steady state)

Divergence across repos is a signal to classify, not a failure to prevent. The loop:

- **Visibility:** consumer pins make version skew a grep; the registry generator (deterministic, disposable — in `feature/dark-mode` pre-squash history) reruns per-repo to diff any estate against DS canon; the stylelint ratchet (when the sweep lands it) stops new accidental drift at commit time.
- **Four dispositions, all with precedent:** accidental drift → fix to canon; deliberate sub-brand → a named `themes/*.css` override in the DS (recorded, not scattered); genuinely app-local → registered as such; component behavioral fork → reconcile into core + adapter (the widget lesson), never pin-and-pray.
- **Cadence:** a divergence audit per DS release — rerun the scanners, one-page diff, dispositions in a swatch-session-sized sitting. Done per-release it's fifteen minutes; done never, it's this year's cleanup project again.
- **Goal: zero divergence that nobody chose.** Uniformity is not the goal; per-app theme values (Althea ≠ Lacuna, ruled deliberate) and per-app geometry are healthy permanent divergence — named, dispositioned, in the ledger.

## 5. Pointers

- `design-system/docs/DECISION_LEDGER.md` — every decision, evidence-first; the ledger is the record, this plan is the map.
- `DESIGN_SYSTEM_PLAN_v2_ARCHIVE.md` — the full v1→v2.9 history: reviews, experiments, the POC era, everything superseded.
- `DARK_MODE_PLAN.md` (+ its v1 archive) — the adoption case study: how the first consumer landed, and the fast-path lessons this plan inherits.
- `design-system/RELEASING.md` — cutting releases and pinning consumers.
- Repo-vendored `design-system/docs/PLAN.md` — re-vendor this v3.0 in the same commit as the v0.4.0 release work.
