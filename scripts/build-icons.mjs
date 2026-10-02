// Zero-dependency icon registry validator and generator. The source is
// icons/icons.json; dist/icons/ and the wheel's assets/icons.* are generated.
// The rules are the normal form and lint of the 0.7.0 icon contract
// (docs/DECISION_LEDGER.md, 2026-10-01): one 24 grid, explicit currentColor or
// none paint, a 1.5 non-scaling line on every stroked shape, no dashes, no
// transforms, nothing that can fetch, script or style.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCES = ['solar', 'solar-modified', 'tiptree'];
const EXTENSION_SOURCES = [...SOURCES, 'third-party-unknown'];
const CUTS = ['linear', 'filled', 'solid'];
// Sanctioned solids, like dots and grip; plus-heavy is New conversation's plus
// with its optical correction drawn in as filled bars (Ivan, decisions 12.25).
const SOLID_ALLOW_LIST = ['grip-dots', 'menu-dots', 'plus-heavy'];
// Solar's upstream leaves the sparkles' width unset on purpose (SVG's 1, a
// thinner line beside the 1.5 one); every other stroked shape sets 1.5.
export const THIN_STROKE_ALLOW_LIST = ['moon-stars', 'stars-minimalistic'];
const STROKE_WIDTH = '1.5';
export const VIEW_BOX = '0 0 24 24';

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SOLAR_ID_RE = /^[a-z0-9-]+-(linear|bold)$/;
const NUMBER_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const D_RE = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]+$/;
const BOUND_MIN = -0.5;
const BOUND_MAX = 24.5;

const GROUP_ATTRIBUTES = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule'];
const LEAF_PAINT = [...GROUP_ATTRIBUTES, 'vector-effect'];
const LEAF_GEOMETRY = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
};
const VALUES = {
  fill: ['currentColor', 'none'],
  stroke: ['currentColor', 'none'],
  'stroke-width': [STROKE_WIDTH],
  'stroke-linecap': ['round', 'butt', 'square'],
  'stroke-linejoin': ['round', 'miter', 'bevel'],
  'fill-rule': ['evenodd', 'nonzero'],
  'clip-rule': ['evenodd', 'nonzero'],
  'vector-effect': ['non-scaling-stroke'],
};
const FORBIDDEN_TEXT = [['#', "'#'"], ["'", 'a single quote'], ['\\', 'a backslash'], ['`', 'a backtick'], ['url(', "'url('"], ['<!', "'<!'"], ['&', "'&'"]];

const TAG_RE = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[^\s=/>]+="[^"]*")*)\s*(\/?)>/y;
const ATTRIBUTE_RE = /\s+([^\s=/>]+)="([^"]*)"/g;

// Parse a body into a flat list of top-level nodes; groups carry children.
// Anything that is not a well-formed tag (text, comments, unquoted
// attributes, unclosed groups) is rejected.
export function parseBody(body) {
  if (typeof body !== 'string' || !body.length) throw new Error('body must be a non-empty string');
  const root = [];
  const stack = [{ children: root }];
  TAG_RE.lastIndex = 0;
  while (TAG_RE.lastIndex < body.length) {
    const start = TAG_RE.lastIndex;
    const match = TAG_RE.exec(body);
    if (!match) throw new Error(`unparseable markup at offset ${start}: ${body.slice(start, start + 24)}`);
    const [, closing, tag, attributeText, selfClosing] = match;
    if (closing) {
      if (selfClosing || attributeText) throw new Error(`malformed closing tag </${tag}>`);
      const open = stack.pop();
      if (stack.length === 0 || open.tag !== tag) throw new Error(`unbalanced </${tag}>`);
      continue;
    }
    const attributes = [];
    for (const [, name, value] of attributeText.matchAll(ATTRIBUTE_RE)) attributes.push([name, value]);
    const node = { tag, attributes, children: [], selfClosing: Boolean(selfClosing) };
    stack.at(-1).children.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`unclosed <${stack.at(-1).tag}>`);
  return root;
}

export function serialiseBody(nodes) {
  const attrs = (node) => node.attributes.map(([name, value]) => ` ${name}="${value}"`).join('');
  const one = (node) =>
    node.selfClosing ? `<${node.tag}${attrs(node)}/>` : `<${node.tag}${attrs(node)}>${node.children.map(one).join('')}</${node.tag}>`;
  return nodes.map(one).join('');
}

export const attribute = (node, name) => node.attributes.find(([key]) => key === name)?.[1];

// Effective paint of a leaf: its own attribute, else its group's.
export function effectivePaint(leaf, group) {
  const pick = (name) => attribute(leaf, name) ?? (group ? attribute(group, name) : undefined);
  return { fill: pick('fill'), stroke: pick('stroke'), strokeWidth: pick('stroke-width') };
}

export const isStroked = (paint) => paint.stroke === 'currentColor';

