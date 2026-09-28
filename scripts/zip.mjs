// Zips dist/<browser>/ into dist/flashcards-gg-<browser>-<version>.zip for
// the stores and the GitHub release, plus dist/flashcards-gg-source-<version>.zip
// for addons.mozilla.org, which asks for the source of any bundled add-on.
// Uses the system `zip` (macOS / Linux CI).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const browser of ['chrome', 'edge', 'firefox']) {
  if (!existsSync(`dist/${browser}/manifest.json`)) continue;
  const zip = `flashcards-gg-${browser}-${pkg.version}.zip`;
  rmSync(`dist/${zip}`, { force: true }); // `zip` adds to an existing archive
  execFileSync('zip', ['-qr', `../${zip}`, '.'], { cwd: `dist/${browser}` });
  console.log(`dist/${zip}`);
}

// Every tracked or new, not ignored file: enough to rebuild dist/* with
// `npm ci && npm run build` (README → "Reproducing a store build").
const source = `dist/flashcards-gg-source-${pkg.version}.zip`;
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter((f) => f && existsSync(f));
rmSync(source, { force: true });
execFileSync('zip', ['-q', source, ...files]);
console.log(source);
