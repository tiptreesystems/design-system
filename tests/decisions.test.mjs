// Decision and packaging tests. These encode designer rulings and the published contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadSource, resolve, validate } from '../scripts/build-tokens.mjs';

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
  assert.equal(data.themes.light['color-accent'], '{teal-550}');
});

test('graduated inverse and surface-accent roles alias existing theme contracts', () => {
  for (const theme of ['light', 'dark']) {
    assert.equal(data.themes[theme]['color-surface-inverse'], '{color-button-invert-bg}');
    assert.equal(data.themes[theme]['color-text-on-inverse'], '{color-button-invert-fg}');
    assert.equal(data.themes[theme]['color-accent-on-surface'], '{color-accent}');
    assert.equal(data.themes[theme]['color-accent-on-surface-hover'], '{color-accent-hover}');
  }
});

test('v0.4.1 estate graduations pin both theme values symmetrically', () => {
  const expected = {
    'color-surface-hover': ['#1b1b1b0d', '#ffffff0f'],
    'color-action-disabled-bg': ['#1b1b1b0f', '#ffffff14'],
    'color-status-success-bg-emphasis': ['#d1fae5', '#0f2e1f'],
    'color-status-warning-bg-emphasis': ['#fef3c7', '#2a2510'],
    'color-surface-tooltip': ['#000000cc', '#edede9'],
  };
  for (const [name, [light, dark]] of Object.entries(expected)) {
    assert.equal(resolvedThemes.light[name], light, `${name} light value drifted`);
    assert.equal(resolvedThemes.dark[name], dark, `${name} dark value drifted`);
  }
  assert.equal(data.themes.dark['color-status-success-bg-emphasis'], '{color-status-success-bg}');
  assert.equal(data.themes.dark['color-status-warning-bg-emphasis'], '{color-status-warning-bg}');
  assert.equal(data.themes.dark['color-surface-tooltip'], '{stone-200}');
  assert.equal('color-button-hover-bg' in data.themes.light, false);
  assert.equal('color-button-hover-bg' in data.themes.dark, false);
});

test('v0.5.0 ruled graduations preserve values, references, and applicability', () => {
  // text-quaternary and the dark sunken well re-pinned 2026-09-29 (v0.6.0):
  // the greys moved one stone step and the dark ladder came down.
  const expected = {
    'color-text-quaternary': ['#7e7c73', '#909088'],
    'color-surface-sunken': ['#f1f1ec', '#10100f'],
    'color-scrollbar-thumb': ['#0000001a', '#ffffff1a'],
    'color-border-interactive': ['#cfcfc6', '#464641'],
  };
  for (const [name, [light, dark]] of Object.entries(expected)) {
    assert.equal(resolvedThemes.light[name], light, `${name} light value drifted`);
    assert.equal(resolvedThemes.dark[name], dark, `${name} dark value drifted`);
  }

  assert.equal(data.themes.light['color-text-quaternary'], '{stone-550}');
  assert.equal(data.themes.dark['color-text-quaternary'], '{stone-500}');
  assert.equal(data.themes.light['color-surface-sunken'], '{stone-150}');
  assert.equal(data.themes.dark['color-surface-sunken'], '{stone-1000}');
  assert.equal(data.themes.light['color-border-interactive'], '{stone-350}');
  assert.equal(data.themes.dark['color-border-interactive'], '#464641');
  assert.equal(data.themes.light['color-scrollbar-thumb'], '#0000001a');
  assert.equal(data.themes.dark['color-scrollbar-thumb'], '#ffffff1a');

  assert.equal(data.applicability['color-scrollbar-thumb'], 'web-only');
  for (const name of [
    'color-text-quaternary',
    'color-surface-sunken',
    'color-border-interactive',
  ]) {
    assert.equal(data.applicability[name], 'cross-platform');
  }
});