// Absolute endpoints of a path's segments (control points are not checked).
function pathEndpoints(d) {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) ?? [];
  const arity = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  const points = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let command = null;
  let index = 0;
  while (index < tokens.length) {
    if (/[A-Za-z]/.test(tokens[index])) {
      command = tokens[index];
      index += 1;
      if (command.toUpperCase() === 'Z') {
        x = startX;
        y = startY;
        continue;
      }
    } else if (!command) {
      throw new Error(`path data starts without a command: ${d.slice(0, 24)}`);
    }
    const upper = command.toUpperCase();
    const count = arity[upper];
    if (count === 0) throw new Error('path data has numbers after Z');
    const args = tokens.slice(index, index + count).map(Number);
    if (args.length < count || args.some((value) => Number.isNaN(value))) {
      throw new Error(`path command ${command} is missing arguments`);
    }
    index += count;
    const relative = command !== upper;
    if (upper === 'H') x = relative ? x + args[0] : args[0];
    else if (upper === 'V') y = relative ? y + args[0] : args[0];
    else {
      const [endX, endY] = args.slice(-2);
      x = relative ? x + endX : endX;
      y = relative ? y + endY : endY;
    }
    if (upper === 'M') {
      startX = x;
      startY = y;
      command = relative ? 'l' : 'L';
    }
    points.push([x, y]);
  }
  return points;
}

function leafExtents(leaf) {
  const number = (name) => Number(attribute(leaf, name) ?? 0);
  switch (leaf.tag) {
    case 'path':
      return pathEndpoints(attribute(leaf, 'd'));
    case 'circle':
      return [[number('cx') - number('r'), number('cy') - number('r')], [number('cx') + number('r'), number('cy') + number('r')]];
    case 'ellipse':
      return [[number('cx') - number('rx'), number('cy') - number('ry')], [number('cx') + number('rx'), number('cy') + number('ry')]];
    case 'rect':
      return [[number('x'), number('y')], [number('x') + number('width'), number('y') + number('height')]];
    case 'line':
      return [[number('x1'), number('y1')], [number('x2'), number('y2')]];
    case 'polyline': {
      const values = attribute(leaf, 'points').trim().split(/[\s,]+/).map(Number);
      const pairs = [];
      for (let i = 0; i + 1 < values.length; i += 2) pairs.push([values[i], values[i + 1]]);
      return pairs;
    }
    default:
      return [];
  }
}

// The body lint (normal form plus allow-list). Throws with every problem found.
// allowUnsetWidth is for the glyphs on THIN_STROKE_ALLOW_LIST only.
export function validateBody(body, label = 'body', { allowUnsetWidth = false } = {}) {
  const errors = [];
  for (const [needle, description] of FORBIDDEN_TEXT) {
    if (body.includes(needle)) errors.push(`contains ${description}`);
  }
  let nodes = [];
  try {
    nodes = parseBody(body);
  } catch (error) {
    errors.push(error.message);
  }
  const checkValues = (node, allowed) => {
    for (const [name, value] of node.attributes) {
      if (!allowed.includes(name)) {
        errors.push(`<${node.tag}> has a disallowed attribute ${name}`);
        continue;
      }
      if (name in VALUES && !VALUES[name].includes(value)) {
        errors.push(`<${node.tag}> ${name}="${value}" is not one of ${VALUES[name].join(', ')}`);
      }
    }
    const names = node.attributes.map(([name]) => name);
    if (new Set(names).size !== names.length) errors.push(`<${node.tag}> repeats an attribute`);
  };
  const checkLeaf = (leaf, group) => {
    const geometry = LEAF_GEOMETRY[leaf.tag];
    if (!geometry) {
      errors.push(`<${leaf.tag}> is not an allowed element`);
      return;
    }
    if (!leaf.selfClosing) errors.push(`<${leaf.tag}> must self-close`);
    checkValues(leaf, [...geometry, ...LEAF_PAINT]);
    for (const name of geometry) {
      const value = attribute(leaf, name);
      if (value === undefined) {
        if (!(leaf.tag === 'rect' && (name === 'rx' || name === 'ry'))) errors.push(`<${leaf.tag}> lacks ${name}`);
        continue;
      }
      if (name === 'd') {
        if (!D_RE.test(value)) errors.push('path d has characters outside the path grammar');
      } else if (name === 'points') {
        if (!value.trim().split(/[\s,]+/).every((part) => NUMBER_RE.test(part))) errors.push('polyline points are not numbers');
      } else if (!NUMBER_RE.test(value)) {
        errors.push(`<${leaf.tag}> ${name}="${value}" is not a number`);
      }
    }
    try {
      for (const [x, y] of leafExtents(leaf)) {
        if (!(x >= BOUND_MIN && x <= BOUND_MAX && y >= BOUND_MIN && y <= BOUND_MAX)) {
          errors.push(`<${leaf.tag}> reaches (${x}, ${y}), outside the 24 grid`);
          break;
        }
      }
    } catch (error) {
      errors.push(error.message);
    }
    const paint = effectivePaint(leaf, group);
    const hasEffect = attribute(leaf, 'vector-effect') !== undefined;
    if (paint.fill === undefined) errors.push(`<${leaf.tag}> has no explicit fill`);
    // Every stroke-width written is 1.5 (checked with the attribute values);
    // a stroked shape with none set fails unless the glyph is allow-listed.
    if (isStroked(paint)) {
      if (paint.fill !== 'none') errors.push(`<${leaf.tag}> is both filled and stroked`);
      if (!hasEffect) errors.push(`stroked <${leaf.tag}> lacks vector-effect="non-scaling-stroke"`);
      if (paint.strokeWidth === undefined && !allowUnsetWidth) {
        errors.push(`stroked <${leaf.tag}> has no stroke-width (only ${THIN_STROKE_ALLOW_LIST.join(', ')} may leave it unset)`);
      }
    } else {
      if (paint.fill !== 'currentColor') errors.push(`<${leaf.tag}> is neither filled nor stroked`);
      if (hasEffect) errors.push(`unstroked <${leaf.tag}> carries vector-effect`);
    }
  };
  for (const node of nodes) {
    if (node.tag === 'g') {
      if (node.selfClosing) errors.push('<g> must close');
      checkValues(node, GROUP_ATTRIBUTES);
      if (!node.children.length) errors.push('<g> is empty');
      for (const child of node.children) {
        if (child.tag === 'g') errors.push('nested <g> (at most one level of group)');
        else checkLeaf(child, node);
      }
    } else {
      checkLeaf(node, null);
    }
  }
  if (errors.length) throw new Error(`${label}: ${[...new Set(errors)].join('; ')}`);
}

