/**
 * Options page: paste the personal API key, test it, remove it. The key is
 * stored in `chrome.storage.local` only (never synced) and is never shown in
 * full after saving.
 */
import { ApiError, createClient } from './api';
import { t } from './i18n';
import { requestHostPermission } from './permissions';
import { clearSetsCache, getApiKey, setApiKey, setLastSetId } from './storage';

declare const __VERSION__: string;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((n) => {
    n.textContent = t(n.dataset.i18n!);
  });
  document.title = t('optionsTitle');
}

function status(text: string, kind: 'ok' | 'err' | '' = ''): void {
  const s = $('status');
  s.textContent = text;
  s.className = 'status ' + kind;
}

function looksLikeKey(v: string): boolean {
  return /^flc_[0-9a-f]{32}$/.test(v.trim());
}

async function init(): Promise<void> {
  applyI18n();
  const key = $<HTMLInputElement>('key');
  const existing = await getApiKey();
  if (existing) key.value = existing;

  $('toggle').addEventListener('click', () => {
    key.type = key.type === 'password' ? 'text' : 'password';
  });

  $('save').addEventListener('click', async () => {
    const v = key.value.trim();
    if (!looksLikeKey(v)) {
      status(t('errAuth'), 'err');
      return;
    }
    await setApiKey(v);
    await clearSetsCache();
    status(t('optionsSaved'), 'ok');
  });

  $('test').addEventListener('click', async () => {
    const permitted = requestHostPermission(); // before any await (Firefox)
    const v = key.value.trim();
    if (!looksLikeKey(v)) {
      status(t('errAuth'), 'err');
      return;
    }
    status('…');
    await permitted;
    try {
      const api = createClient({ apiKey: v, clientId: `browser-extension/${__VERSION__}` });
      const sets = await api.listSets();
      status(t('optionsOk', String(sets.length)), 'ok');
    } catch (e) {
      if (e instanceof ApiError) {
        status(t(e.kind === 'auth' ? 'errAuth' : e.kind === 'rate' ? 'errRate' : e.kind === 'network' ? 'errNetwork' : 'errGeneric'), 'err');
      } else {
        status(t('errGeneric'), 'err');
      }
    }
  });

  $('remove').addEventListener('click', async () => {
    await setApiKey(null);
    await setLastSetId(null);
    key.value = '';
    status(t('optionsRemoved'), 'ok');
  });
}

void init();
