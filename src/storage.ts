/**
 * `chrome.storage.local` only — never `storage.sync`: the API key is a
 * full-access secret and must not be replicated across every signed-in
 * browser.
 */
import type { SetSummary } from './api';

const K_KEY = 'apiKey';
const K_LAST_SET = 'lastSetId';
const K_SETS_CACHE = 'setsCache';

/** Sets list cache lifetime. 100 req/min per key is plenty, but the overlay
 *  should open instantly. */
export const SETS_CACHE_MS = 10 * 60 * 1000;

const area = () => chrome.storage.local;

export async function getApiKey(): Promise<string | null> {
  const r = await area().get(K_KEY);
  const v = r[K_KEY];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function setApiKey(key: string | null): Promise<void> {
  if (key === null) {
    await area().remove([K_KEY, K_SETS_CACHE]);
  } else {
    await area().set({ [K_KEY]: key.trim() });
  }
}

export async function getLastSetId(): Promise<string | null> {
  const r = await area().get(K_LAST_SET);
  const v = r[K_LAST_SET];
  return typeof v === 'string' ? v : null;
}

export async function setLastSetId(id: string | null): Promise<void> {
  if (id === null) await area().remove(K_LAST_SET);
  else await area().set({ [K_LAST_SET]: id });
}

export async function getSetsCache(): Promise<{ at: number; sets: SetSummary[] } | null> {
  const r = await area().get(K_SETS_CACHE);
  const v = r[K_SETS_CACHE] as { at: number; sets: SetSummary[] } | undefined;
  return v && Array.isArray(v.sets) && typeof v.at === 'number' ? v : null;
}

export async function setSetsCache(sets: SetSummary[]): Promise<void> {
  await area().set({ [K_SETS_CACHE]: { at: Date.now(), sets } });
}

export async function clearSetsCache(): Promise<void> {
  await area().remove(K_SETS_CACHE);
}