// Field rules for icons/icons.json (or an app's extension file).
export function validateIcons(data, { tokensVersion, extension = false } = {}) {
  const errors = [];
  const sources = extension ? EXTENSION_SOURCES : SOURCES;
  if (!data || typeof data !== 'object') throw new Error('icon registry must be an object');
  const meta = data.meta ?? {};
  if (!extension) {
    const expectedTop = ['meta', 'aliases', 'glyphs'];
    if (JSON.stringify(Object.keys(data)) !== JSON.stringify(expectedTop)) {
      errors.push(`top-level keys must be ${expectedTop.join(', ')} in that order`);
    }
    if (meta.viewBox !== VIEW_BOX) errors.push(`meta.viewBox must be "${VIEW_BOX}"`);
    if (meta.strokeWidth !== Number(STROKE_WIDTH)) errors.push(`meta.strokeWidth must be ${STROKE_WIDTH}`);
    if (meta.status !== 'provisional') errors.push('meta.status must be "provisional" until the 1.0 conditions hold');
    if (tokensVersion !== undefined && meta.version !== tokensVersion) {
      errors.push(`meta.version ${meta.version} differs from tokens/tokens.json ${tokensVersion}`);
    }
    const upstream = meta.upstream ?? {};
    if (upstream.licence !== 'CC-BY-4.0' || upstream.name !== 'Solar' || upstream.author !== '480 Design') {
      errors.push('meta.upstream must name Solar by 480 Design under CC-BY-4.0');
    }
  }
  const glyphs = data.glyphs ?? {};
  const names = Object.keys(glyphs);
  const sorted = [...names].sort();
  if (names.join(',') !== sorted.join(',')) errors.push('glyph keys must be sorted');
  if (!names.length) errors.push('no glyphs');
  for (const [name, glyph] of Object.entries(glyphs)) {
    const at = `glyphs.${name}`;
    if (!NAME_RE.test(name)) errors.push(`${at}: key is not kebab-case`);
    const order = ['cut', 'source', ...(glyph.solar !== undefined ? ['solar'] : []), 'licence', ...(glyph.modified !== undefined ? ['modified'] : []), 'body'];
    if (JSON.stringify(Object.keys(glyph)) !== JSON.stringify(order)) errors.push(`${at}: fields must be ${order.join(', ')}`);
    if (!CUTS.includes(glyph.cut)) errors.push(`${at}.cut is not one of ${CUTS.join(', ')}`);
    if (name.endsWith('-filled') !== (glyph.cut === 'filled')) errors.push(`${at}: a name ends -filled iff its cut is filled`);
    if (glyph.cut === 'filled') {
      const base = name.replace(/-filled$/, '');
      if (glyphs[base]?.cut !== 'linear') errors.push(`${at}: filled cut needs ${base} with cut linear`);
    }
    if (glyph.cut === 'solid' && !SOLID_ALLOW_LIST.includes(name)) errors.push(`${at}: solid is allowed only for ${SOLID_ALLOW_LIST.join(', ')}`);
    if (!sources.includes(glyph.source)) errors.push(`${at}.source "${glyph.source}" is not one of ${sources.join(', ')}`);
    const isSolar = String(glyph.source).startsWith('solar');
    if (isSolar) {
      if (!SOLAR_ID_RE.test(glyph.solar ?? '')) errors.push(`${at}.solar must be an Iconify Solar id ending -linear or -bold`);
      else if ((glyph.cut === 'linear') !== glyph.solar.endsWith('-linear')) errors.push(`${at}.solar must be -linear for linear and -bold for filled or solid`);
    } else if (glyph.solar !== undefined) {
      errors.push(`${at}.solar is only for Solar sources`);
    }
    const licence = { solar: 'CC-BY-4.0', 'solar-modified': 'CC-BY-4.0', tiptree: 'Apache-2.0', 'third-party-unknown': 'unknown' }[glyph.source];
    if (glyph.licence !== licence) errors.push(`${at}.licence must be ${licence} for source ${glyph.source}`);
    if ((glyph.source === 'solar-modified') !== (typeof glyph.modified === 'string' && glyph.modified.trim().length > 0)) {
      errors.push(`${at}.modified is required for, and only for, solar-modified`);
    }
    try {
      validateBody(glyph.body, at, { allowUnsetWidth: THIN_STROKE_ALLOW_LIST.includes(name) });
    } catch (error) {
      errors.push(error.message);
    }
  }
  const aliases = data.aliases ?? {};
  for (const [oldName, alias] of Object.entries(aliases)) {
    if (oldName in glyphs) errors.push(`aliases.${oldName}: an alias name may not also be a glyph`);
    if (!alias || !(alias.to in glyphs)) errors.push(`aliases.${oldName}.to must name a glyph`);
    if (!/^\d+\.\d+\.\d+$/.test(alias?.since ?? '')) errors.push(`aliases.${oldName}.since must be a release version`);
  }
  if (errors.length) throw new Error(`icon validation failed:\n  ${errors.join('\n  ')}`);
}

