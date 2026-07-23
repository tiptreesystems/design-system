# Tiptree Design System Decision Ledger

Append-only record of scope decisions, pinned integration inputs, and acceptance-test evidence. Corrections are added as new entries rather than rewriting prior entries.

## 2026-07-22 — Integration-slice preflight

### Consumer pins

| Consumer | Repository | Pinned commit |
|---|---|---|
| Lacuna | `lacuna` | `c83877d185fa9e3a6fe95e07fba336744f91c923` |
| Althea | `tasc-stack/frontend` | `3614b8ebe7b7fef0cede8c6bbff40f9446000fde` |
| Docs | `docs-new` | `c67b1e8ec200832546e6994eeb51505c3522de1f` |
| iOS | `platform-ios` | `068219fb0c28ccb9f75c01347e6963652b9e436f` |

### Owners

- TBD (Martin): Lacuna
- TBD (Martin): Althea
- TBD (Martin): docs
- TBD (Martin): iOS

### Scope decisions

- This run is a plumbing acceptance test using hand-written Button markup from `specs/button.md`; it does not decide bindings versus web components.
- In-scope consumers are Lacuna, Althea, docs-new, and platform-ios. Platform frontend and legacy Astro docs are excluded.
- Consumer work occurs only in isolated `.slice-worktrees/` worktrees created from the pins above. Existing live consumer worktrees remain untouched.
- The package publishes components individually. Normal web consumption is `primitives.css` plus exactly one theme file plus selected component files. `tokens.css` remains dark-default backward compatibility only.
- Althea uses the unlayered component build with the light-default theme. The layered build exists only for hosts whose complete cascade is layered.
- The docs-new static snapshot integration is disposable evidence and may be overwritten by a future extraction.
- The iOS leg is non-blocking and proves generated-token parity only; native component installation, preview, and rollback are not exercised.
- The temporary `radius-full` value change is authorized only on `tt/slice-bump` as rollback-drill evidence and never merges to `main`.
