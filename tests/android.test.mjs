import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argb, classify, dimension, emitTokens, float, identifier, ratio, uniqueIdentifiers } from '../scripts/android-tokens.mjs';
import { emitIcons, geometry, pathData } from '../scripts/android-icons.mjs';
import { androidFiles, checkAndroid, GENERATED } from '../scripts/build-android.mjs';
import { loadSource, resolve } from '../scripts/build-tokens.mjs';
import { parseBody } from '../scripts/build-icons.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { data } = loadSource();
const icons = JSON.parse(readFileSync(join(root, 'icons/icons.json'), 'utf8'));
const resolved = (source) => ({ base: resolve(source.tokens, source.tokens), themes: Object.fromEntries(
  ['light', 'dark'].map((theme) => [theme, resolve(source.themes[theme], source.tokens)]),
) });

test('Android exports every declared cross-platform token and preserves both resolved themes', () => {
  const values = resolved(data);
  const output = emitTokens(data, values);
  for (const [name, applicability] of Object.entries(data.applicability)) {
    const category = classify(name);
    if (applicability === 'cross-platform') assert.notEqual(category, 'unsupported', name);
    if (category === 'unsupported') continue;
    const native = identifier(name);
    assert.match(output.tokens + output.colors, new RegExp(`val ${native}:`), name);
    if (category === 'color') {
      for (const theme of ['light', 'dark']) {
        const value = values.themes[theme][name] ?? values.base[name];
        const hex = value.slice(1);
        const expected = (hex.length === 8 ? hex.slice(6) + hex.slice(0, 6) : 'ff' + hex).toUpperCase();
        if (name in data.tokens) {
          assert.ok(output.tokens.includes(`val ${native}: Color = Color(0x${expected})`), name);
        } else {
          const themeBlock = output.colors.split(`val ${theme}: TiptreeColors = TiptreeColors(`)[1].split('        )')[0];
          assert.ok(themeBlock.includes(`${native} = Color(0x${expected}),`), `${theme}:${name}`);
        }
        assert.ok(output[`${theme}Xml`].includes(`name="tt_${name.replaceAll('-', '_')}">#${expected}</color>`));
      }
    }
  }
});

test('Android preserves RGBA alpha and makes unit/scaling policy explicit', () => {
  assert.equal(argb('#abcdef12', 'overlay'), '12ABCDEF');
  assert.equal(argb('#00000000', 'clear'), '00000000');
  assert.equal(argb('#ffffff', 'white'), 'FFFFFFFF');
  assert.equal(dimension('0.5rem', 'space'), 8);
  assert.equal(dimension('1.0625rem', 'font'), 17);
  assert.equal(dimension('1px', 'hairline'), 1);
  assert.equal(dimension('0px', 'zero'), 0);
  assert.equal(ratio('calc(22 / 14)', 'small'), 22 / 14);
  assert.equal(float(1e21), '1e+21f');
  assert.equal(float(-0.011), '-0.011f');
  for (const value of ['#12345g', '#fff', 'rgba(0,0,0,0)', '#1122334455']) assert.throws(() => argb(value, 'color'));
  for (const value of ['-1rem', 'auto', '1vw', 'NaNpx', '1rem trailing', `${'9'.repeat(400)}px`]) assert.throws(() => dimension(value, 'size'));
  for (const value of ['calc(1 / 0)', 'Infinity', '0', 'calc(0 / 0)', '1+1']) assert.throws(() => ratio(value, 'height'));
});

test('new or malformed native forms fail instead of disappearing or emitting invalid Kotlin', () => {
  const mutate = (name, value, applicability = 'web-only') => {
    const source = structuredClone(data);
    source.tokens[name] = value;
    source.applicability[name] = applicability;
    return () => emitTokens(source, resolved(source));
  };
  for (const [name, value] of [['unhandled-token', '1'], ['speed-quick', '0.0001s'], ['font-weight-normal', '1001'],
    ['ease-out-quad', 'cubic-bezier(-1, 0, 1, 1)'], ['ease-out-quad', 'cubic-bezier(0, , 1, 1)'],
    ['ease-out-quad', 'cubic-bezier(0, 0x1, 1, 1)'], ['radius-4', `${'9'.repeat(50)}px`],
    ['font-letter-spacing-small', `${'9'.repeat(400)}em`], ['font-letter-spacing-small', `0.${'0'.repeat(60)}1em`],
    ['font-letter-spacing-small', '1px'], ['font-sans', 'evil()'],
    ['radius-4', 'calc(1px + 2px)'], ['font-custom-field', '1'], ['font-heading-page-family', 'Unknown Font']]) assert.throws(mutate(name, value), name);
  assert.throws(mutate('shadow-new', '0 0 black', 'cross-platform'), /Unexported cross-platform/);
  assert.throws(() => uniqueIdentifiers(['a-1', 'a1']), /colliding/);
  assert.throws(() => uniqueIdentifiers(['when']), /identifier/);
  assert.throws(() => uniqueIdentifiers(['1-leading']), /identifier/);
});

