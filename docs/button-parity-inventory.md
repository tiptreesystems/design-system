# Button geometry parity inventory

Status: **Phase 1 checkpoint approved 2026-07-23. Phase 2 implements only the
approved tranche below; no consumer markup has been changed.**

Date: 2026-07-23

## Scope and evidence

This inventory classifies button-like controls in the current Lacuna and Althea
worktrees and uses the updated `docs` repository as a read-only reference. The
retiring `docs-new` proof worktree is not a migration target.

| Surface | Source inspected | Revision |
|---|---|---|
| Lacuna | `.slice-worktrees/lacuna/lacuna/interfaces/web.py`, `flask_site/*.py` | worktree `594816de20eddb428963ad6c45d1d448819c215b`; pre-slice consumer pin `c83877d185fa9e3a6fe95e07fba336744f91c923` |
| Althea | `.slice-worktrees/althea/frontend/web/src/assets/styles/`, component renderers, settings CSS | worktree `4605773be410c2f5232342b5b97baca2ac3cc755`; pre-slice consumer pin `3614b8ebe7b7fef0cede8c6bbff40f9446000fde` |
| Docs reference | `docs/docs_server/web/src/styles/components/button.css` and rendered fragments/components | `a918274a91b50c384ed1c8160726c83e9f80ca27` |

The source scan found 71 Lacuna and 133 Althea button/anchor candidates. The
tables below group repeated uses of the same control family; they do not hide
individual uses behind a sampled subset.

Computed values were captured with an installed Chromium headless shell against:

- the exact built Althea `app.css` and `public.css`;
- the exact Lacuna module-level CSS strings (`CSS`, `FEED_EXTRA_HEAD`,
  `_BOOKMARKS_CSS`, `HYPOTHESIS_EXTRA_CSS`, and `FEEDBACK_CSS`);
- the isolated anonymous-renderer CSS embedded in `web.py`; and
- the updated docs Button CSS with its token/base dependencies.

These are synthetic, saved-in-`/private/tmp` measurement fixtures, not migrated
real pages. They confirm cascade-resolved geometry but do **not** satisfy the
Phase 3 no-reflow gate. Widths shown for intrinsic controls use the fixture
label; Phase 3 must compare the same real label and surrounding layout before
and after migration. A source-only responsive result is marked `UNMEASURED`.

Tuple notation is:

`H/minH; padding T R B L; gap; font-size/line-height/weight; border; radius; icon`

All measurements are CSS pixels.

## Generic Button inventory

### Lacuna

| ID | Selector and live usage | Source | Computed geometry | Measurement status |
|---|---|---|---|---|
| L1 | `.btn-read-paper` PDF-viewer action in `flask_site/paper_page.py:127` | `web.py:747` | `29/0; 6 14 6 14; 6; 14.4/normal/600; 0; 6; 16×16`; example `128.703×29` | Measured |
| L2 | `.claim-btn.claim-btn-primary` “Send suggestion” in `flask_site/author_page.py:381` | `web.py:1183-1187` | `27/0; 6 16 6 16; 4; 13.6/normal/600; 0; 6; none`; example `141.578×27`. Secondary adds a 1px border and therefore is a distinct geometry. | Primary measured; secondary source-only |
| L3 | `.article-suggest-submit` in `flask_site/direction_page.py:454` | `web.py:1213-1215,1225` | desktop `36/0; 10 18 10 18; normal; 13.6/normal/600; 0; 6; none`; example `82.844×36`. At `≤640px`, width is `100%`. | Desktop measured; responsive width source-only |
| L4 | `.feed-query-submit` “Update Feed” in `web.py:7040` | `web.py:1620-1640` | desktop `54/54; 0 20 0 20; normal; 16/25.6/700; 0; 18; none`; example `138.453×54`. At `≤700px`, min-height is 50. | Desktop measured; mobile `UNMEASURED` |
| L5 | `.adv-apply-btn` “Apply” in `web.py:7215` | `web.py:897-898` | `29/0; 7 18 7 18; normal; 13.6/normal/500; 0; 6; none`; example `70.031×29` | Measured |
| L6 | anonymous-renderer search submit in `web.py:8475` | `web.py:8435-8465` | `45.594/auto; 0 14 0 14; normal; 16/25.6/400; borders 0 0 0 1; 0; none`; `79.516×45.594`, inside a `420×47.594` search form | Measured |
| L7 | feedback form submit in `web.py:9933` | `web.py:9733-9741` | `37/0; 10 24 10 24; normal; 15.2/normal/400; 0; 6; none`; example `154.484×37` | Measured |
| L8 | `.account-signout` in `web.py:10244` | `web.py:1289-1291` | `33/0; 8 18 8 18; normal; 13.44/normal/500; 1; 8; none`; example `87.328×33` | Measured |

