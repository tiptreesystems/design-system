// Build-time SVG compiler. Unsupported commands fail the export instead of
// silently changing artwork. No path strings or SVG parser ship in Swift.
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, A: 7 };

// SVG endpoint-to-center conversion, per W3C SVG implementation notes F.6.5.
// Keep arcs as native conics rather than approximating circles with cubics.
export function arc(start, values) {
  let [rx, ry, degrees, large, sweep, x, y] = values;
  if (![0, 1].includes(large) || ![0, 1].includes(sweep)) throw new Error('Invalid SVG arc flag');
  if (start[0] === x && start[1] === y) return null;
  rx = Math.abs(rx); ry = Math.abs(ry);
  if (rx === 0 || ry === 0) return { kind: 'line', values: [x, y] };
  const angle = (degrees % 360) * Math.PI / 180;
  const cos = Math.cos(angle); const sin = Math.sin(angle);
  const dx = (start[0] - x) / 2; const dy = (start[1] - y) / 2;
  const px = cos * dx + sin * dy; const py = -sin * dx + cos * dy;
  const scale = Math.hypot(px / rx, py / ry);
  if (scale > 1) { rx *= scale; ry *= scale; }
  const norm = (px / rx) ** 2 + (py / ry) ** 2;
  const factor = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, (1 - norm) / norm));
  const cx = factor * rx * py / ry; const cy = -factor * ry * px / rx;
  const ux = (px - cx) / rx; const uy = (py - cy) / ry;
  const vx = (-px - cx) / rx; const vy = (-py - cy) / ry;
  const theta = Math.atan2(uy, ux);
  let delta = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const result = [theta, delta, rx * cos, rx * sin, -ry * sin, ry * cos,
    cos * cx - sin * cy + (start[0] + x) / 2,
    sin * cx + cos * cy + (start[1] + y) / 2];
  if (result.some((n) => !Number.isFinite(n))) throw new Error('Non-finite SVG arc geometry');
  return { kind: 'arc', values: result };
}

export function compilePath(source) {
  const tokens = [];
  let rest = source.trim();
  while (rest) {
    const match = rest.match(NUMBER) ?? rest.match(/^[a-zA-Z]/);
    if (!match) throw new Error(`Invalid SVG path near ${rest.slice(0, 24)}`);
    const token = /^[a-zA-Z]$/.test(match[0]) ? match[0] : Number(match[0]);
    if (typeof token === 'number' && !Number.isFinite(token)) throw new Error('Non-finite SVG coordinate');
    tokens.push(token);
    rest = rest.slice(match[0].length);
    const separator = rest.match(/^[\s,]*/)[0];
    rest = rest.slice(separator.length);
    if (separator.includes(',') && (typeof token !== 'number' ||
        separator.split(',').length !== 2 || !rest || /^[a-zA-Z]/.test(rest))) {
      throw new Error('Invalid SVG coordinate separator');
    }
  }
  if (!tokens.length || !['M', 'm'].includes(tokens[0])) throw new Error('SVG path must start with moveto');
  const operations = [];
  let index = 0; let command; let point = [0, 0]; let origin = point;
  while (index < tokens.length) {
    if (typeof tokens[index] === 'string') command = tokens[index++];
    if (!command) throw new Error('SVG path needs a command after closepath');
    const upper = command.toUpperCase();
    if (upper === 'Z') {
      operations.push({ kind: 'close', values: [] }); point = [...origin]; command = undefined; continue;
    }
    const count = ARITY[upper];
    if (!count) throw new Error(`Unsupported SVG command ${command}`);
    const values = tokens.slice(index, index + count);
    if (values.length !== count || values.some((v) => typeof v !== 'number')) throw new Error(`Incomplete SVG command ${command}`);
    index += count;
    if (command !== upper) {
      if (upper === 'H') values[0] += point[0];
      else if (upper === 'V') values[0] += point[1];
      else if (upper === 'A') { values[5] += point[0]; values[6] += point[1]; }
      else for (let i = 0; i < count; i++) values[i] += point[i % 2];
    }
    let operation;
    switch (upper) {
      case 'M':
        operation = { kind: 'move', values }; origin = values;
        command = command === 'm' ? 'l' : 'L'; break;
      case 'L': operation = { kind: 'line', values }; break;
      case 'H': operation = { kind: 'line', values: [values[0], point[1]] }; break;
      case 'V': operation = { kind: 'line', values: [point[0], values[0]] }; break;
      case 'C': operation = { kind: 'curve', values }; break;
      case 'A': operation = arc(point, values); break;
    }
    point = upper === 'A' ? values.slice(5) : operation.values.slice(-2);
    if (operation) operations.push(operation);
  }
  if (operations.some((op) => op.values.some((n) => !Number.isFinite(n)))) throw new Error('Non-finite SVG geometry');
  return operations;
}

const number = (value) => Math.abs(value) < 1e-14 ? '0' : Number(value.toPrecision(15)).toString();
const point = (x, y) => `CGPoint(x: ${number(x)}, y: ${number(y)})`;

export function swiftPath(path) {
  if (path.oval) {
    const [x, y, rx, ry] = path.oval;
    return [`path.addEllipse(in: CGRect(x: ${number(x - rx)}, y: ${number(y - ry)}, width: ${number(rx * 2)}, height: ${number(ry * 2)}))`];
  }
  return compilePath(path.data).map(({ kind, values: v }) => {
    switch (kind) {
      case 'move': return `path.move(to: ${point(...v)})`;
      case 'line': return `path.addLine(to: ${point(...v)})`;
      case 'curve': return `path.addCurve(to: ${point(v[4], v[5])}, control1: ${point(v[0], v[1])}, control2: ${point(v[2], v[3])})`;
      case 'close': return 'path.closeSubpath()';
      case 'arc': return `path.addRelativeArc(center: .zero, radius: 1, startAngle: .radians(${number(v[0])}), delta: .radians(${number(v[1])}), transform: CGAffineTransform(a: ${number(v[2])}, b: ${number(v[3])}, c: ${number(v[4])}, d: ${number(v[5])}, tx: ${number(v[6])}, ty: ${number(v[7])}))`;
    }
  });
}