test('v0.6.0 prototype re-ruling pins the ladder, the light greys, and the accent pair', () => {
  const primitives = {
    'stone-050': '#fcfcfb',
    'stone-850': '#282826',
    'stone-875': '#222220',
    'stone-900': '#1b1b1a',
    'stone-950': '#161615',
    'stone-1000': '#10100f',
    'stone-1050': '#0d0d0c',
    'teal-550': '#3c8286',
    'teal-650': '#346f72',
    'radius-20': '20px',
  };
  for (const [name, value] of Object.entries(primitives)) {
    assert.equal(data.tokens[name], value, `${name} drifted from the prototype`);
    assert.equal(data.applicability[name], 'cross-platform');
  }
  assert.equal(data.themes.light['color-text-secondary'], '{stone-750}');
  assert.equal(data.themes.light['color-text-tertiary'], '{stone-650}');
  assert.equal(data.themes.dark['color-text-secondary'], '{stone-300}');
  assert.equal(data.themes.dark['color-text-tertiary'], '{stone-400}');
  assert.equal(data.themes.light['color-accent-hover'], '{teal-650}');
  assert.equal(data.themes.dark['color-accent-hover'], '{teal-300}');
  assert.equal(data.themes.light['color-link'], '{teal-600}');
  assert.equal(data.themes.dark['color-link'], '{teal-300}');
  // Accepted for non-text accent use: 4.33:1 on the light canvas (ledger 2026-09-29).
  assert.equal(
    contrast(resolvedThemes.light['color-accent'], resolvedThemes.light['color-bg-primary']).toFixed(2),
    '4.33',
  );
  // Light border-primary collapses onto border-interactive by ruling; dark keeps them apart.
  assert.equal(data.themes.light['color-border-primary'], '{stone-350}');
  assert.equal(resolvedThemes.light['color-border-primary'], resolvedThemes.light['color-border-interactive']);
  assert.notEqual(resolvedThemes.dark['color-border-primary'], resolvedThemes.dark['color-border-interactive']);
});

