// Icon registry tests: the names, the body lint, provenance, exclusions,
// parity of every published copy, the packaging and licence wiring, and the
// prototype port map. These encode the 0.7.0 icon contract (ledger 2026-10-01).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from '../scripts/build-tokens.mjs';
import { canonicalJson, validateBody, validateIcons } from '../scripts/build-icons.mjs';
import { normaliseBody } from '../scripts/icon-body.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
build();
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const bytes = (path) => readFileSync(join(ROOT, path));
const icons = JSON.parse(read('icons/icons.json'));
const tokens = JSON.parse(read('tokens/tokens.json'));
const glyphs = Object.entries(icons.glyphs);

test('names snapshot: every glyph name and cut is pinned', () => {
  const snapshot = JSON.parse(read('tests/snapshots/icon-names.json'));
  const current = glyphs.map(([name, glyph]) => [name, glyph.cut]);
  const before = new Map(snapshot);
  const after = new Map(current);
  const added = [...after.keys()].filter((name) => !before.has(name));
  const removed = [...before.keys()].filter((name) => !after.has(name));
  const recut = [...after.keys()].filter((name) => before.has(name) && before.get(name) !== after.get(name));
  const unaliased = removed.filter((name) => !(name in icons.aliases));
  assert.deepEqual(
    current,
    snapshot,
    `icon names changed: added [${added}], removed [${removed}], re-cut [${recut}]` +
      (unaliased.length ? `; under 0.x a removed or renamed name keeps an alias for one minor: [${unaliased}]` : '') +
      '; regenerate tests/snapshots/icon-names.json in the same change',
  );
});

test('body lint passes every glyph and rejects what the normal form forbids', () => {
  validateIcons(icons, { tokensVersion: tokens.meta.version });
  const stroked = (attributes) =>
    `<path fill="none" stroke="currentColor" stroke-width="1.5"${attributes} d="M4 12H20" vector-effect="non-scaling-stroke"/>`;
  validateBody(stroked(''));
  const rejected = {
    'a hex colour': '<path fill="#000000" d="M4 12H20"/>',
    'a style attribute': stroked(' style="color:red"'),
    'a transform': stroked(' transform="rotate(45 12 12)"'),
    'a dash': stroked(' stroke-dasharray="1 2"'),
    'vector-effect on a group':
      '<g fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"><path d="M4 12H20" vector-effect="non-scaling-stroke"/></g>',
    'a stroked leaf without the vector effect': '<path fill="none" stroke="currentColor" stroke-width="1.5" d="M4 12H20"/>',
    'a stroke width other than 1.5': '<path fill="none" stroke="currentColor" stroke-width="2" d="M4 12H20" vector-effect="non-scaling-stroke"/>',
    'a stroked leaf with no stroke width': '<path fill="none" stroke="currentColor" d="M4 12H20" vector-effect="non-scaling-stroke"/>',
    'a leaf both filled and stroked': '<path fill="currentColor" stroke="currentColor" stroke-width="1.5" d="M4 12H20" vector-effect="non-scaling-stroke"/>',
    'implicit fill': '<path stroke="currentColor" stroke-width="1.5" d="M4 12H20" vector-effect="non-scaling-stroke"/>',
    'a disallowed element': '<use href="x"/>',
    'a nested group': '<g fill="currentColor"><g><path d="M4 12H20"/></g></g>',
    'an unclosed group': '<g fill="currentColor"><path d="M4 12H20"/>',
    'a leaf outside the grid': '<path fill="currentColor" d="M4 12H30"/>',
    'opacity': '<path fill="currentColor" opacity="0.5" d="M4 12H20"/>',
    'an entity': '<path fill="currentColor" d="M4 12H20&#10;"/>',
    'a url reference': '<path fill="currentColor" mask="url(m)" d="M4 12H20"/>',
  };
  for (const [description, body] of Object.entries(rejected)) {
    assert.throws(() => validateBody(body), Error, `the lint accepted ${description}`);
  }
  // An unset width passes only under an allow-listed name.
  const sparkles = icons.glyphs['moon-stars'];
  validateIcons({ ...icons, glyphs: { 'moon-stars': sparkles } });
  assert.throws(() => validateIcons({ ...icons, glyphs: { 'moon-stars-copy': sparkles } }), /no stroke-width/);
});

