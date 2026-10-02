// The published surface of a built release, as names (never values):
// the --tt-* names each CSS block declares, applicability, the Swift
// identifiers, the Python keys, the npm exports/files/licence, the wheel's
// package data and licence files, and the icon names with their cuts.
//
//   node scripts/public-surface.mjs --write [--root <built checkout>]
//
// writes tests/public-surface/v<version>.json for the version of the root
// (default: this repository, after npm run build). A snapshot is frozen once
// its version is tagged; tests/public-surface.test.mjs enforces the rules.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SNAPSHOT_DIR = join(ROOT, 'tests/public-surface');
const CSS_FILES = ['primitives.css', 'themes/light-default.css', 'themes/dark-default.css', 'themes/explicit.css', 'tokens.css'];

// Map each block (selector, prefixed by its @media query when nested) to the
// sorted --tt-* names it declares. Comments are stripped first.
export function cssSurface(css) {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = {};
  const stack = [];
  const pattern = /([^{};]+)\{|\}|(--tt-[a-z0-9-]+)\s*:/g;
  for (const match of body.matchAll(pattern)) {
    if (match[1] !== undefined) stack.push(match[1].trim().replace(/\s+/g, ' '));
    else if (match[0] === '}') stack.pop();
    else {
      const key = stack.join(' ');
      (blocks[key] ??= new Set()).add(match[2]);
    }
  }
  return Object.fromEntries(Object.entries(blocks).sort(([a], [b]) => a.localeCompare(b)).map(([key, names]) => [key, [...names].sort()]));
}

function swiftSurface(swift) {
  const enums = {};
  let current = null;
  for (const line of swift.split('\n')) {
    const open = line.match(/^ {2}public enum (\w+) \{/);
    if (open) current = open[1];
    const member = line.match(/^ {4}public static let (\w+)/);
    if (member && current) (enums[current] ??= []).push(member[1]);
  }
  return Object.fromEntries(Object.entries(enums).map(([name, members]) => [name, members.sort()]));
}

// _tokens.py is generated with two-space indentation per level (see
// pythonLiteral in build-tokens.mjs), so keys are read by their depth.
function pythonSurface(init, tokensPy) {
  const all = init.match(/__all__ = \[([^\]]*)\]/)[1].match(/"([^"]+)"|'([^']+)'/g).map((item) => item.slice(1, -1)).sort();
  const top = [];
  const base = [];
  const themes = {};
  let section = null;
  let theme = null;
  for (const line of tokensPy.split('\n')) {
    const key = line.match(/^( *)(['"])([^'"]+)\2: /);
    if (!key) continue;
    const depth = key[1].length / 2;
    if (depth === 1) {
      section = key[3];
      top.push(section);
    } else if (depth === 2 && section === 'base') base.push(key[3]);
    else if (depth === 2 && section === 'themes') {
      theme = key[3];
      themes[theme] = [];
    } else if (depth === 3 && section === 'themes') themes[theme].push(key[3]);
  }
  return {
    __all__: all,
    TOKENS: top.sort(),
    base: base.sort(),
    themes: Object.fromEntries(Object.keys(themes).sort().map((name) => [name, themes[name].sort()])),
  };
}

function wheelSurface(pyproject) {
  const list = (text) => (text.match(/"([^"]+)"/g) ?? []).map((item) => item.slice(1, -1));
  return {
    'package-data': list(pyproject.match(/^tiptree_ui = \[([^\]]*)\]/m)?.[1] ?? '').sort(),
    'license-files': list(pyproject.match(/^license-files = \[([^\]]*)\]/m)?.[1] ?? '').sort(),
  };
}

