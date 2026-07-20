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

Empty pending the designer's ruling on Lacuna's teal (`#4a7c7c` — drift or sub-brand?). If sub-brand: `lacuna.css` lands here as the first theme. See DESIGN_SYSTEM_PLAN.md §3/§7.
