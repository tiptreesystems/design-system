# Sub-brand themes

Sub-brands are **token-value overrides** under a `[data-brand]` attribute — the same mechanism as dark mode. They live here, in the design-system repo: designed, versioned, screenshot-verified. Never app-local CSS.

**Rule: override values, never rules.** A theme file may only set custom properties from the themeable surface below. Redefining `.tt-*` component rules anywhere is drift.

## Themeable surface (designer-controlled allowlist)

| Token | May override |
|---|---|
| `--tt-color-accent`, `--tt-color-accent-hover`, `--tt-color-accent-tint` | yes |
| `--tt-font-serif` (editorial voice) | yes |
| `--tt-color-bg-primary` (surface tint) | yes, within contrast budget |
| spacing scale, type ladder, focus rings, z-scale | **locked** |

## Status

Empty by ruling. Lacuna's teal (`#4a7c7c`) was ruled drift, not a sub-brand, and converged to the canonical ramp (ledger, 2026-08-18) — so no `lacuna.css` exists. A sub-brand theme lands here only by a recorded ruling; see `docs/OPERATING_GUIDE.md` §3 (divergence dispositions).
