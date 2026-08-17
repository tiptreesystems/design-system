// The designer's one command: npm run dev
// Watches tokens/ + css/, rebuilds on change, serves the showcase.
// Zero dependencies; the designer never touches the generator.
import { existsSync, watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4173;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };

function rebuild() {
  try {
    const n = build();
    console.log(`[tt] rebuilt — ${n.tokens} base / ${n.semantic} semantic tokens`);
  } catch (err) {
    console.error(`[tt] BUILD ERROR:\n${err.message}`);
  }
}

rebuild();
let timer;
for (const dir of ['tokens', 'css']) {
  const sourceDirectory = join(ROOT, dir);
  if (!existsSync(sourceDirectory)) continue;
  watch(sourceDirectory, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 100);
  });
}

createServer(async (req, res) => {
  const path = req.url === '/' ? '/showcase/index.html' : normalize(req.url.split('?')[0]);
  if (path.includes('..')) { res.writeHead(400).end(); return; }
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(PORT, () => console.log(`[tt] showcase: http://localhost:${PORT} (watching available token/component sources)`));
