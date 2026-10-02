// Import one glyph into the icon registry's normal form (zero dependencies).
//
//   node scripts/icon-body.mjs <iconify-id> [--cut linear|filled|solid] [--modified "<what changed>"] [file]
//   node scripts/icon-body.mjs --tiptree [file]
//   node scripts/icon-body.mjs --source third-party-unknown [file]      (app extension files only)
//
// Reads an SVG (as https://api.iconify.design/solar/<id>.svg serves it) or a
// bare body from the file or stdin, and prints the registry entry. The only
// changes made: the <svg> wrapper (xmlns, width, height, viewBox) is dropped,
// vector-effect="non-scaling-stroke" is added to every stroked shape, a dashed
// circle is expanded to the dashes that show, and a circle's rotation about
// its own centre is dropped. Everything else is kept byte for byte, and the
// result must pass the body lint in scripts/build-icons.mjs. Fetch from
// Iconify one request per second and honour retry-after on a 429.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  attribute,
  effectivePaint,
  isStroked,
  parseBody,
  serialiseBody,
  THIN_STROKE_ALLOW_LIST,
  validateBody,
  VIEW_BOX,
} from './build-icons.mjs';

const round = (value) => {
  const text = Number(value.toFixed(3)).toString();
  return text === '-0' ? '0' : text;
};

function stripWrapper(svg) {
  const text = svg.trim();
  if (!text.startsWith('<svg')) return text;
  const open = text.match(/^<svg\b[^>]*>/);
  if (!open || !text.endsWith('</svg>')) throw new Error('unrecognised <svg> wrapper');
  const viewBox = open[0].match(/\sviewBox="([^"]*)"/)?.[1];
  if (viewBox !== undefined && viewBox !== VIEW_BOX) throw new Error(`viewBox is "${viewBox}", not "${VIEW_BOX}"`);
  return text.slice(open[0].length, -'</svg>'.length);
}

// Sample a path's centreline (M, L, H, V, C, Z in either case).
function samplePath(d) {
  const tokens = d.match(/[MmLlHhVvCcZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) ?? [];
  if (/[SsQqTtAa]/.test(d)) throw new Error('dash expansion supports M, L, H, V, C and Z paths only');
  const samples = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let command = null;
  let index = 0;
  const line = (toX, toY) => {
    for (let step = 0; step <= 64; step += 1) samples.push([x + ((toX - x) * step) / 64, y + ((toY - y) * step) / 64]);
    x = toX;
    y = toY;
  };
  while (index < tokens.length) {
    if (/[A-Za-z]/.test(tokens[index])) {
      command = tokens[index];
      index += 1;
      if (command === 'Z' || command === 'z') line(startX, startY);
      continue;
    }
    const relative = command === command.toLowerCase();
    const take = (count) => tokens.slice(index, (index += count)).map(Number);
    switch (command.toUpperCase()) {
      case 'M': {
        const [mx, my] = take(2);
        x = relative ? x + mx : mx;
        y = relative ? y + my : my;
        startX = x;
        startY = y;
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L': {
        const [lx, ly] = take(2);
        line(relative ? x + lx : lx, relative ? y + ly : ly);
        break;
      }
      case 'H': {
        const [hx] = take(1);
        line(relative ? x + hx : hx, y);
        break;
      }
      case 'V': {
        const [vy] = take(1);
        line(x, relative ? y + vy : vy);
        break;
      }
      case 'C': {
        const values = take(6);
        const [x1, y1, x2, y2, ex, ey] = relative
          ? values.map((value, i) => value + (i % 2 ? y : x))
          : values;
        for (let step = 0; step <= 64; step += 1) {
          const t = step / 64;
          const u = 1 - t;
          samples.push([
            u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
            u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
          ]);
        }
        x = ex;
        y = ey;
        break;
      }
      default:
        throw new Error(`unsupported path command ${command}`);
    }
  }
  return samples;
}

function centreline(leaf) {
  const n = (name) => Number(attribute(leaf, name));
  if (leaf.tag === 'path') return samplePath(attribute(leaf, 'd'));
  if (leaf.tag === 'circle' || leaf.tag === 'ellipse') {
    const rx = leaf.tag === 'circle' ? n('r') : n('rx');
    const ry = leaf.tag === 'circle' ? n('r') : n('ry');
    return Array.from({ length: 721 }, (_, i) => [n('cx') + rx * Math.cos((i * Math.PI) / 360), n('cy') + ry * Math.sin((i * Math.PI) / 360)]);
  }
  if (leaf.tag === 'line') return samplePath(`M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`);
  throw new Error(`cannot trace <${leaf.tag}> for dash expansion`);
}

// A dashed circle becomes straight segments at the dashes' user-space
// positions; dashes lying wholly on another stroked shape (within half the
// line) are dropped, so only the dashes that show remain.
function expandDashedCircle(leaf, others) {
  if (leaf.tag !== 'circle') throw new Error(`stroke-dasharray on <${leaf.tag}> cannot be expanded; only a dashed circle can`);
  if (attribute(leaf, 'stroke-dashoffset') !== undefined) throw new Error('stroke-dashoffset is not supported');
  const cx = Number(attribute(leaf, 'cx'));
  const cy = Number(attribute(leaf, 'cy'));
  const r = Number(attribute(leaf, 'r'));
  let pattern = attribute(leaf, 'stroke-dasharray').trim().split(/[\s,]+/).map(Number);
  if (pattern.some((value) => !(value >= 0)) || pattern.every((value) => value === 0)) throw new Error('invalid stroke-dasharray');
  if (pattern.length % 2) pattern = [...pattern, ...pattern];
  const circumference = 2 * Math.PI * r;
  const at = (length) => [cx + r * Math.cos(length / r), cy + r * Math.sin(length / r)];
  const covered = others.flatMap(centreline);
  const near = ([px, py]) => covered.some(([qx, qy]) => Math.hypot(px - qx, py - qy) <= 0.75);
  const segments = [];
  for (let start = 0, i = 0; start < circumference; i += 2) {
    const dash = pattern[i % pattern.length];
    const gap = pattern[(i + 1) % pattern.length];
    const end = Math.min(start + dash, circumference);
    const points = [at(start), at((start + end) / 2), at(end)];
    if (!points.every(near)) segments.push(`M${round(points[0][0])} ${round(points[0][1])}L${round(points[2][0])} ${round(points[2][1])}`);
    start += dash + gap;
  }
  if (!segments.length) throw new Error('every dash is covered; drop the circle instead');
  const paint = leaf.attributes.filter(([name]) => !['cx', 'cy', 'r', 'stroke-dasharray'].includes(name));
  return { tag: 'path', attributes: [...paint, ['d', segments.join('')]], children: [], selfClosing: true };
}

export function normaliseBody(input) {
  const nodes = parseBody(stripWrapper(input));
  const groups = nodes.filter((node) => node.tag === 'g');
  const leaves = nodes.flatMap((node) => (node.tag === 'g' ? node.children.map((child) => [child, node]) : [[node, null]]));
  const stroked = leaves.filter(([leaf, group]) => isStroked(effectivePaint(leaf, group)));
  const replace = (leaf, group, next) => {
    const list = group ? group.children : nodes;
    list[list.indexOf(leaf)] = next;
  };
  for (const [leaf, group] of leaves) {
    const transform = attribute(leaf, 'transform');
    if (transform !== undefined) {
      const rotation = transform.match(/^rotate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)$/);
      const ownCentre = rotation && leaf.tag === 'circle' &&
        Number(rotation[2]) === Number(attribute(leaf, 'cx')) && Number(rotation[3]) === Number(attribute(leaf, 'cy'));
      if (!ownCentre) throw new Error(`transform="${transform}" on <${leaf.tag}> is not a circle's rotation about its own centre`);
      leaf.attributes = leaf.attributes.filter(([name]) => name !== 'transform');
    }
    if (attribute(leaf, 'stroke-dasharray') !== undefined) {
      const others = stroked.filter(([candidate]) => candidate !== leaf).map(([candidate]) => candidate);
      replace(leaf, group, expandDashedCircle(leaf, others));
    }
  }
  for (const node of [...nodes, ...groups.flatMap((group) => group.children)]) {
    if (node.tag === 'g') continue;
    const group = groups.find((candidate) => candidate.children.includes(node)) ?? null;
    if (isStroked(effectivePaint(node, group)) && attribute(node, 'vector-effect') === undefined) {
      node.attributes.push(['vector-effect', 'non-scaling-stroke']);
    }
  }
  return serialiseBody(nodes);
}

