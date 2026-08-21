# Tiptree Design System — Operating Guide (v3.1)

**Status:** current as of 2026-08-21. Supersedes the Operating *Plan* v3.0 (2026-08-13): that plan's roadmap is complete except for the items in §4, so this document no longer schedules work — it describes how the system works and the rules it runs by. Decisions live in `docs/DECISION_LEDGER.md`; this guide points at them and never duplicates them. The plan-era text remains in git history (`docs/PLAN.md`, renamed 2026-08-21).

## 1. What is true

- **The design system is the recorded truth of what is shared** — tokens and themes first, components only by graduation. It is adoption-driven, not aspirational: nothing enters without a real consumer, and each application keeps app-local tokens for roles that are genuinely its own.
- **Distribution is immutable GitHub Releases from this public repo** (`RELEASING.md`): per `vX.Y.Z` tag, an npm tarball, a Python wheel (`tiptree_ui`), `SHA256SUMS`, and build provenance. Consumers pin the exact asset URL with lockfile or hash integrity. Never npmjs, PyPI, or any registry. A bad release is fixed by a new version, never a re-upload.
- **Current release: v0.5.0** — primitive ramps (stone, teal, citron, brand constants) plus **52 semantic roles in each of light and dark**, generated as `primitives.css`, `themes/light-default.css`, `themes/dark-default.css`, `themes/explicit.css`, and a dark-default compatibility `tokens.css`. No component CSS is published; Button remains a dormant spec (`specs/button.md`) with its parity harness retained for the day a consolidation wants it.
- **The showcase (`showcase/index.html`) is the shipped tokens/themes explorer**, reflecting published primitives and both themes side by side.
- **Design authority** is the product owner and the engineering lead, exercised through swatch-sheet rulings. The designer's rulings are inherited canon — recorded append-only, revisable one line at a time. Attribution for individual rulings lives in the ledger, not here.
- **Agent entry points are one file:** `AGENTS.md` is a symlink to `CLAUDE.md`, so every agent runtime loads the same source-of-truth map and fences.

### Release history

| Release | Semantic roles / theme | What it established |
|---|---|---|
| v0.3.1 | 22 | First consumer pin (Althea); exports-subpath consumption proven |
| v0.4.0 | 43 | Althea's shipped dark reality graduated (danger ramp, four status recipes, focus ring, inverse chrome, accent-on-surface); `color-scheme: only light`; stone-550 secondary borders (WCAG 1.4.11); Button export removed; showcase became the explorer |
| v0.4.1 | 48 | First estate-audit graduations (surface hover, disabled wash, two chip emphases, tooltip); fork-inflated "convergence" disqualified |
| v0.5.0 | 52 | `text-quaternary`, `surface-sunken`, `scrollbar-thumb`, `border-interactive` — ruled, with Althea's adoption gated on the designer's light-canvas pass |

### Consumers

| Repository | Merged state | Pending state | Adapter | Ledger record |
|---|---|---|---|---|
| Althea (`tasc-stack/frontend`) | v0.3.1 merged; 39 direct `--tt-*` bindings; dark mode shipped on the shared dark palette | One pin bump to the current release, harvesting byte-identical graduated values; gated on the designer's pass | `frontend/web/src/assets/styles/tokens.css` (+ app-only overrides in `app-theme.css`) | 2026-08-13 first consumer; 2026-08-18/19 adoption gate |
| docs | No dependency on `main` yet | Adapter on an open PR, pinned v0.5.0: 52 live aliases, forked token sheet deleted, 3 registered residuals, theme-key migration | `docs_server/web/src/styles/brand.css`; `build.py` composes `dark-default` | 2026-08-19 adoptions and zero-delta re-bump |
| Lacuna | No dependency on `main` yet | Adapter on an open PR, pinned v0.5.0: first production use of `tiptree_ui.blueprint.compose()`, 25 root aliases, teal and surface hierarchy converged, 13 SVG assets on the canonical ramp | `lacuna/interfaces/site_theme.py` → content-hashed site CSS | 2026-08-18 teal ruling; 2026-08-19 SVG adjudication; 2026-08-20/21 surface hierarchy |

Consumer entries are appended to the ledger only after the corresponding merge.

## 2. Invariants (each earned by a demonstrated failure — do not relearn them)

