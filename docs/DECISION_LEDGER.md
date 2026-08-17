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

## 2026-07-23 — Button parity tranche and anchor policy

- Phase 1 inventoried 36 distinct complete geometry profiles before the bordered Lacuna claim-secondary profile; the estate record stays in `docs/button-parity-inventory.md`.
- The v0.3 deliverable is deliberately bounded to the updated docs 32/40/44px profiles, Lacuna `.btn-read-paper` at 29px, Lacuna `.account-signout` at 33px, Althea `.app-btn` at 36px, and one responsive Althea marketing CTA profile at 52px desktop / 45px plus full width at the source's effective `width <= 768px` breakpoint.
- `.account-signout` replaces the originally requested Lacuna 32px representative. The verified 32×32 bookmark is excluded because it is both icon-only and a toggle; it belongs to future IconButton/ToggleButton work.
- Button-styled anchors remain in `specs/button.md`: `<button>` for actions and `<a>` for navigation is contract anatomy. Navigation-link parity migration is outside v0.3, not removed from the contract.
- The pre-v0.3 `sm`/`md`/`lg` size names remain as deprecated aliases for the canonical geometry-derived `h32`/`h40`/`h44` names. Removal requires the plan's major-version deprecation policy.
- Phase 2 corrected the CTA height interpretation without changing its approved single-responsive-profile scope. The Phase 1 `file://` fixture measured 52/45px while Althea's root-relative Inter assets were unavailable; loading the existing self-hosted fonts makes the unchanged source compute to 51/46px. Because `.cta-button` declares no height, `h52-45` preserves the source's responsive padding, type, border, width, and breakpoint while leaving height content-derived. Hard-coding either measured pair would violate parity in the other legitimate font-loading state.

## 2026-07-24 — Button identity/geometry split

- Richard decided that the library owns Button identity: color, all interaction states, focus ring, border radius, font family/weight, transitions, cursor, and anatomy/accessibility. Consumers never override those properties.
- Consumers own contextual Button geometry through six sanctioned custom properties: height, min-height, padding, gap, font size, and line height. Width and margin remain ordinary consumer layout CSS, not component knobs.
- The evidence is the inventory itself: 37 app-context profiles show that size is contextual layout rather than stable brand identity. Publishing those profiles as library variants would fossilize estate inconsistency.
- App-specific `h*` classes are removed before v0.3 ships. The docs-derived `sm`/`md`/`lg` classes remain only as presets over the same knobs; all measured app values remain in `docs/button-parity-inventory.md` and move into consumer CSS during migration.
- Trade-off: convergence of geometry is opt-in and designer-led later. Immediate adoption preserves layout mechanically while identity deltas, including radius, are made explicit for designer review.
- Decision owner: Richard. Decision date: 2026-07-24.

## 2026-07-24 — Button v0.3 bounded migration evidence

- Design-system source commit: `5a119a9` on `main`. The earlier app-specific
  `h*` tranche was never committed; the identity/geometry split was the first
  v0.3 implementation pushed.
- npm candidate:
  `/Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/npm/tiptree-design-system-0.3.0.tgz`;
  7,798 bytes; SHA-256
  `d12bed93fc92e764fe7ff4f57779a36bbfa5b4f8c17a55adb73fdc3be3c5a437`.
- Python candidate:
  `/Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/py312/tiptree_ui-0.3.0-py3-none-any.whl`;
  13,050 bytes; SHA-256
  `fce6978397120f20ccc1b75aba0d6bfafcef2b879c9477c223a895d9688422bb`.
- Retained real-usage identity swaps: Lacuna account Sign out (maximum layout
  delta `0.016px`), Althea feedback Cancel (`0.000px`), and Althea Platform
  Join Waitlist (`0.000px` desktop and mobile). Parent and adjacent-sibling
  rectangles were unchanged in every retained case.
- Lacuna Read Paper action was reverted: identity font weight changed intrinsic
  width and adjacent position by `1.203125px`, above the `0.5px` gate.
- Althea Submit Feedback was reverted: primary border width changed `1px`,
  button width changed `2px`, and its sibling position changed `2px`.
- The Lacuna Read Paper anchor was not migrated, honoring the v0.3
  navigation-link scope decision.
- The rejected candidates reveal an unresolved contract edge: a
  library-owned identity property can affect layout even when all six geometry
  knobs reproduce their source values. No new knob or identity exception was
  introduced during this run.

