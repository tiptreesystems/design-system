# Button — component contract v1.3

Seeded from the former docs-new Button and reconciled against the updated docs
Button, Lacuna, and Althea. The contract every binding is conformance-tested
against.

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
| size | `sm` \| `md` \| `lg` \| consumer geometry knobs | `md` geometry |
| disabled | boolean — sets the `disabled` attribute on `<button>`; anchors get `.tt-btn--disabled` + `aria-disabled="true"` and drop the `href` | false |

## Identity and geometry

The library owns Button identity: colors; hover, active, focus, and disabled
states; focus ring; border radius; font family and weight; transitions; cursor;
and this contract's anatomy and accessibility behavior. Consumers do not
override those properties and the library exposes no knobs for them.

Consumers own contextual geometry through exactly these component custom
properties:

| Knob | Controls | Default |
|---|---|---|
| `--tt-btn-height` | `height` | `40px` |
| `--tt-btn-min-height` | `min-height` | `auto` |
| `--tt-btn-padding` | block and inline padding | `1px 14px` |
| `--tt-btn-gap` | content/icon gap | `8px` |
| `--tt-btn-font-size` | font size | `13px` |
| `--tt-btn-line-height` | line height | `normal` |
| `--tt-btn-border-width` | border width in the box model | `0px` |

Set knobs on a consumer-owned class attached to the same element; never
redeclare `.tt-btn` or another `.tt-*` rule:

```css
.paper-action {
  --tt-btn-height: 29px;
  --tt-btn-min-height: auto;
  --tt-btn-padding: 6px 14px;
  --tt-btn-gap: 6px;
  --tt-btn-font-size: 14.4px;
  --tt-btn-line-height: normal;
  --tt-btn-border-width: 0px;
}
```

Width and margin are not Button knobs. Set them as ordinary layout properties
on the consumer-owned class. Icon dimensions likewise stay with the consumer's
icon/layout CSS.

### Presets

The three library size presets assign the six size-related knobs, seeded from
the updated docs Button. Border width is independent of size: identity variants
provide their default (`secondary` is `1px`, with its existing high-density
hairline), and a consumer sets `--tt-btn-border-width` only when preserving a
source control's box geometry.

| Preset | Height / min-height | Padding | Gap | Font size / line height | Provenance |
|---|---|---|---|---|---|
| `sm` | 32px / auto | 1px 12px | 8px | 13px / normal | `docs_server/web/src/styles/components/button.css:29-34` |
| `md` | 40px / auto | 1px 14px | 8px | 13px / normal | `docs_server/web/src/styles/components/button.css:36-41` |
| `lg` | 44px / auto | 1px 20px | 6px | 16px / normal | `docs_server/web/src/styles/components/button.css:43-48` |

The 37 app-context profiles remain recorded in
`docs/button-parity-inventory.md`; they are migration inputs and future designer
rationalization evidence, not public library variants.

Border radius is identity, not geometry. A migration may therefore change a
control's radius even when its layout tuple remains exact; every radius delta is
recorded alongside color and other identity deltas for designer review.
Border width is geometry because it participates in the box model; border style
and border color remain identity. Font family and weight also remain identity
and have no knobs. If either changes intrinsic dimensions beyond the parity
tolerance, that usage is rejected rather than given a font-weight override.

## Behavior & accessibility (engineer-owned)

- Focus: `:focus-visible` ring from `--tt-color-accent`; never suppressed.
- Disabled buttons are not focusable; disabled anchors keep DOM position but lose `href`.
- No JS required — this is a Layer-1 component.
- Button-styled anchors remain part of this anatomy. Navigation-link parity
  migration is outside the v0.3 deliverable, not removed from the contract.

## Visual decisions (designer-owned — via tt.css, never here)

Color values, hover/pressed treatment, focus color, and later rationalization of
the recorded geometry inventory remain designer-owned. Consumer knob settings
preserve source layout during migration without weakening library identity.
