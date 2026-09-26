/**
 * Text rules shared with the app's quick-add form (feature 22): one card
 * front from a selection, and the duplicate rule the server applies with
 * `dedupe: true`. Keep in step with `QuickAddService` in the Flutter app and
 * `normalizeFront` on the server.
 */

/** Front-side cap: longer text is unusable on a card anyway. */
export const MAX_FRONT_CHARS = 500;

/** Card fields the API accepts. */
export const MAX_FIELD_CHARS = 2000;

/** Over this, or two or more sentences, the selection is "long". */
export const LONG_TEXT_CHARS = 120;

/** Trim and collapse runs of whitespace (newlines included) to one space. */
export function normalize(text: string, cap?: number): string {
  let s = text.replace(/\s+/g, ' ').trim();
  if (cap !== undefined && s.length > cap) s = s.slice(0, cap).trimEnd();
  return s;
}

/** The card front for a selection. */
export function frontFrom(text: string): string {
  return normalize(text, MAX_FRONT_CHARS);
}

/** A paragraph rather than a word. */
export function isLong(text: string): boolean {
  const s = normalize(text);
  if (s.length > LONG_TEXT_CHARS) return true;
  return /[.!?…]\s+\S/.test(s);
}

/** Duplicate rule: fronts match after trim + lower-case (accents preserved). */
export function sameFront(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
