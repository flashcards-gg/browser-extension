# Privacy — Flashcards.gg browser extension

**What the extension does.** It adds "Add to Flashcards.gg" to the right-click menu on selected text. When you use it, a small form opens on the page with the selected text as the front of a new card. Nothing happens until you press Save.

**What leaves your browser, and when.**

- When you press **Save**: the front (the selected text, edited or not), the back you typed, and the set you chose are sent to `https://flashcards.gg` over HTTPS, using your own API key, to create the card in your account.
- When the form opens or you test the key in the options page: a request for the list of your sets is sent to `https://flashcards.gg` with your API key.
- Nothing else is sent. The extension has no analytics, no telemetry and no third-party services. It does not read pages you visit; it only receives the text you selected when you choose the menu item.

**What is stored in your browser.** Your API key, the id of the set you used last and a short-lived cache of your set names, in the browser's extension storage on this device only. They are not synced to other devices and are removed when you remove the key in the options page or uninstall the extension.

**Your API key.** You create it at https://flashcards.gg/account/api-keys and can revoke it there at any time. It can create and edit sets in your account, so keep it private.

**Permissions.** `contextMenus` (the menu item), `storage` (the key and settings), `scripting` and `activeTab` (to show the form on the page you clicked in), and a host permission for `https://flashcards.gg` only (the API calls).

**The service.** The Flashcards.gg service's own privacy policy applies to the data in your account: https://flashcards.gg/privacy. Questions: support@flashcards.gg.