Notes:

- `.claim-btn-secondary` cannot share the primary tuple without accounting for
  its four 1px borders.
- `.article-suggest-submit` and the two search actions have layout-dependent
  responsive widths. “Same Button” is not enough to prove no reflow; their
  containing form geometry must also be asserted.
- `.signup-email-btn` and `.hyp-chat-btn` have CSS at `web.py:1272` and
  `web.py:1255`, but no rendering usage was found in the current Python/JS
  source. They are orphan styles, not current generic usages.
- The `Keep in Reading` / `Dismiss` actions in `_BOOKMARKS_CSS` compute to
  `24px` high, but `_unused_bookmarks_page()` is unreachable because
  `/bookmarks` redirects to `/account`. They are recorded under exclusions,
  not promoted into the live Button API.

### Althea

| ID | Selector and usage family | Source | Computed geometry | Measurement status |
|---|---|---|---|---|
| A1 | `.app-btn` base: feedback cancel/submit, contact actions, provider add/edit/save/cancel, network actions, settings integration actions | `styles/buttons-app.css:2-38`; render sites include `ChatMessageFooter.js:190-191`, `BaseContactSection.js:45-168`, `advancedPanel.js:183,201,207-208`, `integrationPanel.js:18-88`, `networkPanel.js:79-81` | `36/36; 0 16 0 16; 6; 14/14/500; 1; 999; 16×16 when present`; example text `65.906×36`, with icon `87.906×36` | Measured |
| A2 | `.add-contact-button.app-btn` full-width contact action | `styles/contact.css:301-314`; `BaseContactSection.js:155` | `48/48; 0 16 0 16; 8; 14/14/500; 2 dashed; 999; none`; fixture width 420 (`100%`) | Measured |
| A3 | `.qr-action-btn.app-btn` Download vCard | `styles/contact.css:482-534`; `QRCodeDisplay.js:75` | desktop `36/36; 0 16 0 16; 6; 14/14/500; 1; 999; none; width 150`. At `≤768px`: same height, `px12`, font 13, width 150. | Desktop and mobile measured |
| A4 | `.profile-info-action.app-btn` OpenReview connect/disconnect | `js/settings/settings.css:1176-1185`; `profilePanel.js:530-532` | `36/36; 6 12 6 12; 6; 13/17.55/500; 1; 999; 16×16`; example `98.813×36` | Measured |
| A5 | `.github-connect-btn.app-btn` connect choices | `js/settings/settings.css:2483-2490`; `githubPanel.js:146,169,192` | `38/36; 10 16 10 16; 6; 14/14/500; 1; 999; 16×16; width 100%`; fixture width 420 | Measured |
| A6 | `.wandb-connect-btn.app-btn` | `js/settings/settings.css:2704-2710`; `wandbPanel.js:131` | `46/36; 14 24 14 24; 6; 16/16/600; 1; 999; 16×16`; example `136.609×46` (responsive rule makes it `100%`) | Measured |
| A7 | `.daemon-delete-btn.app-btn` | `js/settings/settings.css:2786-2790`; `daemonPanel.js:66` | `30/30; 0 10 0 10; 6; 12/12/500; 1; 999; none`; example `57.578×30` | Measured |
| A8 | `.daemon-refresh-btn.app-btn` | `js/settings/settings.css:2792-2795`; `daemonPanel.js:126` | `36/36; 0 16 0 16; 6; 13/13/500; 1; 999; none`; example `80.266×36` | Measured |
| A9 | `.bug-submit-btn.app-btn` | `js/settings/settings.css:2797-2803`; `bugsPanel.js:62` | A1 geometry plus `min-width:180`; measured `180×36` | Measured |
| A10 | `.task-modal .btn-primary/.btn-secondary` form actions | `styles/tasks.css:421-461`; `TaskForm.js:84-85` | desktop `33/auto; 8 16 8 16; 4; 13/normal/400; 1; 999; none`. At `≤600px`: `44px`, padding 12, font 16, width `100%`. | Desktop and mobile measured; natural desktop width must be measured in the real flex parent |
| A11 | `.new-task.btn-primary` | `styles/tasks.css:252-270,428-438,697-707`; `TaskModal.js:334` | desktop `34/auto; 8 16 8 16; 4; 13/normal/500; 1; 999; none`; example `91.719×34`. At `≤600px`: `45px`, padding 12, font 16, width `100%`. | Desktop and mobile measured |
| A12 | `.pill-button` onboarding idle action emitted by `PillButton` | `styles/base.css:43-64`; `PillButton.js:1-6`, `ChatInput.js:282-286` | `34/0; 8 20 8 20; 4; 13.6/normal/400; 1; 20; none`; example `106.75×34` | Measured |
| A13 | `.onboarding-skip` | `styles/onboarding.css:123-134`; `OnboardingModal.js:41` | `32/0; 8 4 8 4; 4; 13.6/normal/400; 0; 6; none`; example `34.969×32` | Measured |
| A14 | `.onboarding-back` | `styles/onboarding.css:141-153`; `OnboardingModal.js:43` | `35/0; 8 20 8 20; 4; 14.4/normal/400; 1; 8; none`; example `74.813×35` | Measured |
| A15 | `.onboarding-next` | `styles/onboarding.css:155-168`; `OnboardingModal.js:44` | `33/0; 8 24 8 24; 4; 14.4/normal/500; 0; 8; none`; example `78.938×33` | Measured |
| A16 | `.vcf-download-btn` | `styles/onboarding.css:255-269`; `AltheaContactStep.js:61` | `43/0; 12 12 12 12; 8; 14.4/normal/400; 1 dashed; 8; 16×16; width 100%`; fixture width 420 | Measured |
| A17 | `.auth-button` authentication/request-access actions | `styles/auth.css:339-398,483-496,615-629`; `AuthScreen.js:241,269-276`, `RequestAccessFlow.js:96-200` | desktop `44/44; 0 16 0 16; 4; 14/16.8/500; 1; 999; none; width 100%`. At `≤480px`: `56/56`, font `16/19.2`; same padding. | Desktop and mobile measured |
| A18 | `.oauth-button/.google-button` | `styles/auth.css:339-341,398-428,615-640`; `AuthScreen.js:208-214` | desktop `44/44; 0 24 0 24; row/column gap 4/10; 14/16.8/500; 1; 999; icon 18`. At `≤480px`: `56/56`, px20, column gap 11, `16/19.2`, icon 22. | Desktop and mobile measured |
| A19 | `.cta-button` waitlist action/submit | `styles/platform.css:55-94,275-285`; `Platform.js:25,138` | desktop `52/0; 14 24 14 24; 8; 17.6/normal/600; 1; 8; none`; example `150.313×52`. At the mobile breakpoint: `45px`, padding `12 20`, font 16, width `100%`. | Desktop and mobile measured |
| A20 | `.request-access-openreview-signin` text action | `styles/auth.css:883-894`; `RequestAccessFlow.js:167-169` | `16.797/0; 0; 4 inherited; 12/16.8/400; 0; 6 inherited; none`; example `176.234×16.797` | Measured; visually link-like but semantically an action button |