export const canonicalJson = (data) => `${JSON.stringify(data, null, 2)}\n`;

const ATTRIBUTION =
  'Solar icons by 480 Design, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); modified by Tiptree Systems where marked in icons.json';

function emitIconModule(data) {
  const glyphLines = Object.entries(data.glyphs).map(
    ([name, glyph]) => `    '${name}': Object.freeze({ cut: '${glyph.cut}', body: '${glyph.body}' }),`,
  );
  const aliasLines = Object.entries(data.aliases).map(
    ([name, alias]) => `    '${name}': Object.freeze({ to: '${alias.to}', since: '${alias.since}' }),`,
  );
  return [
    `/*! @tiptree/design-system v${data.meta.version} icons. GENERATED from icons/icons.json, DO NOT EDIT.`,
    ' * Glyphs from Solar by 480 Design, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/);',
    ' * markup normalised by Tiptree Systems and drawings changed where icons.json says "solar-modified";',
    ' * glyphs marked "tiptree" are Tiptree Systems\' own. @license Apache-2.0 AND CC-BY-4.0 */',
    'export const ICONS = Object.freeze({',
    `  version: '${data.meta.version}',`,
    `  attribution: '${ATTRIBUTION}',`,
    `  viewBox: '${data.meta.viewBox}',`,
    '  glyphs: Object.freeze({',
    ...glyphLines,
    '  }),',
    aliasLines.length ? '  aliases: Object.freeze({' : '  aliases: Object.freeze({}),',
    ...(aliasLines.length ? [...aliasLines, '  }),'] : []),
    '});',
    'export default ICONS;',
    '',
  ].join('\n');
}

// Validate the source, then write the canonical copy, the module and the
// wheel's byte copies. Called by build() after the Python assets are written.
export function buildIcons(root, { tokensVersion } = {}) {
  const sourcePath = join(root, 'icons/icons.json');
  const raw = readFileSync(sourcePath, 'utf8');
  const data = JSON.parse(raw);
  validateIcons(data, { tokensVersion });
  if (raw !== canonicalJson(data)) {
    throw new Error('icons/icons.json is not stored canonically (JSON.stringify(data, null, 2) + newline)');
  }
  const distRoot = join(root, 'dist/icons');
  mkdirSync(distRoot, { recursive: true });
  writeFileSync(join(distRoot, 'icons.json'), raw);
  writeFileSync(join(distRoot, 'icons.js'), emitIconModule(data));
  const assets = join(root, 'python/tiptree_ui/assets');
  mkdirSync(assets, { recursive: true });
  for (const file of ['icons.json', 'icons.js']) copyFileSync(join(distRoot, file), join(assets, file));
  return { glyphs: Object.keys(data.glyphs).length };
}
