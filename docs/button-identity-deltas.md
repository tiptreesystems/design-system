# Button v0.3 identity deltas

This is the designer-review artifact for the bounded `tt/button-parity`
consumer branches. Layout equality is reported separately by the parity
harness. Values below are computed styles from the real consumer CSS and the
v0.3.0 identity swap, measured in a headless Chromium browser on 2026-07-24.
Rendered evidence is in `docs/evidence/parity-lacuna-button-v0.3.0.png` and
`docs/evidence/parity-althea-button-v0.3.0.png`.

## Retained migrations

### Lacuna account Sign out

| Identity property | Before | After |
|---|---|---|
| Background | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` |
| Text | `rgb(85, 85, 85)` | `rgb(27, 27, 27)` |
| Border | `rgb(212, 222, 222)` | `rgb(220, 220, 212)` |
| Radius | `8px` | `9999px` |
| Font | `Arial`, weight `500` | Tiptree Inter stack, weight `510` |
| Hover background | `rgb(242, 246, 246)` | `rgb(237, 237, 233)` |
| Hover text | `rgb(85, 85, 85)` | `rgb(27, 27, 27)` |
| Hover border | `rgb(212, 222, 222)` | `rgb(220, 220, 212)` |

### Althea feedback Cancel

| Identity property | Before | After |
|---|---|---|
| Background | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` |
| Text | `rgb(27, 27, 27)` | `rgb(27, 27, 27)` |
| Border | `rgba(71, 105, 107, 0.18)` | `rgb(220, 220, 212)` |
| Radius | `999px` | `9999px` |
| Font | Althea Inter stack, weight `500` | Tiptree Inter stack, weight `510` |
| Hover background | `rgba(71, 105, 107, 0.05)` | `rgb(237, 237, 233)` |
| Hover text | `rgb(27, 27, 27)` | `rgb(27, 27, 27)` |
| Hover border | `rgba(71, 105, 107, 0.34)` | `rgb(220, 220, 212)` |

### Althea Submit Feedback

| Identity property | Before | After |
|---|---|---|
| Background | `rgb(71, 105, 107)` | `rgb(27, 27, 27)` |
| Text | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` |
| Border | `rgb(71, 105, 107)` | `rgba(0, 0, 0, 0)` |
| Radius | `999px` | `9999px` |
| Font | Althea Inter stack, weight `500` | Tiptree Inter stack, weight `510` |
| Hover background | `rgb(53, 88, 90)` | `rgb(71, 105, 107)` |
| Hover text | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` |
| Hover border | `rgb(53, 88, 90)` | `rgba(0, 0, 0, 0)` |

Its original 1px border geometry is preserved through
`--tt-btn-border-width`; border style and color remain library identity.

### Althea Platform Join Waitlist

| Identity property | Before | After |
|---|---|---|
| Background | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` |
| Text | `rgb(27, 27, 27)` | `rgb(27, 27, 27)` |
| Border | `rgba(27, 27, 27, 0.08)` | `rgb(220, 220, 212)` |
| Radius | `8px` | `9999px` |
| Font | Althea Inter stack, weight `600` | Tiptree Inter stack, weight `510` |
| Hover background | `rgba(27, 27, 27, 0.05)` | `rgb(237, 237, 233)` |
| Hover text | `rgb(27, 27, 27)` | `rgb(27, 27, 27)` |
| Hover border | `rgba(27, 27, 27, 0.74)` | `rgb(220, 220, 212)` |

The radius changes are intentional identity changes under the v0.3 contract;
they are not parity failures. The designer must approve these identity deltas
before any consumer branch is considered for production adoption.

## Rejected or out-of-scope candidates

| Usage | Disposition | Evidence |
|---|---|---|
| Lacuna Read Paper action | Reverted | Candidate width changed `120.4375px` → `119.234375px`, shifting its adjacent metadata by `1.203125px`; the identity font weight changed intrinsic width. |
| Lacuna Read Paper link | Not migrated | A measured candidate was within tolerance, but Button-styled navigation-link migration is explicitly outside v0.3 scope. |
| Althea Submit Feedback | Resolved and retained | The initial six-knob candidate failed because border width changed `1px` → `0px`. With the approved seventh geometry knob set to `1px`, width, border widths, parent, and sibling positions all match at `0.000px` across desktop/mobile and DPR 1/2. |

The remaining failure was not hidden with an app-specific width adjustment.
Lacuna Read Paper retains its original implementation.