The A1 family covers all current ordinary `.app-btn` uses unless an override is
listed separately. Icon-only `.app-btn--icon` controls are excluded below.
Anchors carrying `.app-btn` are links and are also excluded under the task's
classification rule.

### Updated docs reference

The updated docs repository has one Button CSS atom. Its navigation anchors are
excluded from migration by the task rule; the repeated “Copy .md” action is the
live generic usage. All three source sizes are retained as reference geometries
because the medium 14px padding discrepancy was an explicit input to this audit.

| ID | Selector | Source | Computed geometry | Measurement status |
|---|---|---|---|---|
| D1 | `.button.button-small` | `docs_server/web/src/styles/components/button.css:29-34`; “Copy .md” in every article fragment | `32/0; 1 12 1 12; 8; 13/normal/510; variant border 0 or 1; 999; 14×14 when present` | Measured |
| D2 | `.button.button-medium` | same file `:36-41` | `40/0; 1 14 1 14; 8; 13/normal/510; variant border 0 or 1; 999` | Measured reference; no current action usage found |
| D3 | `.button.button-large` | same file `:43-48` | `44/0; 1 20 1 20; 6; 16/normal/510; variant border 0 or 1; 999` | Measured reference; no current action usage found |

The 1px block padding is Chromium's computed remainder from a fixed height; the
source specifies height and inline padding, not `padding-block:1px`.

