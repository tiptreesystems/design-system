// Payload budgets — a release gate, not advice. Fails CI on regression.
// Numbers are the plan's indicative seeds; finalize at kickoff (§3).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const budgets = JSON.parse(readFileSync(join(ROOT, 'budgets.json'), 'utf8'));

let failed = false;
for (const [file, limit] of Object.entries(budgets)) {
  const buf = readFileSync(join(ROOT, file));
  const raw = buf.length;
  const brotli = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  const ok = raw <= limit.raw && brotli <= limit.brotli;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${file}  raw ${raw}/${limit.raw} B  brotli ${brotli}/${limit.brotli} B`
  );
}
if (failed) {
  console.error('payload budget exceeded — this is a release gate (DESIGN_SYSTEM_PLAN.md §3)');
  process.exit(1);
}
