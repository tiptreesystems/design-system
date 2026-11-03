// Android's explicit unit adaptation. Canonical applicability and values stay unchanged.
const number = '-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
const NUMBER_RE = new RegExp(`^${number}$`);
const DIMENSION_RE = new RegExp(`^(${number})(px|rem)$`);
const RATIO_RE = new RegExp(`^calc\\((${number}) / (${number})\\)$`);
const DURATION_RE = new RegExp(`^(${number})(ms|s)$`);
const TRACKING_RE = new RegExp(`^(${number})(em)?$`);
const fail = (name, value) => { throw new Error(`Unsupported Android token ${name}: ${value}`); };
export const identifier = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
export function float(value) {
  const rounded = Math.fround(value);
  if (!Number.isFinite(rounded) || (value !== 0 && rounded === 0)) {
    throw new Error(`Value is outside Kotlin Float range: ${value}`);
  }
  const literal = String(value);
  return `${/[.e]/i.test(literal) ? literal : `${literal}.0`}f`;
}

export function uniqueIdentifiers(names, convert = identifier) {
  const seen = new Map();
  const keywords = new Set('as break class continue do else false for fun if in interface is null object package return super this throw true try typealias typeof val var when while'.split(' '));
  for (const name of names) {
    const id = convert(name);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id) || keywords.has(id) || seen.has(id)) {
      throw new Error(`Invalid/colliding Kotlin identifier: ${name}, ${seen.get(id) ?? id}`);
    }
    seen.set(id, name);
  }
}

export function argb(value, name) {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value);
  if (!match) return fail(name, value);
  return `${match[2] ?? 'ff'}${match[1]}`.toUpperCase();
}

export function dimension(value, name) {
  const match = DIMENSION_RE.exec(value);
  const result = match ? Number(match[1]) * (match[2] === 'rem' ? 16 : 1) : NaN;
  if (!Number.isFinite(result) || result < 0) return fail(name, value);
  return result;
}

export function ratio(value, name) {
  const calc = RATIO_RE.exec(value);
  const result = calc ? Number(calc[1]) / Number(calc[2]) : Number(value);
  if ((!calc && !NUMBER_RE.test(value)) || !Number.isFinite(result) || result <= 0) return fail(name, value);
  return result;
}

const isColor = (name) => name === 'black' || /^(brand-|color-|stone-|teal-|citron-)/.test(name);
export const excluded = (name) => /^z-/.test(name) || name === 'color-scrollbar-thumb' || /^shadow-/.test(name);

// One policy per source name. Unknown additions fail rather than silently disappearing.
export function classify(name) {
  if (excluded(name)) return 'unsupported';
  if (isColor(name)) return 'color';
  if (name.startsWith('radius-')) return 'Radius';
  if (name.startsWith('space-')) return 'Space';
  if (/^(control|glyph)-/.test(name)) return 'Size';
  if (/^(focus-ring-(width|offset)|border-hairline)$/.test(name)) return 'Stroke';
  if (name.startsWith('speed-')) return 'Duration';
  if (name.startsWith('ease-')) return 'Easing';
  if (/^font-(sans|serif|mono|code)$/.test(name) || /^font-heading-.*-family$/.test(name)) return 'FontFamilies';
  if (name.startsWith('font-')) return 'Type';
  throw new Error(`No Android adaptation policy for ${name}`);
}

