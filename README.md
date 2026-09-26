# Flashcards.gg browser extension

Adds **Add to Flashcards** to the right-click menu on selected text in Chrome, Edge and Firefox. The selected word or phrase becomes the front of a new card in one of your [Flashcards.gg](https://flashcards.gg) sets, saved through the public API with your own API key.

**Status: in development.** Not yet published to any extension store.

| | |
|---|---|
| Public API docs and spec | https://github.com/flashcards-gg/api |
| Developer guide on the site | https://flashcards.gg/developers |
| Get an API key | https://flashcards.gg/account/api-keys |

## How it will work

1. Select text on any page, right-click, choose **Add to Flashcards**.
2. A small form opens on the page: the selection is the front, the set is the one you used last, you type the back.
3. Save. The card is created with `POST /api/v1/sets/{id}/cards` and reaches your devices through the app's normal sync.

One codebase for Chrome, Edge and Firefox: Manifest V3, with the per-browser manifests generated from a single template.

## Permissions

`contextMenus`, `storage`, `scripting`, `activeTab`, and a host permission for `https://flashcards.gg/*` only. The extension contains no analytics.

## Privacy

The selected text and the back you type are sent to flashcards.gg when you press Save. Your API key is kept in the browser's extension storage on your device. The extension does not send anything else. The service's privacy policy is at https://flashcards.gg/privacy.

## Building from source

Build instructions will be added with the first release.

## Support

For account or data questions, email support@flashcards.gg. For anything about the extension itself, open an issue in this repository. Please never post a real API key in an issue.

## License

The code in this repository is released under the [MIT License](LICENSE). The Flashcards.gg name, icon and store listings are not covered by that license, and the Flashcards.gg service, apps and API remain proprietary. Use of the API is subject to the [Flashcards.gg terms](https://flashcards.gg/terms).
