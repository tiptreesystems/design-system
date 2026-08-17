# Graduating a shared component

Components enter this package only after a real repository consumes the shared
contract. A showcase prototype, plausible reuse, or an isolated parity experiment
does not qualify. Inventory at least one production use, name the adopting repository
and migration owner in the spec, and retain evidence that the consumer actually
renders the contract. A component enters the showcase when a real repository consumes
its contract, never before.

Once demand is demonstrated, the order matters: contract before CSS, CSS before
consumers. A component is DONE when all nine steps hold — partial components don't
ship.

1. **Adoption evidence** — record the production consumer, source implementation,
   migration owner, and acceptance surface in the decision ledger. No consumer means
   the work remains app-local or dormant research.
2. **Spec first** — copy `specs/TEMPLATE.md` → `specs/<name>.md`. Engineering writes
   anatomy/ARIA/states/keyboard; designer supplies the visual decisions section. If the
   component exists in multiple apps today (e.g. Lacuna `.tag` vs Althea `.badge` vs
   the docs site `Badge`), inventory all versions in the spec and get ONE designer ruling on
   the merged variant set — never pick a winner silently.
3. **CSS** — `css/components/<name>.css`: unlayered, `.tt-<name>` classes only,
   `var(--tt-*)` values only, depends on tokens + itself only. Port values from the
   ruled source implementation; cite file+line in the header comment.
4. **Package surface** — restore the `./components/*.css` and
   `./layered/components/*.css` export-map entries in `package.json`. The decision
   test requires those exports whenever the generated manifest is non-empty.
5. **Budget** — add the file to `budgets.json` (typical seed: raw 6144 / brotli 2048).
   The build fails on unbudgeted components by design.
6. **Showcase** — add a section to `showcase/index.html` showing every variant × state
   in both themes. The showcase is the designer's approval surface; missing states
   mean unapproved states.
7. **Decision tests** — if the component encodes a designer ruling (a locked value, a
   variant that must exist), add it to `tests/decisions.test.mjs`.
8. **Fixtures** — add golden markup per the spec's API table to the conformance
   fixtures; bindings (when they exist) are tested against these.
9. **`npm run ci` green**, then PR with before/after screenshots. New tokens needed
   along the way follow the same rule: designer rules the value, `tokens.json` is the
   only place it lives.

What does NOT belong here: app-specific components (a Lacuna hypothesis card, an Althea
chat bubble) — those live in their apps, built FROM the tokens. The test: would a second
app ever plausibly use it? No → app-local.