export function entryFor({ id, source, cut, modified }, input) {
  const body = normaliseBody(input);
  const isSolar = source === 'solar' || source === 'solar-modified';
  const entry = { cut, source };
  if (isSolar) entry.solar = id;
  entry.licence = { solar: 'CC-BY-4.0', 'solar-modified': 'CC-BY-4.0', tiptree: 'Apache-2.0', 'third-party-unknown': 'unknown' }[source];
  if (modified !== undefined) entry.modified = modified;
  entry.body = body;
  const name = id?.replace(/-(linear|bold)$/, '');
  validateBody(body, id ?? source, { allowUnsetWidth: THIN_STROKE_ALLOW_LIST.includes(name) });
  return entry;
}

function main(argv) {
  const args = [...argv];
  const take = (flag) => {
    const index = args.indexOf(flag);
    if (index === -1) return undefined;
    const [, value] = args.splice(index, 2);
    if (value === undefined) throw new Error(`${flag} needs a value`);
    return value;
  };
  const modified = take('--modified');
  let source = take('--source');
  let cut = take('--cut');
  if (args.includes('--tiptree')) {
    args.splice(args.indexOf('--tiptree'), 1);
    source = 'tiptree';
  }
  let id;
  if (!source || source.startsWith('solar')) {
    id = args.shift();
    if (!/^[a-z0-9-]+-(linear|bold)$/.test(id ?? '')) throw new Error('usage: icon-body.mjs <iconify-id> [--cut …] [--modified "…"] [file]');
    const derived = modified !== undefined ? 'solar-modified' : 'solar';
    if (source && source !== derived) {
      throw new Error(source === 'solar-modified' ? '--source solar-modified needs --modified "<what changed>"' : '--modified makes the source solar-modified, not solar');
    }
    source = derived;
    cut ??= id.endsWith('-linear') ? 'linear' : undefined;
    if (!cut) throw new Error('a -bold glyph needs --cut filled or --cut solid');
  } else if (modified !== undefined) {
    throw new Error('--modified applies to Solar glyphs only');
  }
  cut ??= 'linear';
  const input = args.length ? readFileSync(args[0], 'utf8') : readFileSync(0, 'utf8');
  process.stdout.write(`${JSON.stringify(entryFor({ id, source, cut, modified }, input), null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
