// Builds dist/<browser>/ for chrome, edge and firefox from one source tree.
// One codebase, one manifest template; the per-browser differences are the
// background declaration (service worker vs. event page scripts) and the
// Firefox add-on id. Usage: node scripts/build.mjs [chrome|edge|firefox|all]
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const targets = ['chrome', 'edge', 'firefox'];
const want = process.argv[2] && process.argv[2] !== 'all' ? [process.argv[2]] : targets;
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const template = JSON.parse(readFileSync('manifest.template.json', 'utf8'));

for (const browser of want) {
  if (!targets.includes(browser)) throw new Error(`unknown target ${browser}`);
  const out = join('dist', browser);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  await build({
    entryPoints: {
      background: 'src/background.ts',
      content: 'src/content.ts',
      options: 'src/options.ts',
    },
    bundle: true,
    format: 'iife',
    target: ['chrome120', 'firefox140'],
    outdir: out,
    minify: false,
    sourcemap: false,
    define: { __VERSION__: JSON.stringify(pkg.version), __BROWSER__: JSON.stringify(browser) },
    logLevel: 'error',
  });

  const manifest = structuredClone(template);
  manifest.version = pkg.version;
  if (browser === 'firefox') {
    // Firefox runs MV3 background as an event page, not a service worker.
    manifest.background = { scripts: ['background.js'] };
    manifest.browser_specific_settings = {
      gecko: {
        id: 'browser-extension@flashcards.gg',
        // 140 = the first version with the built-in data-collection consent
        // below (and the current ESR); host permissions are granted at install
        // since 127.
        strict_min_version: '140.0',
        // Shown in Firefox's install prompt; mandatory on AMO for new add-ons.
        // Same disclosure as the Chrome Web Store privacy tab: the selected
        // text (website content) and the user's API key (authentication info)
        // go to flashcards.gg, only when the user saves or tests the key.
        data_collection_permissions: { required: ['websiteContent', 'authenticationInfo'] },
      },
    };
  }
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  cpSync('icons', join(out, 'icons'), { recursive: true });
  cpSync('_locales', join(out, '_locales'), { recursive: true });
  cpSync('src/options.html', join(out, 'options.html'));
  if (existsSync('src/options.css')) cpSync('src/options.css', join(out, 'options.css'));
  console.log(`built dist/${browser} (v${pkg.version})`);
}