test('the importer adds the vector effect, expands the one dash and drops self-rotations only', () => {
  const dashed =
    '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2"/><path stroke-linejoin="round" d="M12 9V13H16"/><circle cx="12" cy="12" r="10" stroke-dasharray=".5 3.5"/></g>';
  assert.equal(normaliseBody(dashed), icons.glyphs['history-2'].body);
  assert.match(
    icons.glyphs['history-2'].body,
    /<path d="M2\.017 11\.416L2\.059 10\.918M3\.032 7\.575L3\.265 7\.132M5\.464 4\.432L5\.85 4\.115M8\.927 2\.484L9\.406 2\.342" vector-effect="non-scaling-stroke"\/>/,
  );
  assert.equal(
    normaliseBody('<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="currentColor"><circle cx="8.5" cy="5" r="1.5" transform="rotate(90 8.5 5)"/></g></svg>'),
    '<g fill="currentColor"><circle cx="8.5" cy="5" r="1.5"/></g>',
  );
  assert.throws(() => normaliseBody('<path fill="currentColor" transform="rotate(45 12 12)" d="M4 12H20"/>'), /rotation about its own centre/);
  assert.throws(() => normaliseBody('<svg viewBox="0 0 32 32"><path fill="currentColor" d="M4 12H20"/></svg>'), /viewBox/);
});

test('provenance: sources, licences, cuts and the counts are pinned', () => {
  const tally = (field) => glyphs.reduce((acc, [, glyph]) => ({ ...acc, [glyph[field]]: (acc[glyph[field]] ?? 0) + 1 }), {});
  assert.deepEqual(tally('source'), { solar: 113, 'solar-modified': 3, tiptree: 14 });
  assert.deepEqual(tally('cut'), { linear: 126, filled: 1, solid: 3 });
  assert.deepEqual(
    glyphs.filter(([, glyph]) => glyph.source === 'tiptree').map(([name]) => name),
    ['blockquote', 'check', 'close', 'divider', 'grip-dots', 'heading', 'list-numbered', 'merge', 'plus-heavy', 'question', 'reply-arrow', 'subheading', 'table-header', 'transcript'],
  );
  assert.deepEqual(
    Object.fromEntries(glyphs.filter(([, glyph]) => glyph.source === 'solar-modified').map(([name, glyph]) => [name, glyph.modified])),
    {
      ghost: 'eyes filled and enlarged (rx 1.05, ry 1.5)',
      'history-2': 'dashed ring (stroke-dasharray .5 3.5) expanded to its four visible dots',
      microphone: 'grille lines removed',
    },
  );
  assert.deepEqual(
    glyphs.filter(([, glyph]) => glyph.cut !== 'linear').map(([name, glyph]) => [name, glyph.cut, glyph.solar ?? null]),
    [['grip-dots', 'solid', null], ['menu-dots', 'solid', 'menu-dots-bold'], ['pin-filled', 'filled', 'pin-bold'], ['plus-heavy', 'solid', null]],
  );
  for (const [name, glyph] of glyphs) {
    if (glyph.cut === 'linear' && glyph.source !== 'tiptree') assert.equal(glyph.solar, `${name}-linear`, `${name} is keyed by its Iconify name`);
  }

  const one = (glyph) => ({ meta: icons.meta, aliases: {}, glyphs: { probe: glyph } });
  const linear = icons.glyphs.add;
  assert.throws(() => validateIcons(one({ ...linear, licence: 'Apache-2.0' })), /licence/);
  assert.throws(() => validateIcons(one({ ...linear, source: 'third-party-unknown', licence: 'unknown' })), /source/);
  assert.throws(() => validateIcons(one({ cut: 'linear', source: 'tiptree', licence: 'Apache-2.0', solar: 'add-linear', body: linear.body })), /solar|fields/);
  assert.throws(() => validateIcons(one({ ...linear, cut: 'solid' })), /solid/);
  assert.throws(() => validateIcons({ ...icons, glyphs: { 'add-filled': { ...icons.glyphs['pin-filled'] } } }), /filled cut needs add/);
  assert.throws(() => validateIcons({ ...icons, glyphs: { pin: icons.glyphs.pin, add: linear } }), /sorted/);
  assert.throws(() => validateIcons({ ...icons, aliases: { 'old-name': { to: 'missing', since: '0.8.0' } } }), /aliases/);
  assert.throws(() => validateIcons(icons, { tokensVersion: '9.9.9' }), /meta\.version/);
  const comment = { cut: 'linear', source: 'third-party-unknown', licence: 'unknown', body: linear.body };
  validateIcons({ meta: { app: 'althea', extends: icons.meta.version, foldInto: '0.8.0' }, glyphs: { comment } }, { extension: true });
});

test('exclusions: no brand marks and no glyph of unknown origin', () => {
  for (const name of ['whatsapp', 'comment']) assert.equal(name in icons.glyphs, false, `${name} must not ship`);
  for (const [name, glyph] of glyphs) {
    assert.doesNotMatch(glyph.body, /M17\.472 14\.382/, `${name} carries the WhatsApp mark`);
  }
});

