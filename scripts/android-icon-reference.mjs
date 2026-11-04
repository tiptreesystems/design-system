// Render the actual canonical SVG bodies in an installed Chromium. No npm dependency.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve as pathResolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadSource, resolve } from './build-tokens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = pathResolve(process.argv[2] ?? join(root, 'android/build/icon-parity'));
const browser = process.env.TT_PARITY_BROWSER ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const icons = JSON.parse(readFileSync(join(root, 'icons/icons.json'), 'utf8'));
const { data } = loadSource();
mkdirSync(output, { recursive: true });
const names = Object.keys(icons.glyphs);
writeFileSync(join(output, 'names.txt'), names.join('\n') + '\n');
const width = 6 * 3 * 56;
const height = Math.ceil(names.length / 6) * 56;
for (const theme of ['light', 'dark']) {
  const colors = resolve(data.themes[theme], data.tokens);
  const glyphs = names.flatMap((name, index) => [16, 20, 40].map((size, variant) => {
    const left = ((index % 6) * 3 + variant) * 56 + (56 - size) / 2;
    const top = Math.floor(index / 6) * 56 + (56 - size) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="position:absolute;left:${left}px;top:${top}px;color:${colors['color-text-primary']}">${icons.glyphs[name].body}</svg>`;
  }));
  const html = join(output, `reference-${theme}.html`);
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:${colors['color-bg-primary']};color-scheme:only ${theme}}</style>${glyphs.join('')}`);
  for (const density of [1, 2]) {
    const profile = mkdtempSync(join(tmpdir(), 'tt-icon-browser-'));
    try {
      const result = spawnSync(browser, ['--headless', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
        `--user-data-dir=${profile}`, `--force-device-scale-factor=${density}`, `--window-size=${width},${height}`,
        '--run-all-compositor-stages-before-draw', '--virtual-time-budget=1000',
        `--screenshot=${join(output, `web-${theme}-${density}x.png`)}`, pathToFileURL(html).href],
        { encoding: 'utf8', timeout: 60000 });
      if (result.status !== 0) throw new Error(`Chromium reference failed: ${result.error ?? result.stderr}`);
    } finally { rmSync(profile, { recursive: true, force: true }); }
  }
}
console.log(`Rendered canonical SVG contact sheets: ${output}`);
