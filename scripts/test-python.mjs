// Run the stdlib Python suite without hiding failures behind a fallback shell expression.
import { spawnSync } from 'node:child_process';

let executable;
for (const candidate of ['python3.12', 'python3']) {
  const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
  if (probe.status === 0) {
    executable = candidate;
    break;
  }
}
if (!executable) {
  console.error('Python 3.11+ is required to run python/tests');
  process.exit(1);
}

const version = spawnSync(executable, ['-c', 'import sys; print(sys.version_info[:2])'], {
  encoding: 'utf8',
});
if (version.status !== 0 || !/^\(3, (?:1[1-9]|[2-9]\d)\)/.test(version.stdout.trim())) {
  console.error(`${executable} is below the required Python 3.11 floor: ${version.stdout.trim()}`);
  process.exit(1);
}

const result = spawnSync(executable, ['-m', 'unittest', 'discover', '-s', 'python/tests'], {
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: 'python' },
});
process.exit(result.status ?? 1);