function primitive(name, value, category) {
  const id = identifier(name);
  if (['Radius', 'Space', 'Size', 'Stroke'].includes(category)) return `val ${id}: Dp = ${float(dimension(value, name))}.dp`;
  if (category === 'Duration') {
    const match = DURATION_RE.exec(value);
    const ms = match ? Number(match[1]) * (match[2] === 's' ? 1000 : 1) : NaN;
    if (!Number.isSafeInteger(ms) || ms < 0 || ms > 2147483647) return fail(name, value);
    return `const val ${id}: Int = ${ms}`;
  }
  if (category === 'Easing') {
    const match = /^cubic-bezier\(([^)]+)\)$/.exec(value);
    const parts = match?.[1].split(',').map((v) => v.trim());
    if (!parts || parts.length !== 4 || parts.some((v) => !NUMBER_RE.test(v))) return fail(name, value);
    const values = parts.map(Number);
    if (values[0] < 0 || values[0] > 1 || values[2] < 0 || values[2] > 1) return fail(name, value);
    return `val ${id}: ComposeEasing = CubicBezierEasing(${values.map(float).join(', ')})`;
  }
  if (category === 'FontFamilies') {
    const families = value.split(',').map((v) => v.trim().replace(/^'([^']+)'$/, '$1'));
    if (families.some((v) => !/^[\w -]+$/.test(v))) return fail(name, value);
    return `val ${id}: List<String> = listOf(${families.map((v) => JSON.stringify(v)).join(', ')})`;
  }
  if (/^font-size-|^font-heading-.*-size$/.test(name)) return `val ${id}: TextUnit = ${float(dimension(value, name))}.sp`;
  if (name.includes('line-height')) return `const val ${id}: Float = ${float(ratio(value, name))}`;
  if (name.includes('letter-spacing')) {
    const match = TRACKING_RE.exec(value);
    if (!match || (!match[2] && Number(match[1]) !== 0)) return fail(name, value);
    return `val ${id}: TextUnit = ${float(Number(match[1]))}.em`;
  }
  if (/weight/.test(name)) {
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 1000) return fail(name, value);
    return `val ${id}: FontWeight = FontWeight(${Number(value)})`;
  }
  return fail(name, value);
}

export function emitTokens(data, resolved) {
  const names = Object.keys(data.applicability).sort();
  uniqueIdentifiers(names);
  for (const name of names) {
    const category = classify(name);
    if (data.applicability[name] === 'cross-platform' && category === 'unsupported') throw new Error(`Unexported cross-platform token ${name}`);
    if (category !== 'color' && category !== 'unsupported' && name in data.themes.light) throw new Error(`Themed native primitive needs a policy: ${name}`);
    if (category === 'FontFamilies' && name.startsWith('font-heading-') &&
        !['font-sans', 'font-serif', 'font-mono', 'font-code'].some((family) => resolved.base[name] === resolved.base[family])) {
      throw new Error(`Android heading family needs an injected font slot: ${name}`);
    }
  }
  const baseColors = names.filter((name) => classify(name) === 'color' && name in data.tokens);
  const themeColors = names.filter((name) => classify(name) === 'color' && name in data.themes.light);
  const header = `// GENERATED from tokens/tokens.json v${data.meta.version}; DO NOT EDIT.\npackage com.tiptreesystems.designsystem\n`;
  const tokens = [header,
    'import androidx.compose.animation.core.CubicBezierEasing',
    'import androidx.compose.animation.core.Easing as ComposeEasing',
    'import androidx.compose.ui.graphics.Color',
    'import androidx.compose.ui.text.font.FontWeight',
    'import androidx.compose.ui.unit.*', '',
    'object TiptreeTokens {', `    const val sourceVersion: String = "${data.meta.version}"`,
    '    object Colors {',
    ...baseColors.map((name) => `        val ${identifier(name)}: Color = Color(0x${argb(resolved.base[name], name)})`),
    '    }',
  ];
  for (const category of ['Radius', 'Space', 'Size', 'Stroke', 'Duration', 'Easing', 'FontFamilies', 'Type']) {
    tokens.push(`    object ${category} {`);
    for (const name of names.filter((name) => classify(name) === category)) tokens.push(`        ${primitive(name, resolved.base[name], category)}`);
    tokens.push('    }');
  }
  tokens.push('}', '');
  const colors = [header, 'import androidx.compose.runtime.Immutable', 'import androidx.compose.ui.graphics.Color', '',
    '@Immutable', 'class TiptreeColors internal constructor(',
    ...themeColors.map((name) => `    val ${identifier(name)}: Color,`),
    ') {', '    companion object {',
  ];
  for (const theme of ['light', 'dark']) {
    colors.push(`        val ${theme}: TiptreeColors = TiptreeColors(`);
    for (const name of themeColors) colors.push(`            ${identifier(name)} = Color(0x${argb(resolved.themes[theme][name], name)}),`);
    colors.push('        )');
  }
  colors.push('    }', '}', '');
  const xml = (theme) => ['<?xml version="1.0" encoding="utf-8"?>', '<!-- GENERATED; DO NOT EDIT. -->', '<resources>',
    ...[...baseColors, ...themeColors].map((name) => `    <color name="tt_${name.replaceAll('-', '_')}">#${argb(resolved.themes[theme][name] ?? resolved.base[name], name)}</color>`), '</resources>', ''].join('\n');
  return { tokens: tokens.join('\n'), colors: colors.join('\n'), lightXml: xml('light'), darkXml: xml('dark') };
}
