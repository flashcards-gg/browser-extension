/**
 * Service worker (Chrome/Edge) / event page (Firefox): owns the context-menu
 * item, injects the overlay on click, and makes every API call (the content
 * script never touches the network or the key).
 */
import { ApiError, createClient, type ApiClient } from './api';
import { t } from './i18n';
import {
  APP_SET_URL,
  type Failure,
  type OpenOverlay,
  type ToBackground,
} from './messages';
import { requestHostPermission } from './permissions';
import {
  SETS_CACHE_MS,
  getApiKey,
  getLastSetId,
  getSetsCache,
  setLastSetId,
  setSetsCache,
} from './storage';

declare const __VERSION__: string;

const MENU_ID = 'flashcards-gg-add';

function client(apiKey: string): ApiClient {
  return createClient({ apiKey, clientId: `browser-extension/${__VERSION__}` });
}

// ── menu ─────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: t('menuAdd'),
      contexts: ['selection'],
    });
  });
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  const text = (info.selectionText ?? '').trim();
  if (!text) return;
  // Before any await: Firefox only honours the request inside the click.
  const permitted = requestHostPermission();
  void openOverlay(tab.id, text, permitted);
});

async function openOverlay(tabId: number, text: string, permitted: Promise<boolean>): Promise<void> {
  // Refused: carry on; the overlay's API calls then fail as a network error.
  await permitted;
  const nokey = (await getApiKey()) === null;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch {
    // Pages we cannot script (chrome://, the Web Store, PDF viewers): nothing
    // to show there; the options page still works from the toolbar icon.
    return;
  }
  const msg: OpenOverlay = { type: 'open', text, nokey };
  await chrome.tabs.sendMessage(tabId, msg);
}

// ── API on behalf of the overlay ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((raw: ToBackground, _sender, sendResponse) => {
  void handle(raw).then(sendResponse, (e) => sendResponse(failure(e)));
  return true; // async response
});

function failure(e: unknown): Failure {
  if (e instanceof ApiError) return { ok: false, error: e.kind };
  return { ok: false, error: 'server' };
}

async function handle(msg: ToBackground): Promise<unknown> {
  switch (msg.type) {
    case 'openOptions':
      await chrome.runtime.openOptionsPage();
      return { ok: true };
    case 'openSet':
      await chrome.tabs.create({ url: APP_SET_URL(msg.setId) });
      return { ok: true };
    case 'lastSet':
      return { ok: true, sets: [], lastSetId: await getLastSetId() };
    case 'rememberSet':
      await setLastSetId(msg.setId);
      return { ok: true };
  }
  const key = await getApiKey();
  if (!key) return { ok: false, error: 'nokey' } satisfies Failure;
  const api = client(key);
  switch (msg.type) {
    case 'sets': {
      const cached = msg.refresh ? null : await getSetsCache();
      const fresh = cached && Date.now() - cached.at < SETS_CACHE_MS;
      const sets = fresh ? cached.sets : await api.listSets();
      if (!fresh) await setSetsCache(sets);
      return { ok: true, sets, lastSetId: await getLastSetId() };
    }
    case 'createSet': {
      // createSet is 409 `name_taken` on a duplicate name: try "Name 2",
      // "Name 3", … before giving up.
      let set;
      for (let n = 1; ; n++) {
        try {
          set = await api.createSet(n === 1 ? msg.name : `${msg.name} ${n}`);
          break;
        } catch (e) {
          if (e instanceof ApiError && e.kind === 'conflict' && n < 6) continue;
          throw e;
        }
      }
      const cached = await getSetsCache();
      await setSetsCache([set, ...(cached?.sets ?? [])]);
      return { ok: true, set };
    }
    case 'completeCard': {
      const completion = await api.completeCard(msg.setId, msg.key, msg.backDescription);
      return { ok: true, completion };
    }
    case 'addCard': {
      const result = await api.addCard(msg.setId, msg.key, msg.value, msg.dedupe);
      if (result.status === 'created') {
        await setLastSetId(msg.setId);
        // Keep the cached card count honest for the next overlay.
        const cached = await getSetsCache();
        if (cached) {
          await setSetsCache(
            cached.sets.map((s) => (s.id === msg.setId ? { ...s, cardCount: s.cardCount + 1 } : s)),
          );
        }
      }
      return { ok: true, result };
    }
  }
  return { ok: false, error: 'server' } satisfies Failure;
}