test('v0.6.0 new roles pin both theme values, references, and applicability', () => {
  const expected = {
    'color-bg-ground': ['#fcfcfb', '#0d0d0c'],
    'color-row-hover': ['#f1f1ec', '#ffffff1c'],
    'color-surface-open': ['#edede9', '#ffffff26'],
    'color-border-section': ['#e6e6e0', '#282826'],
    'color-keycap-bg': ['#a6a69b', '#4d4d47'],
    'color-keycap-bg-hover': ['#7e7c73', '#6f6f67'],
    'color-mark-new': ['#a4564a', '#c47b6e'],
    'color-mark-live': ['#47696b', '#a3c3c4'],
    'color-mark-idle': ['#bebeb3', '#6f6f67'],
    'color-mark-community': ['#6a6499', '#9a95bd'],
    'color-channel-whatsapp': ['#4e7c5c', '#7fae8c'],
    'color-channel-sms': ['#63864a', '#9db884'],
    'shadow-lift': [
      '0 4px 24px #4d4d4706, 0 4px 32px #4d4d4706, 0 16px 32px #4d4d4704',
      '0 2px 6px #00000033, 0 8px 24px #00000047',
    ],
  };
  for (const [name, [light, dark]] of Object.entries(expected)) {
    assert.equal(resolvedThemes.light[name], light, `${name} light value drifted`);
    assert.equal(resolvedThemes.dark[name], dark, `${name} dark value drifted`);
  }

  const references = {
    'color-bg-ground': ['{stone-050}', '{stone-1050}'],
    'color-row-hover': ['{stone-150}', '#ffffff1c'],
    'color-surface-open': ['{stone-200}', '#ffffff26'],
    'color-border-section': ['{stone-250}', '{stone-850}'],
    'color-keycap-bg': ['{stone-450}', '{stone-700}'],
    'color-keycap-bg-hover': ['{stone-550}', '{stone-600}'],
    'color-mark-live': ['{teal-600}', '{teal-300}'],
    'color-mark-idle': ['{stone-400}', '{stone-600}'],
    'color-mark-new': ['#a4564a', '#c47b6e'],
    'color-mark-community': ['#6a6499', '#9a95bd'],
    'color-channel-whatsapp': ['#4e7c5c', '#7fae8c'],
    'color-channel-sms': ['#63864a', '#9db884'],
  };
  for (const [name, [light, dark]] of Object.entries(references)) {
    assert.equal(data.themes.light[name], light, `${name} light reference drifted`);
    assert.equal(data.themes.dark[name], dark, `${name} dark reference drifted`);
  }

  // Surface hover is unchanged; hover, open, and the wash stay three distinct grounds.
  for (const theme of ['light', 'dark']) {
    const tokens = resolvedThemes[theme];
    assert.notEqual(tokens['color-row-hover'], tokens['color-surface-hover']);
    assert.notEqual(tokens['color-row-hover'], tokens['color-surface-open']);
    assert.notEqual(tokens['color-surface-open'], tokens['color-surface-hover']);
  }

  assert.equal(data.applicability['shadow-lift'], 'web-only');
  for (const name of Object.keys(expected).filter((candidate) => candidate.startsWith('color-'))) {
    assert.equal(data.applicability[name], 'cross-platform');
  }
  const controls = {
    'control-hero': '56px',
    'control-large': '44px',
    'control-default': '36px',
    'control-small': '28px',
  };
  for (const [name, value] of Object.entries(controls)) {
    assert.equal(data.tokens[name], value);
    assert.equal(data.applicability[name], 'web-only');
  }
  const type = {
    'font-size-large': '1.0625rem',
    'font-line-height-large': '1.6',
    'font-letter-spacing-large': '0',
    'font-size-regular': '0.9375rem',
    'font-line-height-regular': '1.5',
    'font-letter-spacing-regular': '-0.011em',
    'font-size-small': '0.875rem',
    'font-line-height-small': '1.5',
    'font-letter-spacing-small': '-0.013em',
    'font-size-mini': '0.8125rem',
    'font-line-height-mini': '1.5',
    'font-letter-spacing-mini': '-0.01em',
    'font-size-micro': '0.75rem',
    'font-line-height-micro': '1.4',
    'font-letter-spacing-micro': '0',
    'font-size-tiny': '0.625rem',
    'font-line-height-tiny': '1.5',
    'font-letter-spacing-tiny': '-0.015em',
    'font-heading-display-size': '3.25rem',
    'font-heading-display-line-height': '1.05',
    'font-heading-display-letter-spacing': '-0.022em',
    'font-heading-display-weight': '300',
    'font-heading-page-family': '{font-serif}',
    'font-heading-page-size': '2.5rem',
    'font-heading-page-line-height': '1.2',
    'font-heading-page-letter-spacing': '-0.02em',
    'font-heading-page-weight': '300',
    'font-heading-section-family': '{font-serif}',
    'font-heading-section-size': '1.375rem',
    'font-heading-section-line-height': '1.33',
    'font-heading-section-letter-spacing': '-0.01em',
    'font-heading-section-weight': '400',
    'font-heading-sub-family': '{font-sans}',
    'font-heading-sub-size': '1.0625rem',
    'font-heading-sub-line-height': '1.4',
    'font-heading-sub-letter-spacing': '-0.012em',
    'font-heading-sub-weight': '{font-weight-medium}',
  };
  for (const [name, value] of Object.entries(type)) {
    assert.equal(data.tokens[name], value, `${name} drifted from the prototype`);
    assert.equal(data.applicability[name], 'web-only');
  }
  assert.match(data.tokens['font-code'], /^'Google Sans Code'/);
  assert.deepEqual(
    ['light', 'normal', 'medium', 'semibold', 'bold'].map((weight) => data.tokens[`font-weight-${weight}`]),
    ['300', '400', '510', '590', '680'],
  );
  // v0.7.0: the sub step takes the 510 axis position by reference (sheet item 15).
  assert.equal(resolve(data.tokens, data.tokens)['font-heading-sub-weight'], '510');
});