test('native exports track alias resolution, including references to a themed value', () => {
  const source = structuredClone(data);
  source.themes.dark['color-link'] = '{color-accent}';
  const output = emitTokens(source, resolved(source));
  assert.ok(output.colors.includes('colorLink = Color(0xFF82A7A9)'));
  assert.ok(output.colors.includes('colorLink = Color(0xFF47696B)'));
});

test('all glyphs and aliases are emitted deterministically with their canonical drawing names', () => {
  const output = emitIcons(icons, data.meta.version);
  assert.equal(output, emitIcons(structuredClone(icons), data.meta.version));
  assert.equal((output.match(/TiptreeGlyph\("/g) ?? []).length, Object.keys(icons.glyphs).length);
  for (const [name, glyph] of Object.entries(icons.glyphs)) {
    assert.ok(output.includes(`TiptreeGlyph("${name}", "${glyph.cut}"`));
    const parts = geometry(glyph.body);
    assert.ok(parts.length > 0);
    assert.ok(parts.every((part) => part.filled || [1, 1.5].includes(part.width)), name);
  }
  const aliased = structuredClone(icons);
  aliased.aliases['old-add'] = { to: 'add', since: '0.10.0' };
  assert.match(emitIcons(aliased, data.meta.version), /"old-add" -> Add/);
  assert.match(emitIcons(aliased, data.meta.version), /val OldAdd: TiptreeGlyph get\(\) = Add/);
  aliased.aliases['add-1'] = { to: 'add', since: '0.10.0' };
  aliased.aliases.add1 = { to: 'add', since: '0.10.0' };
  assert.throws(() => emitIcons(aliased, data.meta.version), /colliding/);
});

test('SVG conversion preserves inherited paint, fill rules, curves, and sanctioned thin strokes', () => {
  const parts = geometry('<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 3L4 5"/><circle cx="12" cy="12" r="2"/></g>');
  assert.deepEqual(parts[0], { data: 'M2 3L4 5', filled: false, width: 1.5, cap: 'round', join: 'miter', evenOdd: false });
  assert.equal(parts[1].data, 'M10 12A2 2 0 1 0 14 12A2 2 0 1 0 10 12Z');
  assert.deepEqual(parts[1].oval, [12, 12, 2, 2]);
  assert.match(emitIcons(icons, data.meta.version), /oval = Rect\(/);
  assert.ok(geometry(icons.glyphs['moon-stars'].body).some((p) => p.width === 1));
  assert.ok(geometry(icons.glyphs['plus-heavy'].body).every((p) => p.filled));
  assert.equal(geometry('<path fill="currentColor" fill-rule="evenodd" d="M0 0L1 1Z"/>')[0].evenOdd, true);
  assert.equal(pathData(parseBody('<rect x="1" y="2" width="8" height="6" rx="99"/>')[0]),
    'M5 2H5A4 3 0 0 1 9 5V5A4 3 0 0 1 5 8H5A4 3 0 0 1 1 5V5A4 3 0 0 1 5 2Z');
  assert.equal(pathData(parseBody('<ellipse cx="12" cy="10" rx="3" ry="2"/>')[0]), 'M9 10A3 2 0 1 0 15 10A3 2 0 1 0 9 10Z');
  assert.equal(pathData(parseBody('<line x1="1" y1="2" x2="3" y2="4"/>')[0]), 'M1 2L3 4');
  assert.equal(pathData(parseBody('<polyline points="1,2 3,4 5,6"/>')[0]), 'M1 2L3 4 5 6');
  assert.throws(() => pathData(parseBody('<polyline points="1 2 3"/>')[0]));
  assert.deepEqual(geometry('<circle r="2" fill="currentColor"/>')[0].oval, [0, 0, 2, 2]);
  const unsafe = structuredClone(icons);
  unsafe.glyphs.add.body = '<image href="https://example.com"/>';
  assert.throws(() => emitIcons(unsafe, data.meta.version), /validation failed/);
});

test('source parity catches missing, extra and stale files including bundled provenance', () => {
  const files = androidFiles(root, data, resolved(data));
  checkAndroid(root, files);
  assert.equal(files.get('assets/tiptree-design-system/icons.json'), readFileSync(join(root, 'icons/icons.json'), 'utf8'));
  const temp = mkdtempSync(join(tmpdir(), 'tt-android-parity-'));
  try {
    const directory = join(temp, GENERATED);
    mkdirSync(directory, { recursive: true });
    const expected = new Map([['test.txt', 'canonical']]);
    assert.throws(() => checkAndroid(temp, expected), /Missing/);
    writeFileSync(join(directory, 'test.txt'), 'stale');
    assert.throws(() => checkAndroid(temp, expected), /Stale/);
    writeFileSync(join(directory, 'test.txt'), 'canonical');
    checkAndroid(temp, expected);
    writeFileSync(join(directory, 'extra.txt'), 'extra');
    assert.throws(() => checkAndroid(temp, expected), /extra/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
