/**
 * The one host permission, `https://flashcards.gg/*`. Chrome and Edge grant it
 * at install for good. Firefox (127+) grants it at install too, but the user
 * can revoke it in about:addons, so Firefox asks again when it is needed.
 *
 * Call this synchronously, as the first thing in a user-action handler (a
 * context-menu click, a button click): Firefox drops the user-action status
 * at the first `await`, and `permissions.request` then throws. When the
 * permission is already there, Firefox resolves `true` without a prompt.
 */
declare const __BROWSER__: string;

export const HOST_ORIGINS = ['https://flashcards.gg/*'];

export function requestHostPermission(): Promise<boolean> {
  if (__BROWSER__ !== 'firefox') return Promise.resolve(true);
  return chrome.permissions.request({ origins: HOST_ORIGINS }).catch(() => false);
}
