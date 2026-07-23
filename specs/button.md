# Button — component contract v1

Ported from the docs-new Button spec (`docs-new/src/components/atoms/Button.tsx` + `.module.css`). The contract every binding is conformance-tested against.

## Anatomy

```html
<!-- action → real button -->
<button class="tt-btn tt-btn--{variant} tt-btn--{size}" type="button">Label</button>

<!-- navigation → anchor with identical classes -->
<a class="tt-btn tt-btn--{variant} tt-btn--{size}" href="…">Label</a>
```

- **Element choice is semantic, not visual:** `<button>` for actions, `<a>` for navigation. Bindings decide from whether `href` is present — consumers never choose.
- Label is required (no icon-only buttons in v1).

## API

| Axis | Values | Default |
|---|---|---|
| variant | `primary` \| `secondary` \| `ghost` | `secondary` |
| size | `sm` \| `md` \| `lg` | `md` |
| disabled | boolean — sets the `disabled` attribute on `<button>`; anchors get `.tt-btn--disabled` + `aria-disabled="true"` and drop the `href` | false |

## Behavior & accessibility (engineer-owned)

- Focus: `:focus-visible` ring from `--tt-color-accent`; never suppressed.
- Disabled buttons are not focusable; disabled anchors keep DOM position but lose `href`.
- No JS required — this is a Layer-1 component.

## Visual decisions (designer-owned — via tt.css, never here)

Pill radius (`--tt-radius-full`), medium weight, `scale(0.97)` on `:active`, size heights 32/40/44 (44 = `--min-tap-size`; an earlier port of this spec said 48 — transcription drift, corrected 2026-07-20 against `docs-new/src/components/atoms/Button.module.css`).
