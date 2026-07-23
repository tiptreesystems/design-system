# Integration-slice rollback drill

These are the exact commands used to return the isolated consumer branches from the
non-mergeable v0.2.1 radius drill to their committed v0.2.0 proof state. They do not
publish, deploy, or alter a default branch.

The restored web composition hash is
`82519a08061635f580d0c533c72cb725fe84e6a1cd5ccd582fec472bfdc3c041`.

## Althea

From `.slice-worktrees/althea/frontend/web`:

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

From `.slice-worktrees/docs-new`:

```sh
git restore site/what-is.html
mv site/assets/tt.de1a37a9bbe24533f10057108f1c24e5ed629c5df6b3798f3653f3eca44e6aba.css /private/tmp/tt-docs-v021-composed.css
```

The restored page links
`site/assets/tt.82519a08061635f580d0c533c72cb725fe84e6a1cd5ccd582fec472bfdc3c041.css`.
The moved v0.2.1 file is retained under `/private/tmp` as recoverable drill evidence.

## Lacuna

From `.slice-worktrees/lacuna`:

```sh
.venv/bin/python -m pip install --force-reinstall --no-deps /Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/py312/tiptree_ui-0.2.0-py3-none-any.whl
PYTHONPATH=. .venv/bin/python -m unittest tests/test_design_system_slice.py -v
```

Recreate the Flask process after reinstalling because the Blueprint precomposes at
process creation. The old URL must return HTTP 200 with
`Cache-Control: public, max-age=31536000, immutable`.

## iOS token evidence

From `.slice-worktrees/platform-ios`:

```sh
cp /Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/swift/GeneratedTokens.swift TASCMobile/Generated/GeneratedTokens.swift
python3.12 scripts/verify_generated_token_parity.py
git diff --exit-code -- TASCMobile/Generated/GeneratedTokens.swift
```

This rolls back generated-token evidence only. No native component, package installation,
Xcode-project integration, or native-component rollback is exercised in this slice.

## Design-system state

`design-system/main` remains v0.2.0. The v0.2.1 evidence stays committed only on
`tt/slice-bump` at `d2f7ad494b4e5d3a8067b3ce00668e5cd36714fb` and must never merge.
