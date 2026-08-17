// Zero-dependency token/theme generator with optional graduated components.
// Source files are tokens/tokens.json and any css/components/**/*.css; every
// file under dist/ and Python package assets is generated.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { brotliCompressSync, constants as zlibConstants } from 'node:zlib';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = '--tt-';
const REF_RE = /\{([a-z0-9-]+)\}/g;
const THEMES = ['light-default', 'dark-default', 'explicit'];
const BARE_ELEMENTS = [
  'a', 'body', 'button', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'html', 'input', 'label', 'select', 'textarea',
];

const slash = (value) => value.split(sep).join('/');
const ensureTrailingNewline = (value) => `${value.trimEnd()}\n`;
const header = (version) => `/* GENERATED from Tiptree design-system v${version} — DO NOT EDIT. */\n`;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const brotliBytes = (value) =>
  brotliCompressSync(Buffer.from(value), {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;

function collectExpectedKeys(value, counts = new Map()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return counts;
  for (const [key, child] of Object.entries(value)) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    collectExpectedKeys(child, counts);
  }
  return counts;
}

export function loadSource() {
  const raw = readFileSync(join(ROOT, 'tokens/tokens.json'), 'utf8');
  const data = JSON.parse(raw);
  // JSON.parse silently drops duplicate keys. Compare raw key occurrences with
  // the recursively parsed structure so duplicates in any source object fail.
  const expected = collectExpectedKeys(data);
  const actual = new Map();
  for (const match of raw.matchAll(/"([a-zA-Z0-9_-]+)"\s*:/g)) {
    actual.set(match[1], (actual.get(match[1]) ?? 0) + 1);
  }
  const duplicates = [...actual]
    .filter(([key, count]) => count > (expected.get(key) ?? 0))
    .map(([key]) => key);
  if (duplicates.length) throw new Error(`duplicate token key(s) in source: ${duplicates.join(', ')}`);
  return { raw, data };
}

export function validate(data) {
  const errors = [];
  const base = data.tokens ?? {};
  const themes = data.themes ?? {};
  const applicability = data.applicability ?? {};
  const checkRefs = (map, scope) => {
    for (const [name, value] of Object.entries(map)) {
      for (const match of String(value).matchAll(REF_RE)) {
        if (!(match[1] in base)) errors.push(`${scope}.${name} references unknown token {${match[1]}}`);
      }
      if (/^#/.test(value) && !/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        errors.push(`${scope}.${name} has malformed hex: ${value}`);
      }
      if (/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) || (/^[0-9a-f]{3}$/i.test(value) && /[a-f]/i.test(value))) {
        errors.push(`${scope}.${name} looks like a hex color missing its '#': ${value}`);
      }
    }
  };
  checkRefs(base, 'tokens');
  for (const [theme, map] of Object.entries(themes)) checkRefs(map, `themes.${theme}`);

  const darkNames = Object.keys(themes.dark ?? {}).sort();
  const lightNames = Object.keys(themes.light ?? {}).sort();
  if (darkNames.join(',') !== lightNames.join(',')) {
    errors.push('themes.dark and themes.light define different token sets');
  }

  const requiredApplicability = [...new Set([...Object.keys(base), ...darkNames, ...lightNames])].sort();
  const allowedApplicability = new Set(['cross-platform', 'web-only']);
  for (const name of requiredApplicability) {
    if (!(name in applicability)) errors.push(`applicability missing token: ${name}`);
    else if (!allowedApplicability.has(applicability[name])) {
      errors.push(`applicability.${name} has invalid value: ${applicability[name]}`);
    }
  }
  for (const name of Object.keys(applicability)) {
    if (!requiredApplicability.includes(name)) errors.push(`applicability contains unknown token: ${name}`);
  }
  if (errors.length) throw new Error(`token validation failed:\n  ${errors.join('\n  ')}`);
}

const cssValue = (value) => String(value).replace(REF_RE, (_, name) => `var(${PREFIX}${name})`);
const cssLines = (map, indent = '  ') =>
  Object.entries(map).map(([name, value]) => `${indent}${PREFIX}${name}: ${cssValue(value)};`).join('\n');
const cssBlock = (selector, map, colorScheme) =>
  `${selector} {\n${colorScheme ? `  color-scheme: ${colorScheme};\n` : ''}${cssLines(map)}\n}\n`;

