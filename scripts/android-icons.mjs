import { validateIcons } from './build-icons.mjs';
import { float, identifier, uniqueIdentifiers } from './android-tokens.mjs';

const iconIdentifier = (name) => { const id = identifier(name); return id[0].toUpperCase() + id.slice(1); };

import { geometry } from './native-icon-geometry.mjs';
export { geometry, pathData } from './native-icon-geometry.mjs';

export function emitIcons(icons, version) {
  validateIcons(icons, { tokensVersion: version });
  uniqueIdentifiers([...Object.keys(icons.glyphs), ...Object.keys(icons.aliases)], iconIdentifier);
  const lines = [
    `// GENERATED from icons/icons.json v${version}; DO NOT EDIT.`,
    '// Solar by 480 Design (CC BY 4.0); Tiptree originals and modifications: see bundled notices/registry.',
    'package com.tiptreesystems.designsystem', '',
    'import androidx.compose.ui.geometry.Rect',
    'import androidx.compose.ui.graphics.StrokeCap', 'import androidx.compose.ui.graphics.StrokeJoin', '',
    'object TiptreeIcons {',
  ];
  for (const [name, glyph] of Object.entries(icons.glyphs)) {
    lines.push(`    val ${iconIdentifier(name)}: TiptreeGlyph by lazy {`,
      `        TiptreeGlyph("${name}", "${glyph.cut}", listOf(`);
    for (const path of geometry(glyph.body)) {
      const title = (s) => s[0].toUpperCase() + s.slice(1);
      const [cx, cy, rx, ry] = path.oval ?? [];
      const oval = path.oval ? `, oval = Rect(${[cx - rx, cy - ry, cx + rx, cy + ry].map(float).join(', ')})` : '';
      lines.push(`            GlyphPath(${JSON.stringify(path.data)}, ${path.filled}, ${float(path.width)}, StrokeCap.${title(path.cap)}, StrokeJoin.${title(path.join)}, ${path.evenOdd}${oval}),`);
    }
    lines.push('        ))', '    }');
  }
  for (const [name, alias] of Object.entries(icons.aliases)) {
    lines.push(`    @Deprecated("Renamed to ${alias.to} since ${alias.since}", ReplaceWith("${iconIdentifier(alias.to)}"))`,
      `    val ${iconIdentifier(name)}: TiptreeGlyph get() = ${iconIdentifier(alias.to)}`);
  }
  lines.push('    val names: List<String> = listOf(', ...Object.keys(icons.glyphs).map((name) => `        "${name}",`), '    )',
    '    fun named(name: String): TiptreeGlyph? = when (name) {');
  for (const name of Object.keys(icons.glyphs)) lines.push(`        "${name}" -> ${iconIdentifier(name)}`);
  for (const [name, alias] of Object.entries(icons.aliases)) lines.push(`        "${name}" -> ${iconIdentifier(alias.to)}`);
  lines.push('        else -> null', '    }', '}', '');
  return lines.join('\n');
}
