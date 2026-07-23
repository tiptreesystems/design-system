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

## 2026-07-22 — Phase A packaging candidate v0.2.0

- Source commit: `1fb3c70483ccecdea1856599835aaf40f2fa90b8` on `design-system/main`.
- npm candidate: `/Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/npm/tiptree-design-system-0.2.0.tgz`; 6,210 bytes; SHA-256 `5e29c7bf9e2c7401b19d74a1019f1b526c4f85d8466cf568c5de310e83ac37bd`.
- Python candidate: `/Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/py312/tiptree_ui-0.2.0-py3-none-any.whl`; 12,331 bytes; SHA-256 `dcf99742e0695bafa08399e6e03b4cc3ea4095e67439f9a17c843290893cde97`.
- All 18 generated files were rebuilt twice and were byte-identical. The package manifest orders only `button` and records its SHA-256.
- `npm run ci` passed 12 Node tests, 5 Python tests, and seven payload budgets. The unbudgeted-component probe exited 1 as required.
- The recursive development watcher rebuilt after `css/components/button.css` changed; `/`, `/dist/css/components/button.css`, and `/dist/manifest.json` each returned HTTP 200.
- Wheel proof: `assets/components/button.css`, all three themes, primitives, and `assets/manifest.json` are present. `compose(['button'])` is stable at hash `82519a08061635f580d0c533c72cb725fe84e6a1cd5ccd582fec472bfdc3c041`; `compose([])` differs.

## 2026-07-23 — Phase B v0.2.0 consumer evidence

### Docs snapshot

- Branch commit: `96722ebc49227371199a681935a10b395f1b0add` on `tt/slice-button`.
- The composition was produced from the packed npm artifact's manifest, not the source tree: primitives + light-default + Button = 7,251 bytes raw / 1,870 bytes Brotli, content hash `82519a08061635f580d0c533c72cb725fe84e6a1cd5ccd582fec472bfdc3c041`.
- `site/what-is.html` loaded the hashed CSS with no design-system JavaScript or React and rendered the Button in `docs/evidence/design-system-button-v0.2.0.png`.
- Known snapshot debt was observed and not changed: the article starts hidden until its bootstrap runs, and the representative page already loads 24 CSS files before the slice stylesheet. The snapshot integration is disposable and a future extraction may overwrite it.
- Static filename hashing is proven. Immutable hosting headers are not proven by the local static server and remain a host-configuration check.

### Althea

- Branch commit: `4605773be410c2f5232342b5b97baca2ac3cc755` on `tt/slice-button`.
- Pinned baseline (`ENVIRONMENT=local npm run build`): `public.css` 146,918 bytes raw / 21,080 bytes Brotli; `app.css` 237,600 / 29,324.
- v0.2.0 result: `public.css` 153,500 / 22,229; `app.css` 244,182 / 30,470. Each bundle added 6,582 raw bytes; Brotli deltas were 1,149 and 1,146 bytes. Combined built duplication cost was 13,164 raw / 2,295 Brotli; the three source artifacts total 7,251 raw bytes per bundle before esbuild processing.
- Hashing propagated through the real manifest: `public.e9d08289.css` and `app.d33cec9d.css`. No upload command ran.
- The production fixture using the real built `public.css` computed the Tiptree Button as `inline-flex`, 40px high, 16px inline padding, 9999px radius, black background, and white text. The existing host button remained `flex`, 29px, 12px, 6px radius, white background, and dark text.
- The separate layered negative control computed `flex`, 40px, 12px inline padding, 6px radius, white background, and dark text. This proves Althea's unlayered bare `button` rules outrank a layered component even when the component selector is more specific. Screenshots for both controls live under `frontend/web/docs/evidence/`.

### Lacuna

