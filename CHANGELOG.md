# Changelog

## 0.1.1 — Edge Add-ons and Firefox Add-ons

- Firefox: the manifest declares the data it sends (`data_collection_permissions`: website content, authentication information), shown in Firefox's install prompt; minimum Firefox 140.
- Firefox: if the `flashcards.gg` permission was revoked in `about:addons`, the menu item and "Test connection" ask for it again instead of failing with a network error (the request now runs before any `await`, inside the click).
- The options page's privacy line now says the text is sent on Save **or Auto**.
- Hungarian, Romanian and Vietnamese: Save, Cancel and the Front/Back labels had lost their diacritics.
- `npm run zip` also packs the source for addons.mozilla.org review.

## 0.1.0 — Chrome Web Store

- First version: "Add to Flashcards.gg" on selected text, an in-page form with the last-used set, a back to type, duplicate detection through the API's `dedupe` flag, an Auto button that writes the back with AI (`cards/complete`), an options page for the personal API key. Chrome, Edge and Firefox from one codebase.