test('v0.7.0 additions pin values, references and applicability', () => {
  const base = resolve(data.tokens, data.tokens);
  assert.equal(data.tokens['radius-28'], '28px');
  assert.equal(data.applicability['radius-28'], 'cross-platform');
  assert.match(read('dist/swift/GeneratedTokens.swift'), /public static let r28: CGFloat = 28/);
  assert.deepEqual(
    Object.keys(data.tokens).filter((name) => name.startsWith('radius-')),
    ['radius-4', 'radius-6', 'radius-8', 'radius-12', 'radius-16', 'radius-20', 'radius-24', 'radius-28', 'radius-full'],
    'the ladder is 4/8/12/16/20/24/28/full with radius-6 kept off it; no radius-10',
  );
  assert.equal(data.tokens['border-hairline'], '1px');
  assert.equal(base['border-hairline'], '1px');
  assert.equal(data.applicability['border-hairline'], 'web-only');

  // The Button roles (sheet items 3 and 4; decisions A9: the prototype's
  // Button, its dark glass made opaque).
  const references = {
    'color-action-primary-bg': ['{teal-600}', '#2e585a'],
    'color-action-primary-bg-hover': ['{teal-700}', '#43696b'],
    'color-action-primary-fg': ['{stone-000}', '{stone-000}'],
    'color-button-secondary-bg-hover': ['{stone-150}', '#40403f'],
  };
  const values = {
    'color-action-primary-bg': ['#47696b', '#2e585a'],
    'color-action-primary-bg-hover': ['#3a5759', '#43696b'],
    'color-action-primary-fg': ['#ffffff', '#ffffff'],
    'color-button-secondary-bg-hover': ['#f1f1ec', '#40403f'],
  };
  for (const [name, [light, dark]] of Object.entries(references)) {
    assert.equal(data.themes.light[name], light, `${name} light reference drifted`);
    assert.equal(data.themes.dark[name], dark, `${name} dark reference drifted`);
    assert.equal(resolvedThemes.light[name], values[name][0], `${name} light value drifted`);
    assert.equal(resolvedThemes.dark[name], values[name][1], `${name} dark value drifted`);
    assert.equal(data.applicability[name], 'cross-platform');
  }
  for (const theme of ['light', 'dark']) {
    const tokens = resolvedThemes[theme];
    for (const ground of ['color-action-primary-bg', 'color-action-primary-bg-hover']) {
      const ratio = contrast(tokens['color-action-primary-fg'], tokens[ground]);
      assert.ok(ratio >= 4.5, `${theme} primary label on ${ground} is ${ratio.toFixed(2)}:1`);
    }
    assert.notEqual(tokens['color-button-secondary-bg-hover'], tokens['color-button-secondary-bg']);
  }
});