test('parity: the canonical source, the module and both wheel copies agree', async () => {
  assert.equal(read('icons/icons.json'), canonicalJson(icons), 'icons/icons.json must be stored canonically');
  assert.deepEqual(bytes('dist/icons/icons.json'), bytes('icons/icons.json'));
  for (const file of ['icons.json', 'icons.js']) {
    assert.deepEqual(bytes(`python/tiptree_ui/assets/${file}`), bytes(`dist/icons/${file}`));
  }
  const module = await import(`${pathToFileURL(join(ROOT, 'dist/icons/icons.js')).href}?t=${Date.now()}`);
  assert.equal(module.default, module.ICONS);
  assert.ok(Object.isFrozen(module.ICONS) && Object.isFrozen(module.ICONS.glyphs));
  assert.equal(module.ICONS.version, icons.meta.version);
  assert.equal(module.ICONS.viewBox, icons.meta.viewBox);
  assert.match(module.ICONS.attribution, /^Solar icons by 480 Design, CC BY 4\.0 \(https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/\)/);
  assert.deepEqual(
    JSON.parse(JSON.stringify(module.ICONS.glyphs)),
    Object.fromEntries(glyphs.map(([name, glyph]) => [name, { cut: glyph.cut, body: glyph.body }])),
  );
  assert.deepEqual(JSON.parse(JSON.stringify(module.ICONS.aliases)), icons.aliases);

  const outputs = ['dist/icons/icons.json', 'dist/icons/icons.js', 'python/tiptree_ui/assets/icons.json', 'python/tiptree_ui/assets/icons.js'];
  const first = outputs.map(bytes);
  const stale = join(ROOT, 'dist/icons/removed.js');
  writeFileSync(stale, 'stale');
  build();
  assert.equal(existsSync(stale), false, 'a clean rebuild removes stale icon output');
  assert.deepEqual(outputs.map(bytes), first, 'a second build reproduces every icon output byte for byte');
});

test('wiring: exports, files, licence expression, licence files and notices', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.license, 'Apache-2.0 AND CC-BY-4.0');
  for (const entry of ['dist/icons/', 'LICENSE-CC-BY-4.0.txt', 'LICENSE', 'NOTICE']) assert.ok(pkg.files.includes(entry), `files lacks ${entry}`);
  assert.equal(pkg.exports['./icons.js'], './dist/icons/icons.js');
  assert.equal(pkg.exports['./icons.json'], './dist/icons/icons.json');
  const pyproject = read('python/pyproject.toml');
  assert.match(pyproject, /^license = "Apache-2\.0 AND CC-BY-4\.0"$/m);
  assert.match(pyproject, /^license-files = \["LICENSE", "NOTICE", "LICENSE-CC-BY-4\.0\.txt"\]$/m);
  assert.match(pyproject, /^tiptree_ui = \[.*"assets\/\*\.json".*"assets\/\*\.js".*\]$/m);
  for (const file of ['LICENSE', 'NOTICE', 'LICENSE-CC-BY-4.0.txt']) {
    assert.deepEqual(bytes(`python/${file}`), bytes(file), `python/${file} must be a byte copy of ${file}`);
  }
  assert.match(read('LICENSE'), /^\s*Apache License\s+Version 2\.0/);
  assert.match(read('LICENSE-CC-BY-4.0.txt'), /^Attribution 4\.0 International/);
  const notice = read('NOTICE');
  assert.match(notice, /Solar by 480 Design/);
  assert.match(notice, /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//);
  assert.match(notice, /480 Design does not endorse Tiptree Systems/);
  const module = read('dist/icons/icons.js');
  assert.ok(module.startsWith('/*!'), 'the module keeps a legal comment first');
  assert.match(module, /@license Apache-2\.0 AND CC-BY-4\.0/);
});

test('port map: every prototype name maps to a glyph or a listed exclusion', () => {
  const map = JSON.parse(read('icons/prototype-names.json'));
  assert.match(map._source, /^althea-prototype 99ac4f6:/);
  assert.equal(Object.keys(map.line).length, 93);
  assert.deepEqual(Object.keys(map.hub).sort(), ['caret-down', 'chevron-down', 'external', 'info-circle', 'lightbulb', 'moon', 'sun']);
  assert.deepEqual(
    Object.keys(map.bold).sort(),
    ['artifacts', 'bell', 'book', 'chat', 'check', 'chevronDown', 'chevronLeft', 'chevronRight', 'clock', 'close', 'display', 'filter', 'full', 'home', 'inbox', 'menu', 'network', 'panel', 'pin', 'plus', 'projects', 'search', 'settings', 'sort'],
  );
  // The exclusions listed in the registry's record: the two line glyphs, and
  // the six Bold library-page glyphs no app needs a Linear twin of.
  const expectedNulls = {
    line: Object.keys(map._excluded).sort(),
    hub: [],
    bold: ['chat', 'clock', 'display', 'full', 'home', 'inbox'],
  };
  assert.deepEqual(expectedNulls.line, ['comment', 'whatsapp']);
  for (const section of ['line', 'hub', 'bold']) {
    const entries = Object.entries(map[section]);
    assert.deepEqual(entries.filter(([, value]) => value === null).map(([key]) => key).sort(), expectedNulls[section]);
    for (const [key, value] of entries) {
      if (value !== null) assert.ok(value in icons.glyphs, `${section}.${key} maps to ${value}, which is not a glyph`);
    }
  }
});
