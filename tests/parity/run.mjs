import { existsSync, readdirSync, rmSync, mkdtempSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = join(ROOT, 'tests/parity/button.html');
const ALTHEA_WEB_ROOT =
  process.env.TT_ALTHEA_WEB_ROOT ??
  join(ROOT, '../.slice-worktrees/althea/frontend/web');
const ALTHEA_INTER_REGULAR = join(
  ALTHEA_WEB_ROOT,
  'src/assets/fonts/Inter-Regular.v20260522.woff2',
);
const ALTHEA_INTER_MEDIUM = join(
  ALTHEA_WEB_ROOT,
  'src/assets/fonts/Inter-Medium.v20260522.woff2',
);
const TOLERANCE = 0.5;
const VIEWPORTS = [
  { name: 'desktop', width: 1024, height: 900 },
  { name: 'mobile', width: 600, height: 900 },
];

function findNamedFile(root, wanted, depth = 0) {
  if (!existsSync(root) || depth > 7) return [];
  const found = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isFile() && entry.name === wanted) found.push(path);
    else if (entry.isDirectory()) found.push(...findNamedFile(path, wanted, depth + 1));
  }
  return found;
}

function browserCandidates() {
  const candidates = [];
  if (process.env.TT_PARITY_BROWSER) candidates.push(process.env.TT_PARITY_BROWSER);
  candidates.push(
    ...findNamedFile(join(homedir(), 'Library/Caches/ms-playwright'), 'chrome-headless-shell'),
    ...findNamedFile(join(homedir(), '.cache/puppeteer'), 'chrome-headless-shell'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'chromium',
    'chromium-browser',
    'google-chrome',
  );
  return [...new Set(candidates)];
}

function browserWorks(candidate) {
  if (candidate.includes('/') && !existsSync(candidate)) return false;
  const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

const browser = browserCandidates().find(browserWorks);
if (!browser) {
  console.error(
    'DEGRADED: no system Chromium browser found. Set TT_PARITY_BROWSER to a Chrome/Chromium executable.',
  );
  process.exit(2);
}
if (!existsSync(ALTHEA_INTER_REGULAR) || !existsSync(ALTHEA_INTER_MEDIUM)) {
  console.error(
    'DEGRADED: Althea Inter fixtures not found. Set TT_ALTHEA_WEB_ROOT to frontend/frontend/web.',
  );
  process.exit(2);
}

const fixtureUrl = new URL(pathToFileURL(FIXTURE));
fixtureUrl.searchParams.set('interRegular', pathToFileURL(ALTHEA_INTER_REGULAR).href);
fixtureUrl.searchParams.set('interMedium', pathToFileURL(ALTHEA_INTER_MEDIUM).href);

const numeric = (value) => {
  const match = String(value).match(/^(-?[0-9]+(?:\.[0-9]+)?)px$/);
  return match ? Number(match[1]) : null;
};

function compareValue(original, target) {
  const originalNumber = numeric(original);
  const targetNumber = numeric(target);
  if (originalNumber !== null && targetNumber !== null) {
    return {
      pass: Math.abs(originalNumber - targetNumber) <= TOLERANCE,
      delta: Math.abs(originalNumber - targetNumber),
    };
  }
  return { pass: original === target, delta: original === target ? 0 : null };
}

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

const profileDirectory = mkdtempSync(join(tmpdir(), 'tt-parity-browser-'));
let failed = false;
try {
  for (const viewport of VIEWPORTS) {
    const args = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--allow-file-access-from-files',
      `--user-data-dir=${profileDirectory}`,
      `--window-size=${viewport.width},${viewport.height}`,
      '--virtual-time-budget=5000',
      '--dump-dom',
      fixtureUrl.href,
    ];
    const result = spawnSync(browser, args, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30_000,
    });
    if (result.status !== 0) {
      console.error(`FAIL ${viewport.name}: browser exited ${result.status}`);
      console.error(result.stderr.trim());
      failed = true;
      continue;
    }
    const match = result.stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/);
    if (!match) {
      console.error(`FAIL ${viewport.name}: fixture emitted no measurement JSON`);
      failed = true;
      continue;
    }
    const report = JSON.parse(decodeHtml(match[1]));
    for (const row of report.rows) {
      let maxDelta = 0;
      const mismatches = [];
      for (const [property, original] of Object.entries(row.originalLayout)) {
        const target = row.targetLayout[property];
        const comparison = compareValue(original, target);
        if (comparison.delta !== null) maxDelta = Math.max(maxDelta, comparison.delta);
        if (!comparison.pass) mismatches.push(`${property}: ${original} != ${target}`);
      }
      if (mismatches.length) {
        console.error(`FAIL ${viewport.name} ${row.name}`);
        for (const mismatch of mismatches) console.error(`  ${mismatch}`);
        failed = true;
      } else {
        console.log(
          `PASS ${viewport.name} ${row.name}  max numeric delta ${maxDelta.toFixed(3)}px`,
        );
      }
      const identityDeltas = Object.entries(row.originalIdentity)
        .filter(([property, original]) => original !== row.targetIdentity[property])
        .map(
          ([property, original]) =>
            `${property}: ${original} -> ${row.targetIdentity[property]}`,
        );
      console.log(
        `IDENTITY ${viewport.name} ${row.name}  ${
          identityDeltas.length ? identityDeltas.join(' | ') : 'no computed delta'
        }`,
      );
    }
  }
} finally {
  rmSync(profileDirectory, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log(`Button geometry parity PASS (tolerance <= ${TOLERANCE}px)`);
