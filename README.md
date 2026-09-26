# Flashcards.gg browser extension

Adds **Add to Flashcards** to the right-click menu on selected text in Chrome, Edge and Firefox. The selected word or phrase becomes the front of a new card in one of your [Flashcards.gg](https://flashcards.gg) sets, saved through the public API with your own API key.

**Status: in development.** Not yet published to any extension store; it can be loaded unpacked from a local build (see below).

| | |
|---|---|
| Public API docs and spec | https://github.com/flashcards-gg/api |
| Developer guide on the site | https://flashcards.gg/developers |
| Get an API key | https://flashcards.gg/account/api-keys |

## How it will work

1. Select text on any page, right-click, choose **Add to Flashcards**.
2. A small form opens on the page: the selection is the front, the set is the one you used last, you type the back.
3. Type the back, or press **Auto** to let the AI write it against the set's back description (`POST /api/v1/sets/{id}/cards/complete`, the same daily allowance as the app's Auto).
4. Save. The card is created with `POST /api/v1/sets/{id}/cards` (`dedupe: true`, so a front that already exists in the set is shown instead of duplicated) and reaches your devices through the app's normal sync.

One codebase for Chrome, Edge and Firefox: Manifest V3, with the per-browser manifests generated from a single template.

## Permissions

`contextMenus`, `storage`, `scripting`, `activeTab`, and a host permission for `https://flashcards.gg/*` only. The extension contains no analytics.

## Privacy

The selected text and the back you type are sent to flashcards.gg when you press Save. Your API key is kept in the browser's extension storage on your device. The extension does not send anything else. Full disclosure: [docs/PRIVACY.md](docs/PRIVACY.md). The service's privacy policy is at https://flashcards.gg/privacy.

## Building from source

Node 22 or newer.

```bash
npm ci
npm run build          # dist/chrome, dist/edge, dist/firefox
npm test               # unit tests (vitest)
npm run typecheck
npm run lint           # web-ext lint on dist/firefox (the Firefox-shaped manifest)
npm run zip            # dist/flashcards-gg-<browser>-<version>.zip
```

To try it unpacked: Chrome or Edge → `chrome://extensions` → Developer mode → *Load unpacked* → `dist/chrome` (or `dist/edge`). Firefox → `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → `dist/firefox/manifest.json`. Then open the extension's options, paste an API key, select text on any page and right-click.

The per-browser manifests are generated from `manifest.template.json` by `scripts/build.mjs`; the only differences are the background declaration (service worker vs. event page) and the Firefox add-on id. Firefox treats the `flashcards.gg` host permission as optional and asks for it on first use.

Translations live in `_locales/`. Strings shared with the app are copied from its own translations; the extension-only strings were translated by hand.

## Support

For account or data questions, email support@flashcards.gg. For anything about the extension itself, open an issue in this repository. Please never post a real API key in an issue.

## License

The code in this repository is released under the [MIT License](LICENSE). The Flashcards.gg name, icon and store listings are not covered by that license, and the Flashcards.gg service, apps and API remain proprietary. Use of the API is subject to the [Flashcards.gg terms](https://flashcards.gg/terms).
