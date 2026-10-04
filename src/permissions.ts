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
import { BASE_URL } from './api';

declare const __BROWSER__: string;

// https://flashcards.gg/* (a dev build: its API host instead, port-less as
// match patterns want).
const api = new URL(BASE_URL);
export const HOST_ORIGINS = [`${api.protocol}//${api.hostname}/*`];

export function requestHostPermission(): Promise<boolean> {
  if (__BROWSER__ !== 'firefox' && __BROWSER__ !== 'safari') return Promise.resolve(true);
  return chrome.permissions.request({ origins: HOST_ORIGINS }).catch(() => false);
}
