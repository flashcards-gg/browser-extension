# Security

## Reporting a vulnerability

If you think you have found a security issue in the Flashcards.gg browser extension, API, apps or website, please email **support@flashcards.gg** rather than opening a public issue. Include the steps to reproduce and, if you have one, the time of the request. We will get back to you as soon as we can.

## If an API key leaked

Revoke it at https://flashcards.gg/account/api-keys and create a new one. Keys are stored as a hash, the full value is shown only once at creation, and a revoked key stops working right away.

Keys start with `flc_`, so secret scanners can be configured to match `flc_[0-9a-f]{32}`.
