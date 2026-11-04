import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

// Both native packages commit generated code and notices. Check the complete
// directory before rebuilding so stale or unexpected files cannot be hidden.
export function checkGenerated(directory, files, label) {
  const actual = [];
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child);
      else actual.push(relative(directory, child));
    }
  };
  if (existsSync(directory)) walk(directory);
  if (actual.sort().join('\n') !== [...files.keys()].sort().join('\n')) throw new Error(`Missing/extra generated ${label} files; run npm run build`);
  for (const [path, expected] of files) {
    if (readFileSync(join(directory, path), 'utf8') !== expected) throw new Error(`Stale generated ${label} file ${path}; run npm run build`);
  }
}

export function writeGenerated(directory, files) {
  // Callers construct/validate the entire map before replacing the directory.
  rmSync(directory, { recursive: true, force: true });
  for (const [path, content] of files) {
    const destination = join(directory, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  }
}
