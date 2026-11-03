import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkGenerated, writeGenerated } from './generated-native-files.mjs';
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
  checkGenerated(join(root, GENERATED), files, 'Android');
}

export function buildAndroid(root, data, resolved) {
  writeGenerated(join(root, GENERATED), androidFiles(root, data, resolved));
}
