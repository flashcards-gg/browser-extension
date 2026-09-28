# Chrome Web Store listing — Flashcards.gg (v0.1.0)

**Status:** submitted for review on 2026-09-28 (item id `lcbjiemkiefhbjfklbfcndnlindaafek`,
publisher flashcards.gg@gmail.com, service account
`cws-publisher@flashcards-gg.iam.gserviceaccount.com` in the flashcards-gg project). The three
screenshots that went up are in `docs/store/`.

Everything the Developer Dashboard asks for, in one place. The package is
`dist/flashcards-gg-chrome-0.1.0.zip` (`npm run zip`). Fields marked *dashboard*
are typed into the store form; the manifest already carries the localized
name and short description for 30 languages (`_locales/`).

## Store listing (dashboard)

- **Name:** Flashcards.gg
- **Summary (≤132 chars):** Turn selected text into a flashcard: right-click, choose “Add to Flashcards.gg”, type the back or let the AI fill it.
- **Category:** Education
- **Language:** English (the manifest supplies name + summary in 30 languages)
- **Detailed description:**

  Add cards to your Flashcards.gg sets without leaving the page you are reading.

  Select a word or a phrase, right-click and choose “Add to Flashcards.gg”. A small form opens right on the page: the selection is already the front, the set is the one you used last, and you type the back or press Auto to have it written for you. Save, and the card is in your set on every device where you use Flashcards.gg.

  How it connects: the extension talks only to flashcards.gg, with a personal API key you create on the Developers page of your account. Nothing is sent until you press Save, and only the card you are saving is sent.

  What it needs: a Flashcards.gg account (sign in on flashcards.gg or in the app) and an API key from https://flashcards.gg/account/api-keys.

  Open source: https://github.com/flashcards-gg/browser-extension

- **Icon:** `icons/icon-128.png`
- **Screenshots (1280×800, 24-bit PNG, no alpha):** `docs/store/1-context-menu.png`, `2-in-page-form.png`, `3-options.png` — the context-menu item on a selected word, the in-page form with an English set and a typed back, the options page in the connected state. Retake in Chrome with the unpacked build loaded (`dist/chrome`); keep every visible set name in English or Spanish.
- **Homepage URL:** https://flashcards.gg
- **Support URL:** https://flashcards.gg/support (or mailto:support@flashcards.gg)

## Privacy practices (dashboard)

- **Single purpose:** Save selected text from the current page as a flashcard in the user's Flashcards.gg account.
- **Privacy policy URL:** https://github.com/flashcards-gg/browser-extension/blob/main/docs/PRIVACY.md
- **Permission justifications:**
  - `contextMenus` — adds the “Add to Flashcards.gg” item to the right-click menu on selected text; that item is the only entry point.
  - `activeTab` + `scripting` — after the user clicks the menu item, injects the small in-page form into the current tab to show the selection and take the back side. No page is touched before that click.
  - `storage` — keeps the user's API key, the id of the last-used set and a short-lived cache of set names in extension storage on this device.
  - Host permission `https://flashcards.gg/*` — the only server the extension talks to: lists the user's sets and creates the card through the public API.
- **Remote code:** none. All code ships in the package.
- **Data usage disclosures:**
  - Authentication information: the API key the user enters, stored locally, sent to flashcards.gg with each request.
  - Website content: the text the user selected, sent to flashcards.gg only when the user presses Save.
  - Not collected: personal communications, location, web history, user activity, financial or health information.
  - Certifications: data is not sold to third parties, not used for purposes unrelated to the single purpose, not used to determine creditworthiness.

## Publishing steps

1. Register a developer account once at https://chrome.google.com/webstore/devconsole (one-time registration fee, the Google account that will own the listing).
2. “New item” → upload `dist/flashcards-gg-chrome-0.1.0.zip`.
3. Fill the store listing and privacy tabs from this file; add the screenshots.
4. Distribution: Public, all regions. Submit for review.
5. Later releases: tag `v<version>` in this repo — `.github/workflows/release.yml` builds the zips and, once the Web Store API secrets exist in the repo, uploads the Chrome package.
