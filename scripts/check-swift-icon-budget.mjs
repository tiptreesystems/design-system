import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync } from 'node:zlib';
import { swiftIconFiles } from './build-swift-icons.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const limits = JSON.parse(readFileSync(join(root, 'swift-icons.budgets.json'), 'utf8'));
const files = swiftIconFiles(root, version);
const contents = [...files.entries()].sort(([a], [b]) => a < b ? -1 : 1);
const bytes = Buffer.from(contents.map(([, content]) => content).join(''));
const compressed = brotliCompressSync(bytes).length;
const notices = contents.filter(([path]) => path.startsWith('Notices/')).reduce((sum, [, content]) => sum + Buffer.byteLength(content), 0);
if (bytes.length > limits.generatedRaw || compressed > limits.generatedBrotli || notices > limits.bundledNotices) {
  throw new Error(`Swift icon payload exceeds budget: ${bytes.length} raw / ${compressed} Brotli / ${notices} notices`);
}
console.log(`PASS Swift icons: ${bytes.length}/${limits.generatedRaw} B raw; ${compressed}/${limits.generatedBrotli} B Brotli; ${notices}/${limits.bundledNotices} B bundled notices`);
