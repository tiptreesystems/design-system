import { parseBody } from './build-icons.mjs';

// Convert only the registry's validated SVG subset. native receives path data,
// never XML, transforms, references, scripts, downloaded SVG or a new renderer dependency.
export function pathData(node) {
  const attrs = Object.fromEntries(node.attributes);
  const n = (key) => Number(attrs[key] ?? 0);
  switch (node.tag) {
    case 'path': return attrs.d;
    case 'line': return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
    case 'polyline': {
      const points = attrs.points.trim().split(/[\s,]+/).map(Number);
      if (points.length < 4 || points.length % 2 || points.some((v) => !Number.isFinite(v))) throw new Error('Invalid native polyline');
      return `M${points.slice(0, 2).join(' ')}L${points.slice(2).join(' ')}`;
    }
    case 'circle':
    case 'ellipse': {
      const x = n('cx'); const y = n('cy');
      const rx = node.tag === 'circle' ? n('r') : n('rx');
      const ry = node.tag === 'circle' ? n('r') : n('ry');
      if (rx <= 0 || ry <= 0) throw new Error('Non-positive native ellipse radius');
      return `M${x - rx} ${y}A${rx} ${ry} 0 1 0 ${x + rx} ${y}A${rx} ${ry} 0 1 0 ${x - rx} ${y}Z`;
    }
    case 'rect': {
      const x = n('x'); const y = n('y'); const w = n('width'); const h = n('height');
      if (w <= 0 || h <= 0 || n('rx') < 0 || n('ry') < 0) throw new Error('Invalid native rectangle');
      const rx = Math.min(Number(attrs.rx ?? attrs.ry ?? 0), w / 2);
      const ry = Math.min(Number(attrs.ry ?? attrs.rx ?? 0), h / 2);
      if (!rx || !ry) return `M${x} ${y}h${w}v${h}h${-w}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    default: throw new Error(`Unsupported native icon element ${node.tag}`);
  }
}

export function geometry(body) {
  const paths = [];
  const visit = (node, inherited = {}) => {
    const attrs = { ...inherited, ...Object.fromEntries(node.attributes) };
    if (node.tag === 'g') { node.children.forEach((child) => visit(child, attrs)); return; }
    paths.push({
      data: pathData(node), filled: attrs.fill === 'currentColor',
      width: attrs.stroke === 'currentColor' ? Number(attrs['stroke-width'] ?? 1) : 0,
      cap: attrs['stroke-linecap'] ?? 'butt', join: attrs['stroke-linejoin'] ?? 'miter',
      evenOdd: attrs['fill-rule'] === 'evenodd',
      ...(node.tag === 'circle' || node.tag === 'ellipse' ? {
        oval: [Number(attrs.cx ?? 0), Number(attrs.cy ?? 0),
          Number(node.tag === 'circle' ? attrs.r : attrs.rx), Number(node.tag === 'circle' ? attrs.r : attrs.ry)],
      } : {}),
    });
  };
  parseBody(body).forEach((node) => visit(node));
  return paths;
}