- Branch commit: `594816de20eddb428963ad6c45d1d448819c215b` on `tt/slice-button`.
- The v0.2.0 wheel was installed into an ignored Python 3.12 venv. Two Flask test-client tests proved selective composition, different hashes for `[]` and `['button']`, HTTP 200 at the matching content-hash URL, HTTP 404 for a mismatched hash, and the one-year immutable cache header.
- Button composition is 7,251 bytes raw / 1,870 bytes Brotli. The `CSS` constant at the pinned commit is 77,508 runtime bytes, not the plan prompt's 77,523-byte figure; the difference is recorded rather than normalized away.
- `create_http_app()` was not executed because it initializes database-backed serving state. A DB-free Flask harness used the exact AST-extracted `CSS` constant, the real package Blueprint, and the hand-written Button. Its screenshot is `docs/evidence/design-system-button-v0.2.0.png`. Asset serving is proven; full-factory and full-page performance evidence is degraded.
- Lighthouse and the first-visit render-blocking impact remain deferred to the serving-VM staging gate. No page-speed score is inferred from byte counts.

### iOS

- Branch commit: `f9ed357de73b6334440baf28d0c082f373ffc9dc` on `tt/slice-button`.
- The canonical generator emitted a 20,942-byte `GeneratedTokens.swift` using only cross-platform-classified tokens. The branch copies that file and contains no generator twin.
- The parity script calculated the existing `BrandColor.black` floats as `#1b1b1b` and `BrandColor.darkBlue` as `#47696b`, then matched both generated tokens.
- Only Command Line Tools are installed; `xcrun --sdk iphonesimulator --show-sdk-path` exited 1 because the iOS SDK is absent. UIKit/SwiftUI type-checking is therefore degraded. No Xcode project, native component, installation path, or native preview was changed.

## 2026-07-23 — Phase C v0.2.1 bump and rollback drill

- Evidence branch commit: `d2f7ad494b4e5d3a8067b3ce00668e5cd36714fb` on `tt/slice-bump`. It changes only four version surfaces and `radius-full` from 9999px to 12px; it never merges.
- npm v0.2.1 candidate: `/Users/richardngo/Desktop/Work/Upwork/Tiptree/.slice-worktrees/design-system-bump/dist/npm/tiptree-design-system-0.2.1.tgz`; 6,204 bytes; SHA-256 `f7b0044e26ce42b2b7f4cb89b8a0475e861e566848521f09d3228228cf465e2b`.
- Python v0.2.1 candidate: `/Users/richardngo/Desktop/Work/Upwork/Tiptree/.slice-worktrees/design-system-bump/dist/py312/tiptree_ui-0.2.1-py3-none-any.whl`; 12,325 bytes; SHA-256 `3daa474247baf3a94b41ce1ea01b7cebd9dac6aefef86ed0f261a4a677cd2f9e`.
- The v0.2.1 web composition is 7,249 bytes and hashes to `de1a37a9bbe24533f10057108f1c24e5ed629c5df6b3798f3653f3eca44e6aba`.
- Althea rebuilt to `public.b479c08a.css` and `app.32a2b149.css`; computed Button radius changed to 12px. Docs loaded the new hash and rendered the 12px Button. Lacuna returned the new hash with the immutable header and rendered the 12px Button in the exact-inline-CSS harness. Screenshots live in this repo's `docs/evidence/`.
- iOS generated output changed only its version marker and `Radius.full` from 9999 to 12; brand parity remained green. The recorded diff is `docs/evidence/platform-ios-radius-v0.2.1.diff`.
- Rollback returned every consumer branch clean at its committed v0.2.0 state. Althea restored package 0.2.0, its exact prior bundle sizes, and `public.e9d08289.css` / `app.d33cec9d.css`. Docs restored the old link. Lacuna reinstalled the v0.2.0 wheel and served `/tt-assets/82519a08061635f580d0c533c72cb725fe84e6a1cd5ccd582fec472bfdc3c041/tt.css` with HTTP 200 and the immutable header. iOS restored byte-identical v0.2.0 generated tokens and parity passed.
- Exact rollback commands are in `docs/ROLLBACK.md`. `design-system/main` remains v0.2.0; all consumer and bump branches remain local for overseer review.

## 2026-07-23 — Docs consumer scope update

- `docs-new` is retired and being deleted; the updated `docs` repository supersedes it.
- The proven static-composition recipe ports unchanged: compose from the installed manifest, write one content-hashed stylesheet, and link one bundle per page class.
- The updated docs repository's stack and design-system integration owner are pending confirmation from Martin and Ivan.
- The estate's last Next.js surface is gone.
- Cleanup of `.slice-worktrees/docs-new` and its local branch is queued until the repository deletion is final; neither is deleted as part of this scope sync.
