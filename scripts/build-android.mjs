import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { emitTokens } from './android-tokens.mjs';
import { emitIcons } from './android-icons.mjs';

export const GENERATED = 'android/design-system/src/main/generated';
const KOTLIN = 'kotlin/com/tiptreesystems/designsystem';

export function androidFiles(root, data, resolved) {
  const iconSource = readFileSync(join(root, 'icons/icons.json'), 'utf8');
  const icons = JSON.parse(iconSource);
  const tokens = emitTokens(data, resolved);
  const files = new Map([
    [`${KOTLIN}/TiptreeTokens.kt`, tokens.tokens],
    [`${KOTLIN}/TiptreeColors.kt`, tokens.colors],
    [`${KOTLIN}/TiptreeIcons.kt`, emitIcons(icons, data.meta.version)],
    ['res/values/tt_colors.xml', tokens.lightXml],
    ['res/values-night/tt_colors.xml', tokens.darkXml],
  ]);
  for (const name of ['LICENSE', 'NOTICE', 'LICENSE-CC-BY-4.0.txt']) {
    files.set(`assets/tiptree-design-system/${name}`, readFileSync(join(root, name), 'utf8'));
  }
  files.set('assets/tiptree-design-system/icons.json', iconSource);
  return files;
}

export function checkAndroid(root, files) {
  const directory = join(root, GENERATED);
  const actual = [];
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child);
      else actual.push(relative(directory, child));
    }
  };
  if (existsSync(directory)) walk(directory);
  if (actual.sort().join('\n') !== [...files.keys()].sort().join('\n')) throw new Error('Missing/extra generated Android files; run npm run build');
  for (const [path, expected] of files) {
    if (readFileSync(join(directory, path), 'utf8') !== expected) throw new Error(`Stale generated Android file ${path}; run npm run build`);
  }
}

export function buildAndroid(root, data, resolved) {
  const files = androidFiles(root, data, resolved);
  rmSync(join(root, GENERATED), { recursive: true, force: true });
  for (const [path, content] of files) {
    const target = join(root, GENERATED, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}