## Provisional exact variant matrix

This is the minimal matrix of **distinct complete geometry profiles** found
above. A profile may serve many usage sites, but “close” tuples are not merged.
The long names are intentionally mechanical. Width constraints and responsive
profiles are separate modifiers because they are layout contracts, not colors.

| Proposed geometry profile | Provenance IDs | Exact differentiator |
|---|---|---|
| `tt-btn--h16d8-p0-f12-lh16d8-b0-r6` | A20 | link-like action, no padding |
| `tt-btn--h27-py6-px16-f13d6-b0-r6` | L2 primary | Lacuna claim primary |
| `tt-btn--h29-py6-px14-g6-f14d4-b0-r6` | L1 | Lacuna paper reader |
| `tt-btn--h29-py7-px18-f13d6-b0-r6` | L5 | Lacuna advanced apply |
| `tt-btn--h30-px10-g6-f12-lh12-b1-rfull` | A7 | Althea daemon delete |
| `tt-btn--h32-py8-px4-g4-f13d6-b0-r6` | A13 | Althea onboarding skip |
| `tt-btn--h32-px12-g8-f13-bvar-rfull` | D1 | docs small; border follows visual variant |
| `tt-btn--h33-py8-px16-g4-f13-b1-rfull` | A10 desktop | Althea task form |
| `tt-btn--h33-py8-px18-f13d44-b1-r8` | L8 | Lacuna sign out |
| `tt-btn--h33-py8-px24-g4-f14d4-b0-r8` | A15 | Althea onboarding next |
| `tt-btn--h34-py8-px16-g4-f13-b1-rfull-w500` | A11 desktop | Althea New Task |
| `tt-btn--h34-py8-px20-g4-f13d6-b1-r20-w400` | A12 | Althea PillButton |
| `tt-btn--h35-py8-px20-g4-f14d4-b1-r8` | A14 | Althea onboarding back |
| `tt-btn--h36-py10-px18-f13d6-b0-r6-w600` | L3 | Lacuna article submit |
| `tt-btn--h36-px16-g6-f14-lh14-b1-rfull` | A1, A3 desktop, A9 | Althea app base |
| `tt-btn--h36-py6-px12-g6-f13-lh17d55-b1-rfull` | A4 | Althea profile action |
| `tt-btn--h36-px16-g6-f13-lh13-b1-rfull` | A8 | Althea daemon refresh |
| `tt-btn--h36-px12-g6-f13-lh13-b1-rfull` | A3 mobile | Althea QR mobile |
| `tt-btn--h37-py10-px24-f15d2-b0-r6` | L7 | Lacuna feedback submit |
| `tt-btn--h38-py10-px16-g6-f14-lh14-b1-rfull` | A5 | Althea GitHub connect |
| `tt-btn--h40-px14-g8-f13-bvar-rfull` | D2 | docs medium |
| `tt-btn--h43-p12-g8-f14d4-b1-r8` | A16 | Althea VCF |
| `tt-btn--h44-px16-g4-f14-lh16d8-b1-rfull` | A17 desktop | Althea auth |
| `tt-btn--h44-p12-g4-f16-b1-rfull` | A10 mobile | Althea task form mobile |
| `tt-btn--h44-px20-g6-f16-bvar-rfull` | D3 | docs large |
| `tt-btn--h44-px24-g10-f14-lh16d8-b1-rfull` | A18 desktop | Althea OAuth |
| `tt-btn--h45-p12-g4-f16-b1-rfull-w500` | A11 mobile | Althea New Task mobile |
| `tt-btn--h45-py12-px20-g8-f16-b1-r8-w600` | A19 mobile | Althea CTA mobile |
| `tt-btn--h45d594-px14-f16-lh25d6-bl1-r0` | L6 | Lacuna anonymous search |
| `tt-btn--h46-py14-px24-g6-f16-lh16-b1-rfull-w600` | A6 | Althea W&B connect |
| `tt-btn--h48-px16-g8-f14-lh14-b2-rfull` | A2 | Althea add contact |
| `tt-btn--h50-px20-f16-lh25d6-b0-r18` | L4 mobile | Lacuna feed mobile; height is source-only |
| `tt-btn--h52-py14-px24-g8-f17d6-b1-r8-w600` | A19 desktop | Althea CTA |
| `tt-btn--h54-px20-f16-lh25d6-b0-r18` | L4 desktop | Lacuna feed |
| `tt-btn--h56-px16-g4-f16-lh19d2-b1-rfull` | A17 mobile | Althea auth mobile |
| `tt-btn--h56-px20-g11-f16-lh19d2-b1-rfull` | A18 mobile | Althea OAuth mobile |