export function resolve(map, base) {
  const resolveValue = (value, seen) =>
    String(value).replace(REF_RE, (_, name) => {
      if (seen.has(name)) throw new Error(`circular token reference: ${[...seen, name].join(' -> ')}`);
      if (!(name in base)) throw new Error(`unknown token reference {${name}}`);
      return resolveValue(base[name], new Set(seen).add(name));
    });
  return Object.fromEntries(
    Object.entries(map).map(([name, value]) => [name, resolveValue(value, new Set())]),
  );
}

function discoverCssFiles(directory) {
  const output = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && entry.name.endsWith('.css')) output.push(path);
    }
  };
  walk(directory);
  return output.sort((a, b) => slash(relative(directory, a)).localeCompare(slash(relative(directory, b))));
}

function lintComponentCss(path, css) {
  const displayPath = slash(relative(ROOT, path));
  const rawHex = [...css.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0]);
  if (rawHex.length) {
    throw new Error(`raw hex in ${displayPath} (use var(${PREFIX}*)): ${rawHex.join(', ')}`);
  }
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const barePattern = new RegExp(
    `(^|[\\s>+~,(])(?:${BARE_ELEMENTS.join('|')})(?=$|[\\s>+~.#:\\[\\],)])`,
    'i',
  );
  for (const match of body.matchAll(/(^|})\s*([^@{}][^{}]*)\{/g)) {
    const selectorList = match[2].trim();
    for (const selector of selectorList.split(',')) {
      if (barePattern.test(selector.trim())) {
        throw new Error(`bare-element selector in ${displayPath}: ${selector.trim()}`);
      }
    }
  }
}

function indentCss(css) {
  return css.trimEnd().split('\n').map((line) => `  ${line}`).join('\n');
}

function swiftIdentifier(name) {
  return name.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
}

function parseHex(value, name) {
  const match = String(value).match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (!match) throw new Error(`Swift color token ${name} did not resolve to #RRGGBB or #RRGGBBAA: ${value}`);
  const rgb = match[1];
  return {
    red: Number.parseInt(rgb.slice(0, 2), 16),
    green: Number.parseInt(rgb.slice(2, 4), 16),
    blue: Number.parseInt(rgb.slice(4, 6), 16),
    alpha: match[2] ? Number.parseInt(match[2], 16) : 255,
  };
}

const swiftUIColor = (value, name) => {
  const color = parseHex(value, name);
  return `UIColor(red: ${color.red}.0 / 255.0, green: ${color.green}.0 / 255.0, blue: ${color.blue}.0 / 255.0, alpha: ${color.alpha}.0 / 255.0)`;
};

