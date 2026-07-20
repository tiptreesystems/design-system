# {Component} — component contract v{n}

## Anatomy
The canonical markup, with every class and attribute. State explicitly which element(s) may carry the root class and why.

## API
| Axis | Values | Default |
|---|---|---|

## Behavior & accessibility (engineer-owned)
ARIA roles/attributes, keyboard interactions, focus management, no-JS behavior.

## Visual decisions (designer-owned — live in tt.css, referenced here only)
Radius/spacing/typography choices worth naming, so bindings and reviews have a shared vocabulary.

## Conformance
Every binding (Python, JS, React) must emit exactly the Anatomy for every API combination — enforced by snapshot fixtures in `tests/`.