test('v0.7.0 surface roles pin values, references, applicability and their order', () => {
  const references = {
    'color-surface-block': ['{stone-000}', '#ffffff0f'],
    'color-surface-box': ['{stone-000}', '#ffffff17'],
    'color-border-block': ['#ecece9', '#ffffff14'],
    'color-border-box': ['#d0d0c8', '#ffffff24'],
    'color-border-box-focus': ['#bdbdb3', '#ffffff33'],
    'color-border-control': ['#e3e3de', '#ffffff1f'],
    'color-border-overlay': ['#e8e8e3', '#ffffff1a'],
    'shadow-block': ['0 2px 8px #4d4d470d', '{shadow-lift}'],
    'shadow-box': ['0 1px 2px #4d4d470d', '{shadow-lift}'],
    'shadow-overlay': ['0 1px 2px #4d4d470d, 0 8px 24px #4d4d4714', '0 2px 6px #0000003d, 0 12px 32px #00000066'],
  };
  for (const [name, [light, dark]] of Object.entries(references)) {
    assert.equal(data.themes.light[name], light, `${name} light reference drifted`);
    assert.equal(data.themes.dark[name], dark, `${name} dark reference drifted`);
    assert.equal(data.applicability[name], name.startsWith('shadow-') ? 'web-only' : 'cross-platform');
  }
  assert.equal(resolvedThemes.light['color-surface-block'], '#ffffff');
  assert.equal(resolvedThemes.dark['shadow-block'], resolvedThemes.dark['shadow-lift']);
  // The overlay's fill is the existing card surface, so it is not minted.
  assert.equal('color-surface-overlay' in data.themes.dark, false);

  // The box is the one outlined surface, firmer than anything else on the
  // page: rims rise block, overlay, box, box focused, with the control ring
  // between the block's and the box's, in both themes.
  const alpha = (hex) => Number.parseInt(hex.slice(7, 9), 16);
  const order = ['color-border-block', 'color-border-overlay', 'color-border-box', 'color-border-box-focus'];
  const dark = order.map((name) => alpha(resolvedThemes.dark[name]));
  const light = order.map((name) => relativeLuminance(resolvedThemes.light[name]));
  for (let i = 1; i < order.length; i += 1) {
    assert.ok(dark[i] > dark[i - 1], `dark ${order[i]} must be firmer than ${order[i - 1]}`);
    assert.ok(light[i] < light[i - 1], `light ${order[i]} must be firmer than ${order[i - 1]}`);
  }
  const control = { dark: alpha(resolvedThemes.dark['color-border-control']), light: relativeLuminance(resolvedThemes.light['color-border-control']) };
  assert.ok(control.dark > dark[0] && control.dark < dark[2], 'dark control ring sits between block and box');
  assert.ok(control.light < light[0] && control.light > light[2], 'light control ring sits between block and box');
});

test('v0.7.0 roles fold into no existing role (invariant 6)', () => {
  const added = [
    'color-action-primary-bg', 'color-action-primary-bg-hover', 'color-action-primary-fg', 'color-button-secondary-bg-hover',
    'color-surface-block', 'color-surface-box', 'color-border-block', 'color-border-box', 'color-border-box-focus',
    'color-border-control', 'color-border-overlay', 'shadow-block', 'shadow-box', 'shadow-overlay',
  ];
  const pair = (name) => `${resolvedThemes.light[name]} | ${resolvedThemes.dark[name]}`;
  const existing = new Map(
    Object.keys(data.themes.dark).filter((name) => !added.includes(name)).map((name) => [pair(name), name]),
  );
  const seen = new Map();
  for (const name of added) {
    assert.equal(existing.has(pair(name)), false, `${name} resolves like ${existing.get(pair(name))} in both themes`);
    assert.equal(seen.has(pair(name)), false, `${name} resolves like ${seen.get(pair(name))} in both themes`);
    seen.set(pair(name), name);
  }
});

test('rulings recorded at v0.7.0 mint nothing for label-mono or surface alphas and keep motion and z-index', () => {
  const names = Object.keys(data.applicability);
  assert.equal(names.some((name) => name.startsWith('font-label-mono')), false);
  assert.equal(names.some((name) => name.startsWith('surface-alpha') || name.startsWith('color-surface-alpha')), false);
  assert.deepEqual(
    ['speed-quick', 'speed-regular', 'z-header', 'z-overlay', 'z-popover', 'z-dialog', 'z-toast', 'z-tooltip'].map((name) => data.tokens[name]),
    ['0.1s', '0.25s', '100', '500', '600', '700', '800', '1100'],
  );
});

test('font stacks lead with the variable face and keep the metric fallbacks', () => {
  assert.match(data.tokens['font-sans'], /^'Inter Variable', 'Inter', 'Inter Fallback', /);
  assert.match(data.tokens['font-serif'], /^'Literata', 'Literata Fallback', /);
});