## 2026-07-24 — Button parity density extension

- The real-consumer harness now runs desktop and mobile at device-pixel ratios
  1 and 2 because Button's secondary identity contains a high-density
  border-width rule.
- Chromium confirmed `devicePixelRatio: 2` and
  `(resolution >= 192dpi): true` in the high-density cases. All retained
  migrations kept the same results: Lacuna Sign out maximum `0.016px`;
  Althea feedback Cancel and Platform Join Waitlist `0.000px`.
- Chromium reports the secondary border's computed width as `1px` under
  emulation even while the high-density media query matches. A physical-device
  browser check remains prudent before a production merge; no result is
  fabricated from the CSS declaration alone.

## 2026-07-24 — Border-width geometry knob and Submit re-proof

- Decision owner: Richard. Border width is the seventh sanctioned Button
  geometry knob because it participates in the box model. Border style and
  color remain library identity.
- Font family and weight remain library identity with no consumer override.
  When they change intrinsic dimensions beyond the `0.5px` gate, the usage is
  rejected; Lacuna Read Paper therefore remains unmigrated.
- Althea Submit Feedback sets `--tt-btn-border-width: 1px` on its existing
  consumer geometry class. Height, min-height, width, padding, gap, font size,
  line height, all four border widths, parent bounds, and sibling positions
  match at `0.000px` across desktop/mobile and DPR 1/2.
- Submit is retained on the local `tt/button-parity` branch. Its teal-to-black
  background, transparent border color, radius, hover, and font-weight changes
  are recorded in `docs/button-identity-deltas.md` for designer approval.
- Replacement unpublished v0.3.0 npm candidate:
  `/Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/npm/tiptree-design-system-0.3.0.tgz`;
  8,053 bytes; SHA-256
  `5e69051730bbee7740c4bb2219d606f999e76862a7410057052699ec6de3c436`.
- Replacement unpublished v0.3.0 Python candidate:
  `/Users/richardngo/Desktop/Work/Upwork/Tiptree/design-system/dist/py312/tiptree_ui-0.3.0-py3-none-any.whl`;
  13,078 bytes; SHA-256
  `fae55278604229d26675296597a9718ce4943d5f7ba0e51cdfe430f97aada264`.
- These candidates supersede the earlier local v0.3.0 artifacts above. Version
  remains v0.3.0 because no v0.3.0 artifact has been published or tagged.
- Final bounded outcome: four retained identity swaps, one rejected for
  geometry, and one navigation-link usage not migrated by scope.

## 2026-07-24 — Consumer knob ownership correction

- An independent POC review found that Button's 192dpi rule assigned
  `--tt-btn-border-width: 0.5px`, overwriting consumer-owned geometry according
  to cascade order. Chromium happened to compute/render 1px in the recorded
  run; that did not establish WebKit parity.
- Component identity selectors and media queries never assign consumer-owned
  `--tt-btn-*` values. Only the documented `sm`/`md`/`lg` geometry presets may
  assign them. Decision tests enforce this mechanically.
- The high-density hairline is dropped. Secondary reads
  `var(--tt-btn-border-width, 1px)`: the fallback preserves the default, while
  an app's explicit geometry remains authoritative at every pixel density.
- Althea's Platform CTA explicitly preserves its original 1px border. Its
  parity remains `0.000px` at desktop/mobile and DPR 1/2 after the library
  correction.
- Corrected unpublished v0.3.0 npm candidate: 8,089 bytes, SHA-256
  `4f7c54da9f1d01228bcc54d8c89dc8b73df25f2aa5814be27ce7f276a79e5119`.
- Corrected unpublished v0.3.0 Python candidate: 12,924 bytes, SHA-256
  `9449b82ebc08484521594cb5664c070dbbfe2d343cd70bdca16a86bdc0ee5897`.

## 2026-07-24 — POC artifact delivery remains decision-gated

- Althea's `file:` npm tarball is workspace-local and cannot run in ordinary
  remote `npm ci` without first supplying the candidate artifact.
- Lacuna's workspace-relative wheel requirement cannot run in its default
  remote/container build without a Python artifact delivery decision.
- The docs POC points at a wheel outside the Docker build context, and its
  Dockerfile installs only `poetry.lock`; the local requirement is therefore
  intentionally not deployable.
- These are accepted POC constraints, not production dependency mechanisms.
  They remain unresolved pending Martin's npm-registry and Python-wheel
  delivery decisions. No consumer branch may be treated as deployable until
  its local candidate reference is replaced.

