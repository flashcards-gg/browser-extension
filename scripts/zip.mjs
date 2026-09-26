// Zips dist/<browser>/ into dist/flashcards-gg-<browser>-<version>.zip for
// the stores and the GitHub release. Uses the system `zip` (macOS / Linux CI).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const browser of ['chrome', 'edge', 'firefox']) {
  if (!existsSync(`dist/${browser}/manifest.json`)) continue;
  const zip = `flashcards-gg-${browser}-${pkg.version}.zip`;
  execFileSync('zip', ['-qr', `../${zip}`, '.'], { cwd: `dist/${browser}` });
  console.log(`dist/${zip}`);
}