1. **Alias adapters, never wholesale `:root` swaps.** Consumers keep their token names; values flow from the library. Migration is re-pointing, not renaming.
2. **Adapter overrides must outrank later root declarations.** Light-default consumers put dark values under `:root[data-theme='dark']`; dark-default consumers (docs) keep their sanctioned inverse polarity with light as the override block. A bare attribute selector has `:root`'s specificity and silently loses by source order.
3. **Identity/geometry split.** The library owns identity (color, states, focus, radius, font identity, anatomy); applications own geometry through component custom properties. Policy today; next exercised at component graduation.
4. **Immutable releases; consumers pin exact URLs.** Version skew is a lockfile grep. Bumping is: edit the URL, install, commit both files.
5. **Adoption-driven growth, with independent evidence.** Nothing ships without a real consumer, and a forked copy of another consumer's file is not independent demand (2026-08-17: 92 "convergences" disqualified).
6. **Values are one-line re-rulable, and near-duplicates are never minted.** No value may require a migration to change; a role whose value already resolves identically to a ruled token is an alias, not a new token (2026-08-17 v0.4.0 collapse; v0.4.1 button-hover deferral).
7. **Status families derive from recipes** (foreground / deep-tint background / border per hue), never per-token improvisation; any `fg == bg` resolution is a defect; status hues stay distinct from brand hues (2026-08-18).
8. **Verification is sized to blast radius.** Live light-rendering changes get mechanical proof; value-identical or gated changes get computed-value checks and a punch list. This is a review and release policy, not a single CI rule.
9. **Test resolved relationships, not alias spelling.** A mapping is correct only if the functional separations it carried (card vs. sunken, hover vs. rest) survive in both themes (2026-08-20/21 Lacuna surface collapse).
10. **Respect asset inheritance boundaries.** Inline SVG may use `currentColor`; `<img>`-loaded SVG cannot, and uses canonical literals guarded by a retired-palette test (2026-08-19).
11. **Public evidence is self-contained and machine-neutral.** Repo-relative paths, roles over names, no citations that resolve only on someone's machine (2026-08-20 redaction).
12. **Agent-entry parity.** All agent entry files resolve to the same repo guide — symlink, never duplicate (2026-08-21).

## 3. Governance

- **The ledger is the record; this guide is the map.** `docs/DECISION_LEDGER.md` is append-only and evidence-first; corrections are new entries. Check it before changing any value.
- **How a token enters.** Shared across two or more independent consumers, or carrying a ruled-canon justification → a ledger ruling, an entry in `tokens/tokens.json` with its applicability class, symmetric light/dark decision tests (resolved values *and* reference structure), and a release. Consumers then alias it. App-only roles stay in the consumer, registered as app-local.
- **Divergence is classified, not prevented.** Visibility comes from consumer pins and pinned-SHA audit matrices (a supported in-repo audit script is open work; the earlier generator lives only in a consumer's branch history). Four dispositions, each with precedent: accidental drift → fix to canon; deliberate sub-brand → a named `themes/*.css` file here, never app-local CSS; genuinely app-local → registered; component behavioral fork → reconcile into core plus adapter. An audit is required whenever a release proposes roles outside the last audited matrix, and the audited consumer SHAs are recorded.
- **Goal: zero divergence that nobody chose.** Registered app-local roles and app-owned geometry are healthy, permanent divergence. Shared palette and surface roles converge unless explicitly ruled otherwise — Lacuna's palette and surface hierarchy were ruled drift and converged, not registered.
- **Review protocol for material rulings.** Two independent evidence reviews (adversarial, grep-verified) precede the authority entry; each batch closes with a bounded sitting agenda rather than open questions.
- **Ownership.** The designer owns token values, visual CSS, themes, and visual acceptance; engineering owns specs, bindings, generators, releases, and budgets; consumers own contextual geometry through documented custom properties. `CLAUDE.md` carries the enforceable fences.

## 4. Open work (no sequence implied)

- **Althea pin bump** v0.3.1 → current release: delete only byte-identical graduated values; retire the superseded cool-grey light values for the warm stone canon. Gated on the designer's light-canvas pass; any adjustment ships as a patch release.
- **docs and Lacuna adapter PRs** merge → consumer entries appended.
- **Components by graduation:** the theme boot/toggle module first (three hand-rolled copies exist across the estate), then Badge, then Toast; Button only when a consolidation wants it.
- **Explorer hosting** per release tag (GitHub Pages).
- **In-repo estate audit script** to replace pinned-SHA matrix evidence.
- **Remaining consumer raw-hex sweeps**; chat-widget reconciliation (an ownership decision); consumer harness follow-ups (recorded in that consumer's harness document); iOS stays out of scope while the app forces light.
- **Sitting agenda:** button-hover fold-vs-distinct against `surface-hover`; secondary-hover convergence; invert-hover dark graduation.

## 5. Pointers (repo-relative)

- `CLAUDE.md` / `AGENTS.md` — source-of-truth map, commands, fences.
- `docs/DECISION_LEDGER.md` — every decision, evidence-first.
- `RELEASING.md` — cutting releases and pinning consumers. `docs/ROLLBACK.md` — reverting a consumer.
- `docs/USING.md` (integrators), `docs/ADDING_A_COMPONENT.md` (contributors), `docs/DESIGNER_GUIDE.md` (designer).
- `specs/` — component contracts (`TEMPLATE.md`; `button.md` dormant). `themes/README.md` — sub-brand theme rules.
- `showcase/index.html` — the explorer.
