import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitSwift, loadSource, resolve, validate } from './build-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(ROOT, 'Sources/TiptreeDesignSystem/GeneratedTokens.swift');
const { data } = loadSource();
validate(data);

const expected = emitSwift(data, {
  base: resolve(data.tokens, data.tokens),
  themes: {
    dark: resolve(data.themes.dark, data.tokens),
    light: resolve(data.themes.light, data.tokens),
  },
});

let actual;
try {
  actual = readFileSync(sourcePath, 'utf8');
} catch {
  throw new Error('committed Swift package source is missing; run npm run build');
}

if (actual !== expected) {
  throw new Error('committed Swift package source is stale; run npm run build and commit the result');
}

console.log('verified: committed Swift package source matches tokens/tokens.json');
