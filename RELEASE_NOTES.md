# v0.4.0

This release makes the package reflect its first production adoption: shared
tokens and light/dark themes, with components admitted only after demonstrated
consumer demand.

## Breaking package-surface cleanup

Button never reached a production consumer, so v0.4.0 removes these experimental
v0.3.x npm subpaths:

- `@tiptree/design-system/components/button.css`
- `@tiptree/design-system/layered/components/button.css`
- `@tiptree/design-system/tt.css`

The npm tarball and Python wheel contain no Button CSS, component manifest entry,
or dormant spec. Consumers pin immutable v0.3.1 assets and cannot observe this
removal until deliberately upgrading. The Button spec, parity evidence, and
reusable comparison engine remain in Git for future graduation work.

## Shared theme additions and fixes

- Graduates Althea's shipped danger-action roles, four status recipes,
  focus-ring color, inverse surface/text, and accent-on-surface roles.
- Prevents status foreground/background collapse with resolved recipe tests.
- Strengthens secondary-control boundaries to at least 3:1 against every
  published surface in both themes.
- Emits `color-scheme: only light` in light-polarity blocks to opt out of
  browser Auto Dark; dark-polarity blocks remain `color-scheme: dark`.
- Reframes the local showcase as a side-by-side tokens/themes explorer.

## Artifacts

The release workflow publishes the npm tarball, Python wheel, `SHA256SUMS`, and
build-provenance attestations. `GeneratedTokens.swift` remains a local build
output; iOS release integration is deferred.
