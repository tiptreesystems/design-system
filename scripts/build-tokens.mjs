// Token generator — zero-dependency by design (swappable for Style Dictionary
// later without changing tokens.json). Reads tokens/tokens.json, validates,
// and emits every consumer format. Run: node scripts/build-tokens.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = '--tt-';
const REF_RE = /\{([a-z0-9-]+)\}/g;

export function loadSource() {
  const raw = readFileSync(join(ROOT, 'tokens/tokens.json'), 'utf8');
  const data = JSON.parse(raw);
  // JSON.parse silently drops duplicate keys (the docs-new --stone-150 bug).
  // Detect them by comparing raw-text occurrence counts against the parsed
  // structure: a key duplicated inside one object appears in the text more
  // often than the parse can account for. (The same name in dark AND light is
  // legitimate — it is counted once per object that contains it.)
  const expected = new Map();
  for (const obj of [data, data.meta ?? {}, data.tokens ?? {}, data.themes ?? {}, ...Object.values(data.themes ?? {})]) {
    for (const k of Object.keys(obj)) expected.set(k, (expected.get(k) ?? 0) + 1);
  }
  const actual = new Map();
  for (const m of raw.matchAll(/"([a-zA-Z0-9_-]+)"\s*:/g)) actual.set(m[1], (actual.get(m[1]) ?? 0) + 1);
  const dupes = [...actual].filter(([k, n]) => n > (expected.get(k) ?? 0)).map(([k]) => k);
  if (dupes.length) throw new Error(`duplicate token key(s) in source: ${dupes.join(', ')}`);
  return { raw, data };
}

export function validate(data) {
  const errors = [];
  const base = data.tokens;
  const checkRefs = (map, scope) => {
    for (const [name, value] of Object.entries(map)) {
      for (const m of String(value).matchAll(REF_RE)) {
        if (!(m[1] in base)) errors.push(`${scope}.${name} references unknown token {${m[1]}}`);
      }
      if (/^#/.test(value) && !/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        errors.push(`${scope}.${name} has malformed hex: ${value}`);
      }
      // Missing-# heuristic: 6/8 hex chars, or 3 hex chars containing a letter
      // (pure 3-digit numbers are z-index values, not colors).
      if (/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) || (/^[0-9a-f]{3}$/i.test(value) && /[a-f]/i.test(value))) {
        errors.push(`${scope}.${name} looks like a hex color missing its '#': ${value}`);
      }
    }
  };
  checkRefs(base, 'tokens');
  for (const [theme, map] of Object.entries(data.themes)) checkRefs(map, `themes.${theme}`);
  // Theme parity: light and dark must define the same semantic set.
  const dark = Object.keys(data.themes.dark).sort().join(',');
  const light = Object.keys(data.themes.light).sort().join(',');
  if (dark !== light) errors.push('themes.dark and themes.light define different token sets');
  if (errors.length) throw new Error('token validation failed:\n  ' + errors.join('\n  '));
}

const cssVal = (v) => String(v).replace(REF_RE, (_, name) => `var(${PREFIX}${name})`);
const cssLines = (map, indent = '  ') =>
  Object.entries(map).map(([k, v]) => `${indent}${PREFIX}${k}: ${cssVal(v)};`).join('\n');

export function resolve(map, base) {
  const resolveValue = (value, seen) =>
    String(value).replace(REF_RE, (_, name) => {
      if (seen.has(name)) throw new Error(`circular token reference: ${[...seen, name].join(' -> ')}`);
      if (!(name in base)) throw new Error(`unknown token reference {${name}}`);
      return resolveValue(base[name], new Set(seen).add(name));
    });
  const out = {};
  for (const [k, v] of Object.entries(map)) out[k] = resolveValue(v, new Set());
  return out;
}

