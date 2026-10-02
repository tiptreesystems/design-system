// The public-surface snapshot (ledger 2026-10-01): every published name is
// recorded per release, so a change of name is visible in review, recorded in
// the notes when something is removed or renamed, and frozen at its tag.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../scripts/build-tokens.mjs';
import { compareVersions, computeSurface, diff, serialise, SNAPSHOT_DIR, snapshotPath } from '../scripts/public-surface.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
build();
const surface = computeSurface(ROOT);

const snapshots = readdirSync(SNAPSHOT_DIR)
  .map((file) => file.match(/^v(.+)\.json$/)?.[1])
  .filter(Boolean)
  .sort(compareVersions);

const describe = ({ added, removed, changed }) =>
  `added [${added.join(', ')}]; removed [${removed.join(', ')}]; changed [${changed.join(', ')}]`;

test('version ordering puts a candidate between the releases around it', () => {
  assert.ok(compareVersions('0.7.0-rc.1', '0.6.0') > 0);
  assert.ok(compareVersions('0.7.0', '0.7.0-rc.1') > 0);
  assert.ok(compareVersions('0.7.0-rc.10', '0.7.0-rc.2') > 0);
  assert.equal(compareVersions('0.7.0', '0.7.0'), 0);
});

test('the built surface equals this version\'s snapshot exactly', () => {
  const path = snapshotPath(surface.version);
  assert.ok(existsSync(path), `tests/public-surface/v${surface.version}.json is missing; run node scripts/public-surface.mjs --write`);
  const recorded = JSON.parse(readFileSync(path, 'utf8'));
  const change = diff(recorded, surface);
  assert.deepEqual(surface, recorded, `the public surface changed: ${describe(change)}; regenerate the snapshot in the same change`);
  assert.equal(readFileSync(path, 'utf8'), serialise(surface), 'snapshots are written by scripts/public-surface.mjs only');
});

test('against the previous release, every removed or renamed name is recorded and aliased', () => {
  const previous = snapshots
    .filter((version) => !version.includes('-') && compareVersions(version, surface.version) < 0)
    .at(-1);
  assert.ok(previous, 'a previous release snapshot is the baseline');
  const before = JSON.parse(readFileSync(snapshotPath(previous), 'utf8'));
  const { removed } = diff(before, surface);
  const notes = readFileSync(join(ROOT, 'RELEASE_NOTES.md'), 'utf8');
  const recorded = [...notes.matchAll(/^##+ [^\n]*(?:Removed|Renamed)[^\n]*\n([\s\S]*?)(?=^#|$(?![\s\S]))/gm)]
    .map((match) => match[1])
    .join('\n');
  const subject = (entry) => {
    const parts = entry.split(' ');
    const name = parts.at(-1);
    if (parts[0] === 'css') return name.replace(/^--tt-/, '');
    if (parts[0] === 'swift') return name.replace(/UIColor$/, '');
    return name;
  };
  const unrecorded = removed.filter((entry) => !recorded.includes(subject(entry)));
  assert.deepEqual(unrecorded, [], `removed or renamed since v${previous} but not under a Removed/Renamed heading in RELEASE_NOTES.md`);
  // Under 0.x a glyph name leaves only through an alias kept for one minor. A
  // token name keeps an alias token ({new}) for one minor, which the notes
  // line records; the snapshot holds names, not values, so it cannot see it.
  if (surface.version.startsWith('0.')) {
    const goneGlyphs = removed.filter((entry) => entry.startsWith('icons glyph ')).map((entry) => entry.split(' ').at(-1));
    const unaliased = goneGlyphs.filter((name) => !(name in surface.icons.aliases));
    assert.deepEqual(unaliased, [], 'a removed or renamed glyph keeps an alias for one minor');
  }
});

test('a snapshot is frozen once its version is tagged', () => {
  for (const version of snapshots.filter((candidate) => compareVersions(candidate, surface.version) < 0)) {
    let tagged;
    try {
      tagged = execFileSync('git', ['show', `v${version}:tests/public-surface/v${version}.json`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      // The tag is absent here (a shallow CI checkout) or predates the file
      // (v0.6.0's baseline was written from its tag at 0.7.0); nothing to hold.
      continue;
    }
    assert.equal(readFileSync(snapshotPath(version), 'utf8'), tagged, `v${version}.json changed after its tag`);
  }
});
