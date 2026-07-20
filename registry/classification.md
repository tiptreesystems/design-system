# Legacy-token classification registry

Engineering generates and maintains the inventory. The designer rules on flagged visual or brand equivalences; engineering classifies runtime and implementation-only values. Add one row per concrete legacy token rather than treating name similarity as semantic equivalence.

Allowed classifications: `shared-alias`, `app-local`, `runtime`, `deprecated`, `ignored`.

| legacy name | app | classification (`shared-alias`\|`app-local`\|`runtime`\|`deprecated`\|`ignored`) | proposed `--tt-*` mapping | designer ruling (`pending`/`confirmed`) |
|---|---|---|---|---|
| `--color-accent` (`#007aff`, iOS blue) | Althea | `app-local` | —; explicitly not `--tt-color-accent` despite the matching name | `confirmed` |
| `--brand-primary` | Lacuna | `shared-alias` | `--tt-color-accent` | `pending` — depends on the canonical-teal/sub-brand ruling |
| `--md-*` | legacy docs | `deprecated` | — | `confirmed` |