export function build() {
  const { data } = loadSource();
  validate(data);
  mkdirSync(join(ROOT, 'dist/css'), { recursive: true });
  mkdirSync(join(ROOT, 'dist/tailwind'), { recursive: true });
  mkdirSync(join(ROOT, 'python/tiptree_ui/assets'), { recursive: true });

  const header = `/* GENERATED from tokens/tokens.json v${data.meta.version} — DO NOT EDIT. */\n`;
  const tokensCss =
    `${header}:root {\n  color-scheme: dark;\n${cssLines(data.tokens)}\n\n${cssLines(data.themes.dark)}\n}\n\n` +
    `[data-theme='light'] {\n  color-scheme: light;\n${cssLines(data.themes.light)}\n}\n`;
  writeFileSync(join(ROOT, 'dist/css/tokens.css'), tokensCss);

  // tt.css passes through with the no-raw-values lint applied.
  const tt = readFileSync(join(ROOT, 'css/tt.css'), 'utf8');
  const rawHex = [...tt.matchAll(/#[0-9a-f]{3,8}\b/gi)];
  if (rawHex.length) throw new Error(`raw hex in css/tt.css (use var(${PREFIX}*)): ${rawHex.map((m) => m[0]).join(', ')}`);
  writeFileSync(join(ROOT, 'dist/css/tt.css'), header + tt);

  // Tailwind v4 @theme adapter (consumed by the platform console if kept).
  const tw = Object.keys(data.themes.dark)
    .filter((k) => k.startsWith('color-'))
    .map((k) => `  --${k.replace(/^color-/, 'color-tt-')}: var(${PREFIX}${k});`)
    .join('\n');
  writeFileSync(join(ROOT, 'dist/tailwind/theme.css'), `${header}@theme inline {\n${tw}\n}\n`);

  // Python: brand/theme-resolved values (concrete hex — media pipelines can't var()).
  const resolved = {
    base: resolve(data.tokens, data.tokens),
    themes: { dark: resolve(data.themes.dark, data.tokens), light: resolve(data.themes.light, data.tokens) },
  };
  // Defense in depth: no unresolved reference may ever reach an export.
  const leaked = JSON.stringify(resolved).match(/\{[a-z0-9-]+\}/g);
  if (leaked) throw new Error(`unresolved token references in resolved output: ${[...new Set(leaked)].join(', ')}`);
  // Python literal serializer: naive JSON->single-quote swapping corrupts
  // values that contain apostrophes (font stacks: 'Inter', 'SF Pro Display').
  const pyStr = (s) => (s.includes("'") ? `"${s.replace(/"/g, '\\"')}"` : `'${s}'`);
  const toPy = (v, depth = 0) => {
    if (typeof v === 'string') return pyStr(v);
    const pad = '  '.repeat(depth);
    const entries = Object.entries(v)
      .map(([k, val]) => `${pad}  ${pyStr(k)}: ${toPy(val, depth + 1)},`)
      .join('\n');
    return `{\n${entries}\n${pad}}`;
  };
  const py =
    `# GENERATED from tokens/tokens.json v${data.meta.version} - DO NOT EDIT.\n` +
    `TOKENS = ${toPy(resolved)}\n\n\n` +
    `def for_brand(brand='tiptree', theme='light'):\n` +
    `    """Resolved token map for a brand/theme. Sub-brand themes land here\n` +
    `    once themes/*.css exist; until then only 'tiptree' is defined."""\n` +
    `    if brand != 'tiptree':\n` +
    `        raise KeyError(f'unknown brand: {brand} (sub-brand themes not yet defined)')\n` +
    `    return {**TOKENS['base'], **TOKENS['themes'][theme]}\n`;
  writeFileSync(join(ROOT, 'python/tiptree_ui/_tokens.py'), py);

  // Wheel package data + showcase data.
  copyFileSync(join(ROOT, 'dist/css/tokens.css'), join(ROOT, 'python/tiptree_ui/assets/tokens.css'));
  copyFileSync(join(ROOT, 'dist/css/tt.css'), join(ROOT, 'python/tiptree_ui/assets/tt.css'));
  writeFileSync(join(ROOT, 'dist/showcase-data.json'), JSON.stringify({ version: data.meta.version, ...resolved }, null, 2));

  return { tokens: Object.keys(data.tokens).length, semantic: Object.keys(data.themes.dark).length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const n = build();
  console.log(`built: ${n.tokens} base tokens, ${n.semantic} semantic tokens x2 themes -> dist/, python/tiptree_ui/`);
}
