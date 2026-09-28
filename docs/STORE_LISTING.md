# Store listings — Flashcards.gg browser extension

| Store | Package | Status |
|---|---|---|
| Chrome Web Store | `dist/flashcards-gg-chrome-<version>.zip` | 0.1.0 submitted for review on 2026-09-28 (item id `lcbjiemkiefhbjfklbfcndnlindaafek`) |
| Microsoft Edge Add-ons | `dist/flashcards-gg-edge-<version>.zip` (same files as Chrome) | 0.1.1 prepared, not submitted |
| Firefox Add-ons (AMO) | `dist/flashcards-gg-firefox-<version>.zip` + `dist/flashcards-gg-source-<version>.zip` | 0.1.1 submitted for review on 2026-09-28 through the API (add-on id 3081124, https://addons.mozilla.org/firefox/addon/flashcards-gg/) |

All packages come from `npm run build && npm run zip`. The manifest carries the localized name
and short description for 30 languages (`_locales/`). Store screenshots: English or Spanish
content only.

## Shared texts

- **Name:** Flashcards.gg
- **Short description (manifest, 30 languages):** Add a card from selected text to your Flashcards.gg sets.
- **Summary (≤132 chars, Chrome):** Turn selected text into a flashcard: right-click, choose “Add to Flashcards.gg”, type the back or let the AI fill it.
- **Detailed description (English):**

  Add cards to your Flashcards.gg sets without leaving the page you are reading.

  Select a word or a phrase, right-click and choose “Add to Flashcards.gg”. A small form opens right on the page: the selection is already the front and the set is the one you used last. Type the back, or press Auto to have it written for you, then save. The card appears in your set on every device where you use Flashcards.gg.

  The extension talks only to flashcards.gg: the selected text is sent there when you press Save or Auto, and your API key is stored only in this browser. No analytics.

  You need a Flashcards.gg account and a personal API key, which you create in your account at https://flashcards.gg/account/api-keys.

  Open source: https://github.com/flashcards-gg/browser-extension

- **Single purpose:** Save selected text from the current page as a flashcard in the user's Flashcards.gg account.
- **Permission justifications:**
  - `contextMenus` — adds the “Add to Flashcards.gg” item to the right-click menu on selected text; that item is the only entry point.
  - `activeTab` + `scripting` — after the user clicks the menu item, injects the small in-page form into the current tab to show the selection and take the back side. No page is touched before that click.
  - `storage` — keeps the user's API key, the id of the last-used set and a short-lived cache of set names in extension storage on this device.
  - Host permission `https://flashcards.gg/*` — the only server the extension talks to: lists the user's sets, creates the card and asks for an AI-written back (Auto) through the public API.
- **Remote code:** none. All code ships in the package.
- **Data disclosures:**
  - Authentication information: the API key the user enters, stored locally, sent to flashcards.gg with each request.
  - Website content: the text the user selected, sent to flashcards.gg when the user presses Save or Auto.
  - Not collected: personal communications, location, web history, user activity, financial or health information.
  - Not sold, not used for anything but the single purpose, not used for creditworthiness.
- **Privacy policy:** https://github.com/flashcards-gg/browser-extension/blob/main/docs/PRIVACY.md
- **Homepage:** https://flashcards.gg · **Support:** https://flashcards.gg/support, support@flashcards.gg
- **Reviewer notes** (Edge “Notes for certification”, AMO “Notes to Reviewer”; the test account is a dedicated one with a couple of sample sets, never a personal account):

  ```text
  The extension needs a Flashcards.gg account and a personal API key.
  Test account: <email> / <password> (sign in at https://flashcards.gg/app/)
  API key for that account: <flc_…> (paste it in the extension's options page)

  To test: open any article, select a word, right-click → "Add to Flashcards.gg".
  The form opens on the page with the selection as the front; type a back or press
  Auto (AI-written back), choose a set and Save. The options page (toolbar icon)
  holds the key and has "Test connection".

  The extension talks only to https://flashcards.gg (public API documented at
  https://github.com/flashcards-gg/api). No analytics, no remote code.
  Source: https://github.com/flashcards-gg/browser-extension
  ```

  AMO only, append: `The package is bundled with esbuild (not minified). The source package is attached; README.md → "Reproducing a store build" gives the three commands (Node 22, npm ci, npm run build:firefox) that rebuild dist/firefox identical to the upload.`

## Chrome Web Store

- **Category:** Education · **Language:** English
- **Icon:** `icons/icon-128.png`
- **Screenshots (1280×800, 24-bit PNG, no alpha):** `docs/store/1-context-menu.png`, `2-in-page-form.png`, `3-options.png`, taken in Chrome with `dist/chrome` loaded unpacked.
- **To correct in the dashboard:** the description and the *Website content* disclosure submitted with 0.1.0 say the text is sent “only when the user presses Save”; Auto sends it too. Use the texts above (Store listing and Privacy tabs; no new package needed).
- Later releases: tag `v<version>` in this repo — `.github/workflows/release.yml` builds the zips and, once the Web Store API secrets exist in the repo, uploads the Chrome package as a draft.

## Microsoft Edge Add-ons (Partner Center)

1. Partner Center → **Edge** workspace. The Edge program needs its own (free) registration, even with a Partner Center account for the Microsoft Store.
2. **Create new extension** → upload `dist/flashcards-gg-edge-0.1.1.zip`.
3. **Availability:** Public, all markets.
4. **Properties:** Category Education (Productivity if Education is not offered); Website https://flashcards.gg; Support https://flashcards.gg/support; Mature content: no.
5. **Privacy:** single purpose, permission justifications, remote code “No”, data usage (Authentication information, Website content) and the certifications from *Shared texts*; Privacy policy URL as above.
6. **Store listings:** Partner Center creates one row per package language (30) and wants a **Description** (250–10,000 characters) and the **Extension logo** in each. Descriptions: `docs/store/EDGE_DESCRIPTIONS.md` (hand-written, every language). Logo: `docs/store/edge-logo-300.png` → *Duplicate this logo for all languages*. Screenshots (optional, 640×480 or 1280×800, up to 6): `docs/store/edge/1-context-menu.png`, `2-in-page-form.png`, `3-saved.png`, `4-options.png` — Edge 153 on Windows 11, 1280×800 RGB, sample sets. Search terms (≤7, ≤30 chars each): `flashcards`, `flash cards`, `vocabulary`, `study`, `language learning`, `memorize`.
7. **Publish** → *Notes for certification* from *Shared texts*. Certification takes up to seven business days.

Updates later: the Edge Add-ons API can upload a new package from CI (API key from Partner Center → Publish API); not wired up yet.

## Firefox Add-ons (addons.mozilla.org)

How 0.1.1 went in (2026-09-28): AMO API credentials (JWT issuer/secret from
https://addons.mozilla.org/developers/addon/api/key/) in the gitignored `.env`, then
`web-ext sign --channel listed --amo-metadata <json> --upload-source-code dist/flashcards-gg-source-<v>.zip --approval-timeout 0`
(the metadata JSON carries every field below), then the privacy policy through
`PATCH /api/v5/addons/addon/flashcards-gg/eula_policy/` and the screenshots through
`POST /api/v5/addons/addon/flashcards-gg/previews/` (AMO throttles after two uploads in a row). The same
fields by hand in the Developer Hub:

1. https://addons.mozilla.org/developers/ → **Submit a New Add-on** → *On this site* (listed).
2. Upload `dist/flashcards-gg-firefox-0.1.1.zip`. Platforms: **Firefox only** — Firefox for Android has no context-menu API for extensions.
3. **Source code:** Yes → upload `dist/flashcards-gg-source-0.1.1.zip` (esbuild bundles the TypeScript).
4. **Describe add-on:**
   - Name / summary: from the manifest (Flashcards.gg / “Add a card from selected text to your Flashcards.gg sets.”)
   - Add-on URL: `flashcards-gg`
   - Description: the English detailed description above
   - Category: Language Support (AMO does not allow “Other” together with another category)
   - Experimental: no · Requires payment / non-free services: no (a Flashcards.gg account is needed, which the description says)
   - Support email support@flashcards.gg · Support website https://flashcards.gg/support · Homepage https://flashcards.gg
   - License: MIT
   - Privacy policy: paste the text of `docs/PRIVACY.md` (AMO takes the text, not a link)
   - Notes to Reviewer: from *Shared texts*, plus the AMO line
5. Screenshots (after submission, *Edit Product Page → Images*): `docs/store/firefox/1-context-menu.png`, `2-in-page-form.png`, `3-saved.png` — Firefox 156 on Linux, full screen, 1280×800. The sets shown are sample data.

The data the extension sends is declared in the Firefox manifest (`data_collection_permissions`: `websiteContent`, `authenticationInfo`) and appears in Firefox's install prompt and on the listing; it must stay consistent with the privacy policy. Updates later: `web-ext sign --channel=listed` with AMO API credentials can submit new versions from CI; not wired up yet.
