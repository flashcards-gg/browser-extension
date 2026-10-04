# Changelog

## 0.2.0 — Safari

- Safari on the Mac: `npm run build:safari` builds `dist/safari`, and `safari/` holds the container app *Flashcards.gg for Safari* (Xcode project, macOS 12+, 30 languages) for the Mac App Store; `safari/build-safari.sh` makes the store package.
- Safari: the extension asks Safari for access to flashcards.gg on first use (Safari does not grant host permissions at install, and without them it blocks the API calls as cross-origin).
- The right-click item is also created at every browser start, not only at install (Safari can drop it on restart).
- Dev builds: `FCGG_API_BASE=http://localhost:<port>` points a build at a local server; `npm run zip` and `build-safari.sh` refuse such a build.

## 0.1.1 — Edge Add-ons and Firefox Add-ons

- Firefox: the manifest declares the data it sends (`data_collection_permissions`: website content, authentication information), shown in Firefox's install prompt; minimum Firefox 140.
- Firefox: if the `flashcards.gg` permission was revoked in `about:addons`, the menu item and "Test connection" ask for it again instead of failing with a network error (the request now runs before any `await`, inside the click).
- The options page's privacy line now says the text is sent on Save **or Auto**.
- Hungarian, Romanian and Vietnamese: Save, Cancel and the Front/Back labels had lost their diacritics.
- `npm run zip` also packs the source for addons.mozilla.org review.

## 0.1.0 — Chrome Web Store

- First version: "Add to Flashcards.gg" on selected text, an in-page form with the last-used set, a back to type, duplicate detection through the API's `dedupe` flag, an Auto button that writes the back with AI (`cards/complete`), an options page for the personal API key. Chrome, Edge and Firefox from one codebase.