export function computeSurface(root = ROOT) {
  const read = (path) => readFileSync(join(root, path), 'utf8');
  const tokens = JSON.parse(read('tokens/tokens.json'));
  const pkg = JSON.parse(read('package.json'));
  const icons = existsSync(join(root, 'icons/icons.json')) ? JSON.parse(read('icons/icons.json')) : { glyphs: {}, aliases: {} };
  return {
    version: tokens.meta.version,
    css: Object.fromEntries(CSS_FILES.map((file) => [file, cssSurface(read(`dist/css/${file}`))])),
    applicability: Object.fromEntries(Object.entries(tokens.applicability).sort(([a], [b]) => a.localeCompare(b))),
    swift: swiftSurface(read('Sources/TiptreeDesignSystem/GeneratedTokens.swift')),
    python: pythonSurface(read('python/tiptree_ui/__init__.py'), read('python/tiptree_ui/_tokens.py')),
    npm: {
      exports: Object.fromEntries(Object.entries(pkg.exports).sort(([a], [b]) => a.localeCompare(b))),
      files: [...pkg.files].sort(),
      license: pkg.license,
    },
    wheel: wheelSurface(read('python/pyproject.toml')),
    icons: {
      glyphs: Object.fromEntries(Object.entries(icons.glyphs).map(([name, glyph]) => [name, glyph.cut]).sort(([a], [b]) => a.localeCompare(b))),
      aliases: icons.aliases ?? {},
    },
  };
}

// Flatten a surface into named entries. Each entry is a name that exists in
// the release; its value (a class, a cut, a target) is compared separately.
export function entries(surface) {
  const out = new Map();
  const add = (key, value = true) => out.set(key, value);
  for (const [file, blocks] of Object.entries(surface.css)) {
    for (const [block, names] of Object.entries(blocks)) for (const name of names) add(`css ${file} ${block} ${name}`);
  }
  for (const [name, applicability] of Object.entries(surface.applicability)) add(`applicability ${name}`, applicability);
  for (const [group, members] of Object.entries(surface.swift)) for (const member of members) add(`swift ${group} ${member}`);
  for (const name of surface.python.__all__) add(`python __all__ ${name}`);
  for (const name of surface.python.TOKENS) add(`python TOKENS ${name}`);
  for (const name of surface.python.base) add(`python base ${name}`);
  for (const [theme, names] of Object.entries(surface.python.themes)) for (const name of names) add(`python themes ${theme} ${name}`);
  for (const [name, target] of Object.entries(surface.npm.exports)) add(`npm exports ${name}`, target);
  for (const name of surface.npm.files) add(`npm files ${name}`);
  add('npm license', surface.npm.license);
  for (const [field, patterns] of Object.entries(surface.wheel)) for (const pattern of patterns) add(`wheel ${field} ${pattern}`);
  for (const [name, cut] of Object.entries(surface.icons.glyphs)) add(`icons glyph ${name}`, cut);
  for (const [name, alias] of Object.entries(surface.icons.aliases)) add(`icons alias ${name}`, alias.to);
  return out;
}

export function diff(before, after) {
  const a = entries(before);
  const b = entries(after);
  return {
    added: [...b.keys()].filter((key) => !a.has(key)),
    removed: [...a.keys()].filter((key) => !b.has(key)),
    changed: [...b.keys()].filter((key) => a.has(key) && JSON.stringify(a.get(key)) !== JSON.stringify(b.get(key))),
  };
}

// Semantic-version order, a pre-release before its release.
export function compareVersions(a, b) {
  const parse = (version) => {
    const [main, pre] = version.split('-');
    return { main: main.split('.').map(Number), pre: pre ? pre.split('.') : [] };
  };
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < 3; i += 1) if (left.main[i] !== right.main[i]) return left.main[i] - right.main[i];
  if (!left.pre.length || !right.pre.length) return right.pre.length - left.pre.length;
  for (let i = 0; i < Math.max(left.pre.length, right.pre.length); i += 1) {
    const [x, y] = [left.pre[i], right.pre[i]];
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
    if (x !== y) return /^\d+$/.test(x) && /^\d+$/.test(y) ? Number(x) - Number(y) : x.localeCompare(y);
  }
  return 0;
}

export const serialise = (surface) => `${JSON.stringify(surface, null, 2)}\n`;
export const snapshotPath = (version) => join(SNAPSHOT_DIR, `v${version}.json`);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  const root = rootIndex === -1 ? ROOT : args[rootIndex + 1];
  const surface = computeSurface(root);
  if (!args.includes('--write')) {
    process.stdout.write(serialise(surface));
  } else {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    writeFileSync(snapshotPath(surface.version), serialise(surface));
    console.log(`wrote tests/public-surface/v${surface.version}.json`);
  }
}
