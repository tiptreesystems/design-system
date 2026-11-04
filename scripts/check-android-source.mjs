import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSource, resolve, validate } from './build-tokens.mjs';
import { androidFiles, checkAndroid } from './build-android.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { data } = loadSource();
validate(data);
checkAndroid(root, androidFiles(root, data, {
  base: resolve(data.tokens, data.tokens),
  themes: Object.fromEntries(['light', 'dark'].map((theme) => [theme, resolve(data.themes[theme], data.tokens)])),
}));
console.log('verified: committed Android sources/resources match canonical tokens and icons');
