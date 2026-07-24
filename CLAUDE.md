# Tiptree Design System — repo guide (humans and agents)

One typed token/component source, consumed by every Tiptree app as versioned artifacts
(npm package + Python wheel). CSS + markup specs are the canonical web implementation;
generated native tokens serve iOS. Full architecture: `docs/PLAN.md` (vendored from the
planning workspace; if absent, ask for DESIGN_SYSTEM_PLAN.md).

## Source of truth map — what you may edit vs what is generated

| Path | Status |
|---|---|
| `tokens/tokens.json` | SOURCE — token values are designer-ruled; do not change values without a ruling |
| `css/components/*.css` | SOURCE — one file per component, authored unlayered |
| `specs/*.md` | SOURCE — component contracts (anatomy/ARIA/states) |
| `themes/` | SOURCE — sub-brand token overrides (designer-owned) |
| `dist/`, `python/tiptree_ui/_tokens.py`, `python/tiptree_ui/assets/` | GENERATED — never edit; rebuilt by `npm run build` |

## Commands

```sh
npm run dev      # watch + rebuild + showcase at :4173 (the designer's one command)
npm run ci       # build + decision tests + payload budgets — required green before commit
```

Zero npm dependencies by design — never add one. Python ≥3.11 (use python3.12 locally;
system python3 is 3.9). Wheel proof: `python3.12 -m pip wheel python/ --no-deps -w dist/py312`.

## Invariants (CI-enforced; do not work around them)

- No raw hex in component CSS; identity values resolve through `var(--tt-*)`.
  Documented component-geometry knob defaults/presets are the narrow exception:
  their source-proven layout values may be literal, and consumers assign those
  knobs on their own classes without redefining `.tt-*` rules.
- No bare-element selectors (`button`, `input`, `a`, …) — opt-in `.tt-*` classes only.
- Every component depends on tokens + its own file — nothing else. No `core.css`.
- Payload budgets are release gates: a component without a `budgets.json` entry fails.
- Version parity: package.json = pyproject.toml = tokens meta = `__version__`.
- Override VALUES (tokens/themes), never RULES (`.tt-*` selectors) — app-local
  redefinition of component rules is drift.
- The brand palette is LOCKED (`#1b1b1b #47696b #638b8d #e3e6a6` + greys); the accent
  stays in the teal ramp in both themes. Decision tests encode this — a failing decision
  test means you changed a designer ruling, not that the test is wrong.

## Ownership

Designer owns: token values, component visual CSS, themes, visual acceptance.
Engineering owns: specs (DOM/ARIA/behavior), bindings, generators, releases, budgets.
Consumers own contextual component geometry only through each spec's documented
custom properties; the library continues to own identity.
Joint review when a visual change requires new markup. Releases: engineering cuts,
designer approves. Decisions affecting scope go in `docs/DECISION_LEDGER.md` (append-only).

## Adding a component

Follow `docs/ADDING_A_COMPONENT.md`. Never invent visual values — port them from the
source implementation being consolidated, cite it in the spec, and flag conflicts
between apps for a designer ruling instead of picking a winner silently.

## Agents: hard fences

- Never publish to any registry, push, or create remotes without explicit human instruction.
- Never edit generated files or token VALUES (token values are designer-ruled; a task
  may explicitly authorize a temporary value change as a drill — it must be reverted).
- Consumer-repo edits are PROHIBITED unless the active task explicitly authorizes
  integration work — and then only in isolated git worktrees on `tt/*` branches created
  from a recorded SHA. Never switch branches in a consumer's live working directory;
  never touch main/master; never assume a consumer tree is clean.
- Never fabricate measurements (payload, performance) — report degraded evidence honestly.