## 2026-08-13 — First production consumer: Althea (dark mode)

- Distribution is decided and executed: immutable GitHub Release assets from
  this public repo (`RELEASING.md`), first shipped as `v0.3.1`. This
  supersedes the 2026-07-24 "POC artifact delivery remains decision-gated"
  entry — consumers now pin release-tarball URLs; no registry publishing.
- Althea (`tiptreesystems/frontend`, branch `feature/dark-mode`, merging) is
  the first production consumer: `package.json` pins the `v0.3.1` release
  `.tgz` (lockfile integrity records the URL + hash), and both CSS bundles
  import `@tiptree/design-system/primitives.css` and
  `/themes/light-default.css` via exports subpaths. Twelve Althea tokens are
  byte-identical aliases onto `--tt-*` names: the seven brand tokens and five
  `#fff`-valued semantics onto `--tt-stone-000`.
- Althea's dark values live app-side for v1, in its `tokens.css` under
  `:root[data-theme='dark']`, derived from the docs dark palette. Graduation
  candidates for a future `v0.4.x` token release: the danger ramp, the four
  status recipes (pale foreground on deep tint), a focus-ring color token,
  the inverse-chrome pair, and an accent-on-surface text token.
- KNOWN DEFECT to fix at the token level (found in Althea's dark-mode
  review; applies in BOTH themes): `--tt-color-button-secondary-bg` /
  `--tt-color-button-secondary-border` fail WCAG 1.4.11's 3:1 non-text
  contrast — dark bg-vs-surface 1.15:1, border edges 1.60/1.84:1; light's
  own border edge is 1.29:1. A future release should rule stronger values;
  consumers inherit the fix automatically through the theme file.
- RULED FIX for a future release: `color-scheme: light` in light-polarity
  theme files does NOT opt pages out of Chrome's Auto Dark Theme — only
  `color-scheme: only light` does. `build-tokens.mjs` should emit
  `only light` in the light block (dark block stays `dark`) and
  `tests/decisions.test.mjs` updates accordingly.

## 2026-08-17 — v0.4.0 records shipped theme reality; Button becomes dormant

- Design-system scope is the recorded truth of what applications share. A
  component enters the package and showcase only with a named production
  consumer; `docs/ADDING_A_COMPONENT.md` makes that an admission gate.
- Button completed its delivery-mechanics proof — release packaging, consumer
  parity, the identity/geometry split, seven geometry knobs, and the 37-profile
  inventory — but never reached a production consumer. Its CSS, npm exports,
  full-component bundle, Python asset, manifest entry, budget, active tests,
  and showcase entry are removed in v0.4.0. The generic consumer parity engine,
  dormant spec, inventory, identity rulings, evidence, and ledger history stay.
  Resurrection starts from those records and Git history when a real consumer
  is ready to consolidate.
- Removal needs no deprecation release: consumers pin immutable release assets
  and cannot observe v0.4.0 until deliberately changing their URL and lockfile;
  no production repository imports `.tt-btn` or Button CSS. The old
  `tt/button-parity` branch remains POC evidence, not a consumer.
- Althea dark-mode commit
  `1a3e44d613fe6f726f690f99e2418337293d9a74` is the value provenance for the
  graduated roles. v0.4.0 adds semantic danger-action states, focus-ring color,
  inverse surface/text, accent-on-surface states, and four explicit status
  recipes. Dark recipes are success `#6ee7b7/#0f2e1f/#166534`, danger
  `#fca5a5/#2e1414/#7f1d1d`, warning `#fcd34d/#2a2510/#78350f`, and info
  `#93c5fd/#152040/#1e3a8a` (foreground/background/border). Decision tests pin
  the tuples, require foreground and background to differ, and require at
  least 3:1 role separation in both themes.
- Secondary-control boundaries now use `stone-550` in both themes. The build
  test enforces a 3:1 edge against every published button, page, card, and code
  surface in both polarities rather than assuming controls only sit on canvas.
- Every light-polarity block now emits `color-scheme: only light`; dark blocks
  remain `color-scheme: dark`. This is the previously ruled Chrome Auto Dark
  opt-out, not a component styling decision.
- The local showcase is now a tokens/themes explorer: adopted color primitives
  and the complete semantic polarities render side-by-side, including the four
  status recipes. Its page-level toggle changes only the surrounding explorer
  chrome.
