// Payload budgets are a release gate. Every default/unlayered component and
// every file under dist/icons/ must have an explicit entry; layered copies are
// exempt as documented in _meta.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const budgets = JSON.parse(readFileSync(join(ROOT, 'budgets.json'), 'utf8'));
const slash = (value) => value.split(sep).join('/');

function filesUnder(directory, extension = '') {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && entry.name.endsWith(extension)) files.push(path);
    }
  };
  if (existsSync(directory)) walk(directory);
  return files.sort();
}

let failed = false;
const componentRoot = join(ROOT, 'dist/css/components');
const iconRoot = join(ROOT, 'dist/icons');
for (const file of [...filesUnder(componentRoot, '.css'), ...filesUnder(iconRoot)]) {
  const key = slash(relative(ROOT, file));
  if (!(key in budgets)) {
    console.error(`FAIL  ${key}  missing payload budget`);
    failed = true;
  }
}

for (const [file, limit] of Object.entries(budgets)) {
  if (file.startsWith('_')) continue;
  const buf = readFileSync(join(ROOT, file));
  const raw = buf.length;
  const brotli = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  const ok = raw <= limit.raw && brotli <= limit.brotli;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${file}  raw ${raw}/${limit.raw} B  brotli ${brotli}/${limit.brotli} B`,
  );
}
if (failed) {
  console.error('payload budget exceeded or missing — this is a release gate (docs/OPERATING_GUIDE.md §2)');
  process.exit(1);
}
