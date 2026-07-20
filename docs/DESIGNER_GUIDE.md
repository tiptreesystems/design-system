# Designer guide

This repository is where Tiptree's shared visual decisions live. You make and approve design decisions here; engineering owns generators, accessibility contracts, releases, and application integration.

## See your work

In a terminal opened at this repository, run:

```sh
npm run dev
```

Then open `http://localhost:4173`. The page refreshes its generated token data when you save changes. During the scaffold phase it shows the local showcase. Once an application has been onboarded, engineering will also attach screenshots of supported real-app pages to release-candidate reviews.

## Change a token

1. Open `tokens/tokens.json`.
2. Change the value for the existing token. Prefer references such as `{teal-600}` when a semantic token should follow a palette token.
3. Save and check the showcase in both light and dark modes.
4. Do not edit anything in `dist/` or the generated files under `python/tiptree_ui/`; the watcher creates those automatically.
5. Ask engineering if you need a new token name or are unsure whether a value is portable, app-specific, or a sub-brand decision.

## Add a component's visual specification

1. Agree on the component name and required states with engineering. Engineering owns its HTML meaning, accessibility, keyboard behavior, and events in `specs/`.
2. Add the visual rules to `css/tt.css` using `.tt-*` classes inside `@layer tt`.
3. Use `var(--tt-*)` values. Do not add raw colors, global resets, or selectors such as bare `button` or `input`.
4. Add a canonical example to `showcase/index.html`, including the visual states that need approval.
5. Check light and dark modes. Engineering will address any failing automated checks or semantic-contract changes with you.

## Read preview screenshots

- Compare the before and after images attached to the review.
- Check hierarchy, color, typography, spacing, component states, overflow, focus visibility, and light/dark behavior where that app supports both.
- Treat a missing, unstable, or obviously data-dependent screenshot as a test-fixture problem for engineering, not as approval evidence.
- Leave a specific comment on any unintended change and withhold approval until it is resolved or explicitly accepted.

## Approve a release

Confirm that the showcase, relevant preview screenshots, and documented visual decisions match your intent. Record your approval on the release review. Engineering runs the checks, chooses the version, creates the tag, publishes approved packages when registries are enabled, and handles rollback. You never need to run release commands or manage registry credentials.
