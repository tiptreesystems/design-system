import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arc, compilePath, swiftPath } from '../scripts/swift-icon-path.mjs';
import { emitSwiftIcons, swiftIconFiles, checkSwiftIcons, GENERATED } from '../scripts/build-swift-icons.mjs';
import { geometry } from '../scripts/native-icon-geometry.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const icons = JSON.parse(readFileSync(join(root, 'icons/icons.json'), 'utf8'));
const version = icons.meta.version;

test('Swift exports every canonical name/cut, all geometry and exact notices deterministically', () => {
  const files = swiftIconFiles(root, version);
  assert.deepEqual(files, swiftIconFiles(root, version));
  const catalog = files.get('TiptreeGlyph.swift');
  for (const [name, glyph] of Object.entries(icons.glyphs)) {
    assert.ok(catalog.includes(`= "${name}"`), name);
    for (const path of geometry(glyph.body)) assert.ok(swiftPath(path).length > 0, name);
  }
  assert.equal((catalog.match(/^    case /gm) ?? []).length, Object.keys(icons.glyphs).length);
  for (const name of ['LICENSE', 'NOTICE', 'LICENSE-CC-BY-4.0.txt']) assert.equal(files.get(`Notices/${name}`), readFileSync(join(root, name), 'utf8'));
  assert.equal(files.get('Notices/icons.json'), readFileSync(join(root, 'icons/icons.json'), 'utf8'));
  checkSwiftIcons(root, files);
});

test('Swift publishes deprecated aliases without making them canonical cases, and rejects collisions', () => {
  const source = structuredClone(icons);
  source.aliases['old-add'] = { to: 'add', since: version };
  const catalog = emitSwiftIcons(source, version).get('TiptreeGlyph.swift');
  assert.ok(catalog.includes('renamed: "add"'));
  assert.ok(catalog.includes('case "old-add": .`add`'));
  assert.ok(!catalog.includes('case `oldAdd` ='));
  for (const name of ['all-cases', 'raw-value', 'paths', 'self', 'init']) {
    const invalid = structuredClone(icons);
    invalid.glyphs[name] = structuredClone(icons.glyphs.add);
    invalid.glyphs = Object.fromEntries(Object.entries(invalid.glyphs).sort(([a], [b]) => a < b ? -1 : 1));
    assert.throws(() => emitSwiftIcons(invalid, version), /identifier/);
  }
  const invalid = structuredClone(icons);
  invalid.glyphs['a-1'] = structuredClone(icons.glyphs.add);
  invalid.glyphs.a1 = structuredClone(icons.glyphs.add);
  invalid.glyphs = Object.fromEntries(Object.entries(invalid.glyphs).sort(([a], [b]) => a < b ? -1 : 1));
  assert.throws(() => emitSwiftIcons(invalid, version), /identifier/);
});

test('committed Swift gate rejects missing, extra and stale outputs before regeneration', () => {
  const temp = mkdtempSync(join(tmpdir(), 'tt-swift-check-'));
  const files = new Map([['Glyph.swift', 'expected\n']]);
  const directory = join(temp, GENERATED);
  try {
    assert.throws(() => checkSwiftIcons(temp, files), /Missing\/extra/);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'Glyph.swift'), 'expected\n');
    checkSwiftIcons(temp, files);
    writeFileSync(join(directory, 'Extra.swift'), 'extra');
    assert.throws(() => checkSwiftIcons(temp, files), /Missing\/extra/);
    rmSync(join(directory, 'Extra.swift'));
    writeFileSync(join(directory, 'Glyph.swift'), 'stale');
    assert.throws(() => checkSwiftIcons(temp, files), /Stale/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('SVG compiler handles implicit lines, relative cubics, shorthand axes and closing origins', () => {
  assert.deepEqual(compilePath('m2 3 4 5 h2 v-1 c1 2 3 4 5 6 z m1 1'), [
    { kind: 'move', values: [2, 3] }, { kind: 'line', values: [6, 8] },
    { kind: 'line', values: [8, 8] }, { kind: 'line', values: [8, 7] },
    { kind: 'curve', values: [9, 9, 11, 11, 13, 13] }, { kind: 'close', values: [] },
    { kind: 'move', values: [3, 4] },
  ]);
  assert.deepEqual(compilePath('M.5-.5L1e1 2E-1'), [
    { kind: 'move', values: [0.5, -0.5] }, { kind: 'line', values: [10, 0.2] },
  ]);
  for (const source of ['', 'L1 2', 'M0', 'M0 0C1 2', 'M0 0LNaN 2', 'M0 0L1e999 2',
    'M0 0Q1 2 3 4', 'M0 0S1 2 3 4', 'M0 0Z1 2', 'M0 0A2 2 0 2 0 3 4', 'M0 0@',
    'M,0 0', 'M0,,0', 'M0 0,', 'M0 0,L1 2']) {
    assert.throws(() => compilePath(source), undefined, source);
  }
});

test('native arcs preserve endpoints, rotation, radius correction and both sweep/large-arc choices', () => {
  const start = [3, 7]; const end = [19, 14];
  for (const radii of [[12, 8], [1, 2]]) for (const large of [0, 1]) for (const sweep of [0, 1]) {
    const result = arc(start, [...radii, 37, large, sweep, ...end]);
    const [theta, delta, a, b, c, d, tx, ty] = result.values;
    const evaluate = (t) => [a * Math.cos(t) + c * Math.sin(t) + tx, b * Math.cos(t) + d * Math.sin(t) + ty];
    for (const [actual, expected] of [[evaluate(theta), start], [evaluate(theta + delta), end]]) {
      assert.ok(actual.every((value, index) => Math.abs(value - expected[index]) < 1e-7));
    }
    assert.equal(Math.sign(delta), sweep ? 1 : -1);
    if (radii[0] === 12) assert.equal(Math.abs(delta) > Math.PI, Boolean(large));
  }
  assert.equal(arc([1, 1], [2, 2, 0, 0, 1, 1, 1]), null);
  assert.deepEqual(arc([1, 1], [0, 2, 0, 0, 1, 3, 4]), { kind: 'line', values: [3, 4] });
  assert.deepEqual(compilePath('M1 1a2 2 0 0 1 0 0l2 3').at(-1), { kind: 'line', values: [3, 4] });
  assert.match(swiftPath({ oval: [12, 12, 5, 3] })[0], /CGRect\(x: 7, y: 9, width: 10, height: 6\)/);
});