function emitSwift(data, resolved) {
  const applicability = data.applicability;
  const isColor = (name) =>
    name.startsWith('brand-') || name.startsWith('color-') || /^(stone|teal|citron)-\d+$/.test(name);
  const lines = [
    '// GENERATED from tokens/tokens.json — DO NOT EDIT.',
    `// Design-system version ${data.meta.version}.`,
    'import SwiftUI',
    'import UIKit',
    '',
    'public enum TiptreeTokens {',
    '  public enum Colors {',
  ];

  const baseCrossPlatform = Object.keys(data.tokens).filter((name) => applicability[name] === 'cross-platform');
  const semanticCrossPlatform = Object.keys(data.themes.dark).filter(
    (name) => applicability[name] === 'cross-platform',
  );
  for (const name of baseCrossPlatform.filter(isColor)) {
    const identifier = swiftIdentifier(name);
    const value = resolved.base[name];
    lines.push(`    // ${name}: ${value}`);
    lines.push(`    public static let ${identifier}UIColor = ${swiftUIColor(value, name)}`);
    lines.push(`    public static let ${identifier} = Color(uiColor: ${identifier}UIColor)`);
  }
  for (const name of semanticCrossPlatform.filter(isColor)) {
    const identifier = swiftIdentifier(name);
    const light = resolved.themes.light[name];
    const dark = resolved.themes.dark[name];
    lines.push(`    // ${name}: light ${light}, dark ${dark}`);
    lines.push(`    public static let ${identifier}UIColor = UIColor { traits in`);
    lines.push(`      traits.userInterfaceStyle == .dark ? ${swiftUIColor(dark, name)} : ${swiftUIColor(light, name)}`);
    lines.push('    }');
    lines.push(`    public static let ${identifier} = Color(uiColor: ${identifier}UIColor)`);
  }
  lines.push('  }', '', '  public enum Radius {');
  for (const name of baseCrossPlatform.filter((candidate) => candidate.startsWith('radius-'))) {
    const value = resolved.base[name];
    const match = value.match(/^([0-9]+(?:\.[0-9]+)?)px$/);
    if (!match) throw new Error(`Swift radius token ${name} is not a px value: ${value}`);
    const suffix = swiftIdentifier(name.replace(/^radius-/, ''));
    const identifier = /^\d/.test(suffix) ? `r${suffix}` : suffix;
    lines.push(`    // ${name}: ${value}`);
    lines.push(`    public static let ${identifier}: CGFloat = ${match[1]}`);
  }
  lines.push('  }', '', '  public enum Duration {');
  for (const name of baseCrossPlatform.filter((candidate) => candidate.startsWith('speed-'))) {
    const value = resolved.base[name];
    const match = value.match(/^([0-9]+(?:\.[0-9]+)?)s$/);
    if (!match) throw new Error(`Swift duration token ${name} is not a seconds value: ${value}`);
    lines.push(`    // ${name}: ${value}`);
    lines.push(`    public static let ${swiftIdentifier(name.replace(/^speed-/, ''))}: TimeInterval = ${match[1]}`);
  }
  lines.push('  }', '}');

  const handled = new Set([
    ...baseCrossPlatform.filter(isColor),
    ...semanticCrossPlatform.filter(isColor),
    ...baseCrossPlatform.filter((name) => name.startsWith('radius-') || name.startsWith('speed-')),
  ]);
  const unhandled = [...baseCrossPlatform, ...semanticCrossPlatform].filter((name) => !handled.has(name));
  if (unhandled.length) throw new Error(`cross-platform token(s) lack Swift type mapping: ${unhandled.join(', ')}`);
  return `${lines.join('\n')}\n`;
}

function pythonLiteral(value, depth = 0) {
  const pyString = (input) => (input.includes("'") ? `"${input.replace(/"/g, '\\"')}"` : `'${input}'`);
  if (typeof value === 'string') return pyString(value);
  const pad = '  '.repeat(depth);
  const entries = Object.entries(value)
    .map(([key, child]) => `${pad}  ${pyString(key)}: ${pythonLiteral(child, depth + 1)},`)
    .join('\n');
  return `{\n${entries}\n${pad}}`;
}

