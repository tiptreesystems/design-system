// Decision and packaging tests. These encode designer rulings and the CSS contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadSource, resolve } from '../scripts/build-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
build();
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const { data } = loadSource();

test('brand palette is LOCKED (guidelines p.10)', () => {
  assert.equal(data.tokens['brand-black'], '#1b1b1b');
  assert.equal(data.tokens['brand-teal-dark'], '#47696b');
  assert.equal(data.tokens['brand-teal-light'], '#638b8d');
  assert.equal(data.tokens['brand-yellow'], '#e3e6a6');
});

test('ramps anchor to brand tokens, never restate their hex', () => {
  assert.equal(data.tokens['teal-500'], '{brand-teal-light}');
  assert.equal(data.tokens['teal-600'], '{brand-teal-dark}');
  assert.equal(data.tokens['citron-200'], '{brand-yellow}');
  assert.equal(data.tokens['stone-200'], '{brand-grey}');
});

test('accent stays within the brand teal hue in both themes', () => {
  assert.equal(data.themes.dark['color-accent'], '{teal-400}');
  assert.equal(data.themes.light['color-accent'], '{teal-600}');
});

test('theme polarity files encode their named default and explicit policy', () => {
  const light = read('dist/css/themes/light-default.css');
  const dark = read('dist/css/themes/dark-default.css');
  const explicit = read('dist/css/themes/explicit.css');
  assert.match(light, /:root \{\n {2}color-scheme: light;/);
  assert.match(light, /\[data-theme='dark'\] \{\n {2}color-scheme: dark;/);
  assert.match(dark, /:root \{\n {2}color-scheme: dark;/);
  assert.match(dark, /\[data-theme='light'\] \{\n {2}color-scheme: light;/);
  assert.doesNotMatch(explicit, /\n:root \{/);
  assert.match(explicit, /\[data-theme='light'\]/);
  assert.match(explicit, /\[data-theme='dark'\]/);
});

test('sage ramp stays hub-only (parked proposal, not public contract)', () => {
  assert.equal(Object.keys(data.tokens).filter((key) => key.startsWith('sage-')).length, 0);
});

test('component source is unlayered, namespaced, and dual cascade builds differ only by layer', () => {
  const source = read('css/components/button.css');
  const unlayered = read('dist/css/components/button.css');
  const layered = read('dist/css/layered/components/button.css');
  assert.doesNotMatch(source, /@layer\s+tt/);
  assert.doesNotMatch(unlayered, /@layer\s+tt/);
  assert.match(layered, /@layer\s+tt\s*\{/);
  assert.match(unlayered, /\.tt-btn/);
  assert.equal([...source.matchAll(/#[0-9a-f]{3,8}\b/gi)].length, 0);
});

test('Button exposes geometry knobs while keeping identity library-owned', () => {
  const source = read('css/components/button.css');
  const normalized = source.replace(/\s+/g, ' ');

  assert.match(normalized, /box-sizing: border-box;/);
  assert.match(normalized, /height: var\(--tt-btn-height, 40px\);/);
  assert.match(normalized, /min-height: var\(--tt-btn-min-height, auto\);/);
  assert.match(normalized, /padding: var\(--tt-btn-padding, 1px 14px\);/);
  assert.match(normalized, /gap: var\(--tt-btn-gap, 8px\);/);
  assert.match(normalized, /font-size: var\(--tt-btn-font-size, 13px\);/);
  assert.match(normalized, /line-height: var\(--tt-btn-line-height, normal\);/);

  const declarations = (selector) => {
    const match = source.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `${selector} block exists`);
    return Object.fromEntries(
      match[1]
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const split = entry.indexOf(':');
          return [entry.slice(0, split).trim(), entry.slice(split + 1).trim()];
        }),
    );
  };
  assert.deepEqual(declarations('tt-btn--sm'), {
    '--tt-btn-height': '32px',
    '--tt-btn-min-height': 'auto',
    '--tt-btn-padding': '1px 12px',
    '--tt-btn-gap': '8px',
    '--tt-btn-font-size': '13px',
    '--tt-btn-line-height': 'normal',
  });
  assert.deepEqual(declarations('tt-btn--md'), {
    '--tt-btn-height': '40px',
    '--tt-btn-min-height': 'auto',
    '--tt-btn-padding': '1px 14px',
    '--tt-btn-gap': '8px',
    '--tt-btn-font-size': '13px',
    '--tt-btn-line-height': 'normal',
  });
  assert.deepEqual(declarations('tt-btn--lg'), {
    '--tt-btn-height': '44px',
    '--tt-btn-min-height': 'auto',
    '--tt-btn-padding': '1px 20px',
    '--tt-btn-gap': '6px',
    '--tt-btn-font-size': '16px',
    '--tt-btn-line-height': 'normal',
  });

  assert.doesNotMatch(source, /\.tt-btn--h[0-9-]+\b/);
  for (const property of [
    'background',
    'color',
    'border-color',
    'border-radius',
    'border-style',
    'font-family',
    'font-weight',
    'transition',
    'cursor',
    'outline',
  ]) {
    assert.doesNotMatch(
      source,
      new RegExp(`${property}\\s*:[^;{}]*var\\(--tt-btn-`),
      `${property} must not be controlled by a geometry knob`,
    );
  }
});

test('standalone Button composition resolves every custom-property reference', () => {
  const composed = [
    read('dist/css/primitives.css'),
    read('dist/css/themes/light-default.css'),
    read('dist/css/components/button.css'),
  ].join('\n');
  const definitions = new Set([...composed.matchAll(/(--tt-[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
  const references = new Set([...composed.matchAll(/var\((--tt-[a-z0-9-]+)/g)].map((match) => match[1]));
  assert.match(composed, /\.tt-btn/);
  assert.deepEqual([...references].filter((name) => !definitions.has(name)), []);
});

test('manifest is deterministic and records ordered component integrity', () => {
  const first = read('dist/manifest.json');
  build();
  const second = read('dist/manifest.json');
  assert.equal(second, first);
  const manifest = JSON.parse(first);
  assert.deepEqual(manifest.order, ['button']);
  assert.equal(manifest.components.button.file, 'components/button.css');
  assert.match(manifest.components.button.sha256, /^[0-9a-f]{64}$/);
});

test('applicability covers exactly the union of base and themed token names', () => {
  const required = new Set([
    ...Object.keys(data.tokens),
    ...Object.keys(data.themes.light),
    ...Object.keys(data.themes.dark),
  ]);
  assert.deepEqual(new Set(Object.keys(data.applicability)), required);
  for (const value of Object.values(data.applicability)) {
    assert.ok(value === 'cross-platform' || value === 'web-only');
  }
  for (const prefix of ['z-', 'focus-', 'font-', 'shadow-', 'ease-']) {
    for (const name of [...required].filter((candidate) => candidate.startsWith(prefix))) {
      assert.equal(data.applicability[name], 'web-only');
    }
  }
});

test('resolver handles arbitrary-depth chains and rejects cycles and unknowns', () => {
  const base = { a: '{b}', b: '{c}', c: '#123456' };
  assert.deepEqual(resolve({ x: '{a}' }, base), { x: '#123456' });
  assert.throws(() => resolve({ x: '{loop}' }, { loop: '{loop}' }), /circular token reference/);
  assert.throws(() => resolve({ x: '{ghost}' }, {}), /unknown token reference/);
});

test('version parity: package.json, pyproject.toml, tokens meta, __version__', () => {
  const pkg = JSON.parse(read('package.json')).version;
  const pyproject = read('python/pyproject.toml').match(/^version = "(.+)"$/m)[1];
  const init = read('python/tiptree_ui/__init__.py').match(/__version__ = "(.+)"/)[1];
  const versions = { pkg, pyproject, tokens: data.meta.version, init };
  assert.equal(new Set(Object.values(versions)).size, 1, `version drift: ${JSON.stringify(versions)}`);
});

test('Python and Swift exports contain resolved, classified values', () => {
  const python = read('python/tiptree_ui/_tokens.py');
  const swift = read('dist/swift/GeneratedTokens.swift');
  assert.match(python, /'teal-600': '#47696b'/);
  assert.doesNotMatch(python, /\{brand-/);
  assert.match(swift, /public static let brandTealDarkUIColor/);
  assert.match(swift, /public static let r4: CGFloat = 4/);
  assert.match(swift, /public static let quick: TimeInterval = 0\.1/);
  assert.doesNotMatch(swift, /fontSans|zModal|easeOutQuad/);
});
