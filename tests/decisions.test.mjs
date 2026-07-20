// Decision tests — the designer's rulings as CI failures, ported from the
// docs-new pattern (tokens.test.ts) onto the generated output.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadSource } from '../scripts/build-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
build();
const css = readFileSync(join(ROOT, 'dist/css/tokens.css'), 'utf8');
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

test('generated CSS carries both themes with correct polarity', () => {
  assert.match(css, /:root \{\n {2}color-scheme: dark;/);
  assert.match(css, /\[data-theme='light'\] \{\n {2}color-scheme: light;/);
  assert.match(css, /--tt-color-accent: var\(--tt-teal-400\);/);
  assert.match(css, /--tt-color-accent: var\(--tt-teal-600\);/);
});

test('sage ramp stays hub-only (parked proposal, not public contract)', () => {
  assert.equal(Object.keys(data.tokens).filter((k) => k.startsWith('sage-')).length, 0);
});

test('tt.css contains no raw hex and no bare-element selectors', () => {
  const tt = readFileSync(join(ROOT, 'css/tt.css'), 'utf8');
  assert.equal([...tt.matchAll(/#[0-9a-f]{3,8}\b/gi)].length, 0);
  const body = tt.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const sel of ['button', 'input', 'select', 'textarea', 'a', 'h1', 'body', 'html']) {
    assert.doesNotMatch(body, new RegExp(`(^|[\\s,}])${sel}\\s*[,{]`, 'm'), `bare-element selector: ${sel}`);
  }
  assert.match(body, /@layer tt \{/);
});

test('python export resolves references to concrete hex', () => {
  const py = readFileSync(join(ROOT, 'python/tiptree_ui/_tokens.py'), 'utf8');
  assert.match(py, /'teal-600': '#47696b'/);
  assert.match(py, /def for_brand/);
  assert.doesNotMatch(py, /\{brand-/);
});