test('media blocks are emitted after :root in primitives and compat only', () => {
  const block = '@media (resolution >= 192dpi) {\n  :root {\n    --tt-border-hairline: 0.5px;\n  }\n}\n';
  for (const file of ['dist/css/primitives.css', 'dist/css/tokens.css']) {
    const css = read(file);
    assert.ok(css.includes(block), `${file} lacks the high-density block`);
    assert.ok(css.indexOf(block) > css.indexOf('}'), `${file} must declare the block after the base :root`);
    assert.match(css, /--tt-border-hairline: 1px;/);
  }
  for (const theme of ['light-default', 'dark-default', 'explicit']) {
    assert.doesNotMatch(read(`dist/css/themes/${theme}.css`), /@media|border-hairline/);
  }
  assert.deepEqual(JSON.parse(read('dist/showcase-data.json')).media, {
    'high-density': { query: '(resolution >= 192dpi)', tokens: { 'border-hairline': '0.5px' } },
  });
  const query = '(resolution >= 192dpi)';
  const withMedia = (media) => ({ ...data, media });
  const rejected = {
    'an unknown token': { x: { query, tokens: { 'ghost-token': '1px' } } },
    'a cross-platform token': { x: { query, tokens: { 'radius-4': '2px' } } },
    'a themed token': { x: { query, tokens: { 'color-accent': '#000000' } } },
    'an unchanged value': { x: { query, tokens: { 'border-hairline': '1px' } } },
    'an unlisted query': { x: { query: '(min-width: 800px)', tokens: { 'border-hairline': '0.5px' } } },
    'a repeated query': {
      x: { query, tokens: { 'border-hairline': '0.5px' } },
      y: { query, tokens: { 'focus-ring-width': '1px' } },
    },
  };
  validate(data);
  for (const [description, media] of Object.entries(rejected)) {
    assert.throws(() => validate(withMedia(media)), /token validation failed/, `validate() accepted ${description}`);
  }
});

