import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync } from 'node:zlib';
import { GENERATED } from './build-android.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const limits = JSON.parse(readFileSync(join(root, 'android/budgets.json'), 'utf8'));
const contents = [];
function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) walk(child);
    else contents.push(readFileSync(child));
  }
}
walk(join(root, GENERATED));
const bytes = Buffer.concat(contents);
const compressed = brotliCompressSync(bytes).length;
if (bytes.length > limits.generatedRaw || compressed > limits.generatedBrotli) throw new Error(`Android generated payload exceeds budget: ${bytes.length}/${compressed}`);
console.log(`PASS Android generated files: ${bytes.length}/${limits.generatedRaw} B raw; ${compressed}/${limits.generatedBrotli} B Brotli`);
