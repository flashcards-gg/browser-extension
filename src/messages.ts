/** Content script ↔ background messages. */
import type { AddCardResult, CompleteResult, SetSummary } from './api';

export type ToBackground =
  | { type: 'sets'; refresh?: boolean }
  | { type: 'createSet'; name: string }
  | { type: 'addCard'; setId: string; key: string; value: string; dedupe: boolean }
  | { type: 'completeCard'; setId: string; key: string; backDescription?: string }
  | { type: 'lastSet' }
  | { type: 'rememberSet'; setId: string }
  | { type: 'openOptions' }
  | { type: 'openSet'; setId: string };

export type Failure = {
  ok: false;
  error: 'auth' | 'rate' | 'network' | 'notFound' | 'validation' | 'conflict' | 'unprocessable' | 'server' | 'nokey';
};

export type FromBackground =
  | ({ ok: true; sets: SetSummary[]; lastSetId: string | null } | Failure)
  | ({ ok: true; set: SetSummary } | Failure)
  | ({ ok: true; result: AddCardResult } | Failure)
  | ({ ok: true; completion: CompleteResult } | Failure)
  | { ok: true };

/** Background → content: open the overlay for this selection. */
export interface OpenOverlay {
  type: 'open';
  text: string;
  /** No API key yet: show the connect prompt instead of the form. */
  nokey: boolean;
}

export const APP_SET_URL = (setId: string) => `https://flashcards.gg/app/#/set/${encodeURIComponent(setId)}`;
export const API_KEYS_URL = 'https://flashcards.gg/account/api-keys';
export const PRIVACY_URL = 'https://flashcards.gg/privacy';