Required layout/icon modifiers:

| Modifier | Provenance |
|---|---|
| `tt-btn--width-full` | L3 mobile; A2, A5, A6 mobile, A10/A11 mobile, A16-A19 where the containing flow sets `100%` |
| `tt-btn--width150` | A3 |
| `tt-btn--minw180` | A9 |
| `tt-btn--icon14`, `--icon16`, `--icon18`, `--icon22` | D1; L1/A1/A4/A5/A6/A16; A18 desktop; A18 mobile |

This is 36 exact profiles before adding the bordered L2 secondary profile. It
is evidence of the current estate, **not a recommendation to publish 37 public
Button sizes in v0.3.0**. A universal parity API and a small first deliverable
are in tension here. Phase 2 needs an explicit approved tranche.

## Excluded controls and future-component routing

Repeated instances are grouped by control family. Every candidate from the
source scan falls into a generic row above, an exclusion below, or the orphan /
unreachable notes.

| Future component / exclusion | Lacuna controls | Althea controls | Docs controls | Reason |
|---|---|---|---|---|
| `Tabs` / segmented navigation | `.tab-btn`, `.conf-tab` | task modal tabs | `Tabs.js` role-tab buttons | Tab semantics, selection state, and group geometry are not generic Button behavior. |
| `FilterChip` | `.conf-pill`, `.bk-chip`, `.bk-chip-folder`, search-filter links | `.blog-tag`, onboarding `.topic-chip` | none found in Button atom | Stateful filter/chip controls. |
| `Pagination` | `#conf-prev`, `#conf-next`, reader previous/next | `.blog-pagination-btn` | none | Pagination is a grouped navigation control. |
| `IconButton` | `.btn-icon`, `.nav-search-btn`, `.search-btn`, `.theme-toggle`, `.pdf-nav-btn`, suggestion clear/close, `.conf-bookmark-btn`, `.qm-add`, author-card 32×32 `.bookmark-btn` | chat send/attachment/footer actions, share buttons, modal closes, search clear, task list actions, settings visibility/refresh/delete controls, sidebar menu, profile/menu controls | command/search/close/theme/code-copy/zoom/hamburger/top-nav icon controls | No visible text label; Button v1 expressly requires a label. |
| `ToggleButton` / segmented control | `.hyp-signal-btn`, all bookmark/save-for-later buttons, folder membership buttons | `.wake-mode-option`, task active toggle, profile/edit visibility toggles | theme toggle | `aria-pressed`/stateful toggle behavior is outside Button v1. |
| `Disclosure` / menu trigger | `.conf-aside-toggle`, bookmark cog summary | trusted-institutions “more”, coordination/source toggles, profile menu, session more | sidebar group trigger, collapsible item trigger | Owns expanded state and controlled-region semantics. |
| `ToolbarAction` | `.bk-recluster`, `.bk-reader-back`, reader notes/dismiss/star, feed-card Bookmark/Share | task-header button, message footer chrome, blog share controls | article action cluster other than the text “Copy .md” Button | Position and grouping are part of a toolbar/card-action contract. |
| `PromptSuggestion` | `.deeper-q` | none | none | Full-width selectable question row, not a compact generic action. |
| `ZoomTrigger` | none | none | `.zoom-image-wrapper` | Image is the complete interactive surface. |
| Links | all `<a>` candidates: `.btn-read-paper` external link, `.adv-clear-btn`, `.account-link-btn`, error CTAs, CSV/Markdown links, venue CTA | all marketing/nav/hero/learn-more links plus `.app-btn`/`.qr-action-btn` anchors | GitHub/ecosystem/article CTAs and “View .md” | The Phase 1 charter explicitly excludes links, even when visually button-like. |
| Dead/unreachable cleanup | `.signup-email-btn`, `.hyp-chat-btn` have no renderer; `_unused_bookmarks_page()` Keep/Dismiss; slice-only `.tt-btn` fixture | legacy `:not(.app-btn)` rules with no matching current render site | none | No current real usage can pass a before/after adoption test. Do not create public variants from dead CSS. |

