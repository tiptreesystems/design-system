import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkGenerated, writeGenerated } from './generated-native-files.mjs';
import { validateIcons } from './build-icons.mjs';
import { geometry } from './native-icon-geometry.mjs';
import { swiftPath } from './swift-icon-path.mjs';

export const GENERATED = 'Sources/TiptreeDesignSystem/GeneratedIcons';
const identifier = (name) => name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
const member = (name) => '`' + identifier(name) + '`';
const group = (name) => 'GeneratedDrawings' + name[0].toUpperCase();

export function emitSwiftIcons(icons, version) {
  validateIcons(icons, { tokensVersion: version });
  const used = new Set(['allCases', 'rawValue', 'named', 'paths', 'cut', 'self', 'init', 'deinit', 'subscript']);
  for (const name of [...Object.keys(icons.glyphs), ...Object.keys(icons.aliases)]) {
    const id = identifier(name);
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(id) || used.has(id)) throw new Error(`Colliding/invalid Swift icon identifier: ${name}`);
    used.add(id);
  }
  const header = `// GENERATED from icons/icons.json v${version}; DO NOT EDIT.\n// Solar by 480 Design (CC BY 4.0); see bundled Notices for provenance/modifications.\nimport SwiftUI\n`;
  const catalog = [header, '/// Canonical drawing names. Applications own role mappings and localized labels.',
    'public enum TiptreeGlyph: String, CaseIterable, Sendable {'];
  for (const name of Object.keys(icons.glyphs)) catalog.push(`    case ${member(name)} = "${name}"`);
  for (const [name, alias] of Object.entries(icons.aliases)) catalog.push(
    `    @available(*, deprecated, renamed: "${identifier(alias.to)}", message: "Renamed since ${alias.since}")`,
    `    public static var ${member(name)}: Self { .${member(alias.to)} }`);
  catalog.push('', '    /// Resolves canonical names and published compatibility aliases; unknown names return nil.',
    '    public static func named(_ name: String) -> Self? {');
  if (Object.keys(icons.aliases).length) {
    catalog.push('        switch name {');
    for (const [name, alias] of Object.entries(icons.aliases)) catalog.push(`        case "${name}": .${member(alias.to)}`);
    catalog.push('        default: Self(rawValue: name)', '        }');
  } else catalog.push('        Self(rawValue: name)');
  catalog.push('    }', '', '    /// The registry cut (linear, filled or solid); never inferred from the name.',
    '    public var cut: String {', '        switch self {');
  for (const [name, glyph] of Object.entries(icons.glyphs)) catalog.push(`        case .${member(name)}: "${glyph.cut}"`);
  catalog.push('        }', '    }', '', '    var paths: [TiptreeGlyphPath] {', '        switch self {');
  for (const name of Object.keys(icons.glyphs)) catalog.push(`        case .${member(name)}: ${group(name)}.${member(name)}`);
  catalog.push('        }', '    }', '}', '');
  const files = new Map([['TiptreeGlyph.swift', catalog.join('\n')]]);
  const groups = new Map();
  for (const [name, glyph] of Object.entries(icons.glyphs)) {
    const lines = groups.get(group(name)) ?? [header, `enum ${group(name)} {`];
    lines.push(`    static let ${member(name)}: [TiptreeGlyphPath] = [`);
    for (const path of geometry(glyph.body)) {
      lines.push('        TiptreeGlyphPath(path: Path { path in',
        ...swiftPath(path).map((line) => '            ' + line),
        `        }, filled: ${path.filled}, lineWidth: ${path.width}, cap: .${path.cap}, join: .${path.join}, evenOdd: ${path.evenOdd}),`);
    }
    lines.push('    ]'); groups.set(group(name), lines);
  }
  for (const [name, lines] of groups) files.set(`${name}.swift`, [...lines, '}', ''].join('\n'));
  return files;
}

export function swiftIconFiles(root, version) {
  const registry = readFileSync(join(root, 'icons/icons.json'), 'utf8');
  const files = emitSwiftIcons(JSON.parse(registry), version);
  for (const name of ['LICENSE', 'NOTICE', 'LICENSE-CC-BY-4.0.txt']) files.set(`Notices/${name}`, readFileSync(join(root, name), 'utf8'));
  files.set('Notices/icons.json', registry);
  return files;
}

export function checkSwiftIcons(root, files) {
  checkGenerated(join(root, GENERATED), files, 'Swift icon');
}

export function buildSwiftIcons(root, version) {
  writeGenerated(join(root, GENERATED), swiftIconFiles(root, version));
}