export function build() {
  const { data } = loadSource();
  validate(data);

  const componentSourceRoot = join(ROOT, 'css/components');
  const componentPaths = existsSync(componentSourceRoot)
    ? discoverCssFiles(componentSourceRoot)
    : [];

  const generatedRoots = [
    join(ROOT, 'dist/css'),
    join(ROOT, 'dist/swift'),
    join(ROOT, 'python/tiptree_ui/assets'),
  ];
  // Removed from the public package in v0.2.0. Delete any pre-v0.2.0 output so
  // a local build cannot leave a misleading Tailwind artifact behind.
  rmSync(join(ROOT, 'dist/tailwind'), { recursive: true, force: true });
  for (const path of generatedRoots) rmSync(path, { recursive: true, force: true });
  for (const path of generatedRoots) mkdirSync(path, { recursive: true });
  for (const path of [
    join(ROOT, 'dist/css/components'),
    join(ROOT, 'dist/css/layered'),
    join(ROOT, 'dist/css/themes'),
  ]) mkdirSync(path, { recursive: true });

  const generatedHeader = header(data.meta.version);
  const primitivesBody = cssBlock(':root', data.tokens);
  const lightDefaultBody =
    `${cssBlock(':root', data.themes.light, 'only light')}\n${cssBlock("[data-theme='dark']", data.themes.dark, 'dark')}`;
  const darkDefaultBody =
    `${cssBlock(':root', data.themes.dark, 'dark')}\n${cssBlock("[data-theme='light']", data.themes.light, 'only light')}`;
  const explicitBody =
    `${cssBlock("[data-theme='light']", data.themes.light, 'only light')}\n${cssBlock("[data-theme='dark']", data.themes.dark, 'dark')}`;
  const themeBodies = {
    'light-default': lightDefaultBody,
    'dark-default': darkDefaultBody,
    explicit: explicitBody,
  };

  writeFileSync(join(ROOT, 'dist/css/primitives.css'), generatedHeader + primitivesBody);
  for (const theme of THEMES) {
    writeFileSync(join(ROOT, `dist/css/themes/${theme}.css`), generatedHeader + themeBodies[theme]);
  }
  writeFileSync(
    join(ROOT, 'dist/css/tokens.css'),
    generatedHeader + primitivesBody + '\n' + darkDefaultBody,
  );

  const order = [];
  const components = {};
  for (const sourcePath of componentPaths) {
    const relativePath = slash(relative(componentSourceRoot, sourcePath));
    const name = relativePath.replace(/\.css$/, '');
    const source = ensureTrailingNewline(readFileSync(sourcePath, 'utf8'));
    lintComponentCss(sourcePath, source);
    const unlayered = generatedHeader + source;
    const layered = `${generatedHeader}@layer tt {\n${indentCss(source)}\n}\n`;
    const unlayeredPath = join(ROOT, 'dist/css/components', relativePath);
    const layeredPath = join(ROOT, 'dist/css/layered/components', relativePath);
    mkdirSync(dirname(unlayeredPath), { recursive: true });
    mkdirSync(dirname(layeredPath), { recursive: true });
    writeFileSync(unlayeredPath, unlayered);
    writeFileSync(layeredPath, layered);
    order.push(name);
    components[name] = {
      file: `components/${relativePath}`,
      bytes: Buffer.byteLength(unlayered),
      brotli: brotliBytes(unlayered),
      sha256: sha256(unlayered),
    };
  }
  const manifest = { version: data.meta.version, order, components };
  writeFileSync(join(ROOT, 'dist/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const resolved = {
    base: resolve(data.tokens, data.tokens),
    themes: {
      dark: resolve(data.themes.dark, data.tokens),
      light: resolve(data.themes.light, data.tokens),
    },
  };
  const leaked = JSON.stringify(resolved).match(/\{[a-z0-9-]+\}/g);
  if (leaked) throw new Error(`unresolved token references in resolved output: ${[...new Set(leaked)].join(', ')}`);

  const python =
    `# GENERATED from tokens/tokens.json v${data.meta.version} - DO NOT EDIT.\n` +
    `TOKENS = ${pythonLiteral(resolved)}\n\n\n` +
    `def for_brand(brand='tiptree', theme='light'):\n` +
    `    \"\"\"Return a resolved token map for the selected brand and theme.\"\"\"\n` +
    `    if brand != 'tiptree':\n` +
    `        raise KeyError(f'unknown brand: {brand} (sub-brand themes not yet defined)')\n` +
    `    if theme not in TOKENS['themes']:\n` +
    `        raise KeyError(f'unknown theme: {theme}')\n` +
    `    return {**TOKENS['base'], **TOKENS['themes'][theme]}\n`;
  writeFileSync(join(ROOT, 'python/tiptree_ui/_tokens.py'), python);
  writeFileSync(join(ROOT, 'dist/swift/GeneratedTokens.swift'), emitSwift(data, resolved));
  writeFileSync(
    join(ROOT, 'dist/showcase-data.json'),
    `${JSON.stringify({ version: data.meta.version, ...resolved }, null, 2)}\n`,
  );

  const pythonAssets = join(ROOT, 'python/tiptree_ui/assets');
  for (const file of ['primitives.css', 'tokens.css']) {
    copyFileSync(join(ROOT, 'dist/css', file), join(pythonAssets, file));
  }
  for (const theme of THEMES) {
    mkdirSync(join(pythonAssets, 'themes'), { recursive: true });
    copyFileSync(
      join(ROOT, `dist/css/themes/${theme}.css`),
      join(pythonAssets, `themes/${theme}.css`),
    );
  }
  for (const component of order) {
    const file = components[component].file;
    const destination = join(pythonAssets, file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(ROOT, 'dist/css', file), destination);
  }
  copyFileSync(join(ROOT, 'dist/manifest.json'), join(pythonAssets, 'manifest.json'));

  return {
    tokens: Object.keys(data.tokens).length,
    semantic: Object.keys(data.themes.dark).length,
    components: order.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = build();
  console.log(
    `built: ${result.tokens} base tokens, ${result.semantic} semantic tokens x2 themes, ` +
      `${result.components} component(s) -> dist/, python/tiptree_ui/`,
  );
}