## Checkpoint findings requiring approval

1. **The requested Lacuna “one 32px control” conflicts with the scope.** The
   only verified 32×32 Lacuna control is the author-card bookmark at
   `web.py:713-715`; it is icon-only and a toggle, both explicitly excluded.
   There is no live generic 32px Lacuna Button in the inventory. Recommended
   replacement for Phase 3: `.account-signout` (33px) or the primary
   `.claim-btn` (27px). Authorizing the 32px control would start an IconButton /
   ToggleButton component and violate “Button only.”

2. **Implementing the whole matrix would make the first Button API a fossilized
   copy of every inconsistency in the estate.** Exact parity discovered 36 live
   or reference profiles (37 when the bordered claim-secondary profile is
   added), not four. Recommended v0.3.0 tranche:

   - docs reference profiles D1-D3 (existing 32/40/44 contract, correcting
     medium padding to 14px);
   - L1 `.btn-read-paper`;
   - L8 `.account-signout` as the second Lacuna representative;
   - A1 `.app-btn` base;
   - A19 desktop/mobile CTA if the Phase 3 “marketing page” remains required.

   All other tuples stay in this inventory for later designer rationalization
   or component-specific adoption. No unapproved “close enough” merge occurs.

3. **The task's link exclusion conflicts with the existing Button spec.**
   `specs/button.md` explicitly includes `<a class="tt-btn">` for navigation.
   This inventory obeys the task and excludes links, but Phase 2 cannot claim
   complete Button adoption while leaving that semantic branch untested.
   Recommended ruling: keep anchors in the spec, but state that navigation
   parity is outside v0.3.0 rather than deleting or changing the anatomy.

4. **Font weight/family/letter-spacing must be part of the mechanical parity
   harness even though the acceptance tuple names only font-size/line-height.**
   They change intrinsic width and can cause reflow. The matrix records weight;
   Phase 2 should assert family, weight, and letter-spacing as supporting
   properties whenever width is asserted.

At the moment this checkpoint was presented, no Phase 2 branch, CSS, spec,
token, version, build output, or consumer file had been changed.

## Approved Phase 2 ruling — 2026-07-23

Richard approved the following bounded tranche:

- updated docs profiles D1-D3: 32/40/44px, including the source's 14px medium
  horizontal padding;
- Lacuna L1 `.btn-read-paper` at 29px and L8 `.account-signout` at 33px;
- Althea A1 `.app-btn` at 36px; and
- Althea A19 as one responsive CTA profile: 52px desktop and 45px at the
  source's `width <= 768px` breakpoint, where its effective width also becomes
  `100%` (the earlier 640px rule is repeated by the later rule).

Phase 2 correction: those 52/45px values came from the built-CSS `file://`
fixture, where Althea's root-relative Inter URLs could not load. With the
self-hosted Inter fixtures loaded, the unchanged source computes to 51px
desktop and 46px mobile. Because the source declares no height, the approved
responsive profile preserves its padding/font/border/width inputs and leaves
height content-derived. The parity harness asserts equality in the font-loaded
state rather than hard-coding one fallback-font result.

All other profiles remain inventory-only and are not public v0.3 variants.
`.account-signout` replaces the originally requested Lacuna 32px representative;
the only verified 32px Lacuna control remains excluded as an icon-only bookmark
toggle. Button-styled anchors remain in the component anatomy, while migration
and parity proof for navigation links are outside v0.3.

## Status — identity/geometry split (2026-07-24)

The approved app-specific variant tranche above was superseded before v0.3 was
committed. The library now owns Button identity and exposes six sanctioned
geometry custom properties; only the docs-derived `sm`/`md`/`lg` presets remain
in library CSS. App profiles in this inventory are not deleted or normalized:
each remains the source for consumer-owned knob settings during migration and
the designer's future size-rationalization input.

For the fixed-label Lacuna `.account-signout`, changing the library-owned font
identity changes intrinsic width from the recorded 87.328px. Its migration
fixture therefore preserves that width as ordinary consumer layout CSS, as
permitted by the contract; font, radius, and color changes remain identity
deltas for designer review.