test('Swift is free of web-only and media tokens; Python carries the base hairline only', () => {
  assert.doesNotMatch(read('dist/swift/GeneratedTokens.swift'), /hairline|borderHairline/);
  const python = read('python/tiptree_ui/_tokens.py');
  assert.match(python, /'border-hairline': '1px'/);
  assert.doesNotMatch(python, /0\.5px/);
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

// v0.7.0 adds no hover ground here: the Button's ring is color-border-control
// (the prototype's --rim-control; decisions A9 re-rules the 3:1 assertion to
// it), pinned by value in "the Button's ring is the control ring". The
// secondary border keeps its 3:1 edge on the surfaces below for the consumers
// that draw it.
test('secondary-control borders retain a 3:1 edge on every published surface', () => {
  for (const theme of ['light', 'dark']) {
    const tokens = resolvedThemes[theme];
    const border = tokens['color-button-secondary-border'];
    const surfaces = new Map([
      ['button', tokens['color-button-secondary-bg']],
      ['primary', tokens['color-bg-primary']],
      ['secondary', tokens['color-bg-secondary']],
      ['tertiary', tokens['color-bg-tertiary']],
      ['card', tokens['color-surface-card']],
      ['code', tokens['color-surface-code']],
    ]);
    for (const [surface, value] of surfaces) {
      assert.ok(
        contrast(border, value) >= 3,
        `${theme} secondary border is ${contrast(border, value).toFixed(2)}:1 against ${surface}`,
      );
    }
  }
});

test("the Button's ring is the control ring, pinned to the prototype's --rim-control", () => {
  assert.equal(data.themes.light['color-border-control'], '#e3e3de');
  assert.equal(data.themes.dark['color-border-control'], '#ffffff1f');
  assert.equal(data.applicability['color-border-control'], 'cross-platform');
  // Not the secondary border: the ring sits on the hover ground too, where a
  // 3:1 stone-550 edge would read 2.48:1 in the dark.
  assert.notEqual(resolvedThemes.dark['color-border-control'], resolvedThemes.dark['color-button-secondary-border']);
});

test('sage ramp stays hub-only (parked proposal, not public contract)', () => {
  assert.equal(Object.keys(data.tokens).filter((key) => key.startsWith('sage-')).length, 0);
});

test('manifest is deterministic and advertises no unadopted components', () => {
  const first = read('dist/manifest.json');
  const staleOutput = join(ROOT, 'dist/css/removed-output.css');
  writeFileSync(staleOutput, 'stale');
  build();
  const second = read('dist/manifest.json');
  assert.equal(second, first);
  assert.equal(existsSync(staleOutput), false);
  const manifest = JSON.parse(first);
  assert.deepEqual(manifest.order, []);
  assert.deepEqual(manifest.components, {});
  assert.equal(existsSync(join(ROOT, 'dist/css/components/button.css')), false);
  assert.equal(existsSync(join(ROOT, 'dist/css/tt.css')), false);
  const exports = JSON.parse(read('package.json')).exports;
  const hasComponents = manifest.order.length > 0;
  assert.equal('./components/*.css' in exports, hasComponents);
  assert.equal('./layered/components/*.css' in exports, hasComponents);
  assert.equal('./tt.css' in exports, false);
  const files = JSON.parse(read('package.json')).files;
  assert.equal(files.includes('specs/'), false);
  assert.equal(existsSync(join(ROOT, 'css')), true);
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
  for (const prefix of ['z-', 'focus-', 'font-', 'shadow-', 'ease-', 'border-']) {
    for (const name of [...required].filter((candidate) => candidate.startsWith(prefix))) {
      assert.equal(data.applicability[name], 'web-only');
    }
  }
});

test('resolver handles arbitrary-depth chains and rejects cycles and unknowns', () => {
  const base = { a: '{b}', b: '{c}', c: '#123456' };
  assert.deepEqual(resolve({ x: '{a}' }, base), { x: '#123456' });
  assert.deepEqual(resolve({ x: '{y}', y: '{a}' }, base), { x: '#123456', y: '#123456' });
  assert.throws(() => resolve({ x: '{y}', y: '{x}' }, base), /circular token reference/);
  assert.throws(() => resolve({ x: '{loop}' }, { loop: '{loop}' }), /circular token reference/);
  assert.throws(() => resolve({ x: '{ghost}' }, {}), /unknown token reference/);
});

test('version parity: packages, tokens, icons, release notes', () => {
  const pkg = JSON.parse(read('package.json')).version;
  const pyproject = read('python/pyproject.toml').match(/^version = "(.+)"$/m)[1];
  const init = read('python/tiptree_ui/__init__.py').match(/__version__ = "(.+)"/)[1];
  const releaseNotes = read('RELEASE_NOTES.md').match(/^# v(.+)$/m)[1];
  const icons = JSON.parse(read('icons/icons.json')).meta.version;
  const versions = { pkg, pyproject, tokens: data.meta.version, icons, init, releaseNotes };
  assert.equal(new Set(Object.values(versions)).size, 1, `version drift: ${JSON.stringify(versions)}`);
});

test('Python and Swift exports contain resolved, classified values', () => {
  const python = read('python/tiptree_ui/_tokens.py');
  const swift = read('dist/swift/GeneratedTokens.swift');
  const packageSwift = read('Sources/TiptreeDesignSystem/GeneratedTokens.swift');
  assert.match(python, /'teal-600': '#47696b'/);
  assert.doesNotMatch(python, /\{brand-/);
  assert.match(swift, /public static let brandTealDarkUIColor/);
  assert.match(swift, /public static let colorStatusSuccessFgUIColor/);
  assert.match(swift, /public static let r4: CGFloat = 4/);
  assert.match(swift, /public static let quick: TimeInterval = 0\.1/);
  assert.doesNotMatch(swift, /fontSans|zModal|easeOutQuad/);
  assert.equal(packageSwift, swift);
});
