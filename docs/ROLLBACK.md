# Integration-slice rollback drill

These are the steps used to return the isolated consumer branches from the
non-mergeable v0.2.1 radius drill to their committed v0.2.0 proof state. They do not
publish, deploy, or alter a default branch.

The restored web composition hash is
`82519a08061635f580d0c533c72cb725fe84e6a1cd5ccd582fec472bfdc3c041`.

## Althea

From the Althea web package checkout:

```sh
git restore package.json package-lock.json
npm ci
ENVIRONMENT=local npm run build
npm ls @tiptree/design-system --depth=0
```

The proof requires `@tiptree/design-system@0.2.0` and the restored manifest values
`/public/assets/styles/public.e9d08289.css` and
`/public/assets/styles/app.d33cec9d.css`. Never run `build:local`; it uploads assets.

## Docs snapshot

From the docs snapshot checkout: restore the proof page with `git restore`, and move
the v0.2.1 composed stylesheet
(`tt.de1a37a9bbe24533f10057108f1c24e5ed629c5df6b3798f3653f3eca44e6aba.css`) out of
the assets directory into a temporary directory.

The restored page links the composed stylesheet named by the hash above. The moved
v0.2.1 file is retained in that temporary directory as recoverable drill evidence.

## Lacuna

From the Lacuna checkout: reinstall `tiptree_ui-0.2.0-py3-none-any.whl` from this
repository's `dist/py312/` with `pip install --force-reinstall --no-deps`, then run
Lacuna's design-system slice unit test.

Recreate the Flask process after reinstalling because the Blueprint precomposes at
process creation. The old URL must return HTTP 200 with
`Cache-Control: public, max-age=31536000, immutable`.

## iOS token evidence

From the iOS checkout: copy this repository's `dist/swift/GeneratedTokens.swift` over
the app's generated copy, run the app's token-parity script, and confirm
`git diff --exit-code` on the generated file.

This rolls back generated-token evidence only. No native component, package installation,
Xcode-project integration, or native-component rollback is exercised in this slice.

## Design-system state

`design-system/main` remains v0.2.0. The v0.2.1 evidence stays committed only on
`tt/slice-bump` at `d2f7ad494b4e5d3a8067b3ce00668e5cd36714fb` and must never merge.
