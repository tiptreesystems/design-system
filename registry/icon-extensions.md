# App-local icon extensions

A glyph an application needs before the package registry has it lives in that
application's own extension file, beside its icon role map, and is registered
here. The file uses the schema of `icons/icons.json`:

```json
{
  "meta": { "app": "althea", "extends": "0.7.0", "foldInto": "0.8.0" },
  "glyphs": { "<name>": { "cut": "linear", "source": "solar", "solar": "<id>-linear", "licence": "CC-BY-4.0", "body": "…" } }
}
```

Rules (ledger 2026-10-01, the icon contract):

- Every name is absent from the package registry. The app's own test asserts
  no collision with `ICONS.glyphs`, the required fields, and the body lint's
  reject-list; `validateIcons(data, { extension: true })` in
  `scripts/build-icons.mjs` is the reference check.
- Bodies are imported with `scripts/icon-body.mjs`, never written by hand.
- An entry folds verbatim into `icons/icons.json` at its `foldInto` release,
  where the full lint runs, and is deleted from the app in that bump PR.
- A `third-party-unknown` entry (licence `unknown`) never folds: it stays
  app-local until it is retired, by a designer's pick of a Solar glyph or a
  Tiptree drawing.

| app | name | source | requested by | fold-in release | designer ruling |
|---|---|---|---|---|---|
| Althea | `comment` | `third-party-unknown`, licence `unknown`: the prototype's comment bubble, a resize of the app's earlier `chat` glyph, itself Feather's `message-square` shape; origin not established | the app's four comment call sites, which split from `chat` (now `dialog`) at the rebuild's first landing; the extension file lands with that landing | never folds while its origin is unknown | `pending`: Ivan's sheet item 11 (pick a Solar glyph, nearest `chat-line-linear`, or draw one); until then the prototype's drawing stays app-local |
