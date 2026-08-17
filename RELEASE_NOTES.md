# v0.4.1

This release is the first product of the estate divergence-audit cadence. It
graduates shared semantic roles only where the consolidated Althea, docs, and
Lacuna evidence establishes the contract.

## Shared theme additions

- Adds surface-hover and disabled-action washes in both themes.
- Adds independently shared success and warning emphasis fills for chips and
  tags without changing the existing status recipe anchors.
- Adds the shared tooltip surface after verifying equivalent Althea and docs
  values in both themes.
- Keeps the accent-action ramp app-local until a second production consumer
  wants it.
- Defers button-hover fill: Althea's dark 6% alpha and docs' `#0f` alpha are not
  exactly CSS-equivalent, so the conditional release gate did not pass.

## Artifacts

The release workflow publishes the npm tarball, Python wheel, `SHA256SUMS`, and
build-provenance attestations. `GeneratedTokens.swift` remains a local build
output; iOS release integration is deferred.
