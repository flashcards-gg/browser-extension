/** Thin wrapper: `t('savedTo', name)`; falls back to the key so a missing
 *  message never blanks the UI. */
export function t(key: string, ...subs: string[]): string {
  try {
    const s = chrome.i18n.getMessage(key, subs);
    return s || key;
  } catch {
    return key;
  }
}
