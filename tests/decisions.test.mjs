// Decision and packaging tests. These encode designer rulings and the published contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadSource, resolve } from '../scripts/build-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
build();
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const { data } = loadSource();
const resolvedThemes = {
  dark: resolve(data.themes.dark, data.tokens),
  light: resolve(data.themes.light, data.tokens),
};

const relativeLuminance = (hex) => {
  const channels = hex.slice(1).match(/../g).map((part) => Number.parseInt(part, 16) / 255);
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const contrast = (a, b) => {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

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
  assert.match(light, /:root \{\n {2}color-scheme: only light;/);
  assert.match(light, /\[data-theme='dark'\] \{\n {2}color-scheme: dark;/);
  assert.match(dark, /:root \{\n {2}color-scheme: dark;/);
  assert.match(dark, /\[data-theme='light'\] \{\n {2}color-scheme: only light;/);
  assert.doesNotMatch(explicit, /\n:root \{/);
  assert.match(explicit, /\[data-theme='light'\] \{\n {2}color-scheme: only light;/);
  assert.match(explicit, /\[data-theme='dark'\] \{\n {2}color-scheme: dark;/);
});

test('status recipes preserve the shipped foreground/background roles', () => {
  const expectedDark = {
    success: ['#6ee7b7', '#0f2e1f', '#166534'],
    danger: ['#fca5a5', '#2e1414', '#7f1d1d'],
    warning: ['#fcd34d', '#2a2510', '#78350f'],
    info: ['#93c5fd', '#152040', '#1e3a8a'],
  };
  for (const [recipe, expected] of Object.entries(expectedDark)) {
    const actual = ['fg', 'bg', 'border'].map(
      (role) => resolvedThemes.dark[`color-status-${recipe}-${role}`],
    );
    assert.deepEqual(actual, expected, `${recipe} recipe drifted from Althea's shipped values`);
  }
  for (const theme of ['light', 'dark']) {
    for (const recipe of Object.keys(expectedDark)) {
      const foreground = resolvedThemes[theme][`color-status-${recipe}-fg`];
      const background = resolvedThemes[theme][`color-status-${recipe}-bg`];
      assert.notEqual(foreground, background, `${theme} ${recipe} foreground collapsed into background`);
      // Recipe roles also serve icons, borders, and large labels. The token
      // contract guarantees visible separation; components own stricter text
      // thresholds required by their anatomy.
      assert.ok(
        contrast(foreground, background) >= 3,
        `${theme} ${recipe} role contrast is ${contrast(foreground, background).toFixed(2)}:1`,
      );
    }
  }
});

test('secondary-control borders retain a 3:1 edge against button and page surfaces', () => {
  for (const theme of ['light', 'dark']) {
    const tokens = resolvedThemes[theme];
    const border = tokens['color-button-secondary-border'];
    for (const [surface, value] of [
      ['button', tokens['color-button-secondary-bg']],
      ['page', tokens['color-bg-primary']],
    ]) {
      assert.ok(
        contrast(border, value) >= 3,
        `${theme} secondary border is ${contrast(border, value).toFixed(2)}:1 against ${surface}`,
      );
    }
  }
});

test('sage ramp stays hub-only (parked proposal, not public contract)', () => {
  assert.equal(Object.keys(data.tokens).filter((key) => key.startsWith('sage-')).length, 0);
});

test('manifest is deterministic and advertises no unadopted components', () => {
  const first = read('dist/manifest.json');
  build();
  const second = read('dist/manifest.json');
  assert.equal(second, first);
  const manifest = JSON.parse(first);
  assert.deepEqual(manifest.order, []);
  assert.deepEqual(manifest.components, {});
  assert.equal(existsSync(join(ROOT, 'dist/css/components/button.css')), false);
  assert.equal(existsSync(join(ROOT, 'dist/css/tt.css')), false);
  const exports = JSON.parse(read('package.json')).exports;
  assert.equal(Object.keys(exports).some((name) => name.includes('components')), false);
  assert.equal('./tt.css' in exports, false);
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
  assert.match(swift, /public static let colorStatusSuccessFgUIColor/);
  assert.match(swift, /public static let r4: CGFloat = 4/);
  assert.match(swift, /public static let quick: TimeInterval = 0\.1/);
  assert.doesNotMatch(swift, /fontSans|zModal|easeOutQuad/);
});
