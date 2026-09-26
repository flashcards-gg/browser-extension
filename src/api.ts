/**
 * The four public API calls the extension makes, typed from
 * https://github.com/flashcards-gg/api (openapi.json). Every request carries
 * the user's personal key and `X-Client` for usage attribution. Runs in the
 * background service worker only: extension-origin fetches with a host
 * permission are CORS-exempt there, while a content-script fetch would be
 * blocked by the page's origin.
 */

export const BASE_URL = 'https://flashcards.gg';

export interface SetSummary {
  id: string;
  name: string;
  cardCount: number;
  updatedAt: string;
}

export interface Card {
  id: string;
  key: string;
  value: string;
}

export type AddCardResult =
  | { status: 'created'; card: Card }
  | { status: 'duplicate'; card: Card };

export type CompleteResult =
  | { status: 'ok'; value: string; backDescription: string }
  | { status: 'needsDescription' }
  | { status: 'limit'; resetAt: number };

export class ApiError extends Error {
  /** For `ai_fill_daily_limit`: when the bucket resets (UTC epoch ms). */
  resetAt: number | null = null;
  constructor(
    readonly kind: 'auth' | 'rate' | 'network' | 'notFound' | 'validation' | 'conflict' | 'unprocessable' | 'server',
    readonly httpStatus: number | null,
    message: string,
  ) {
    super(message);
  }
}

export interface ApiClient {
  listSets(): Promise<SetSummary[]>;
  createSet(name: string): Promise<SetSummary>;
  addCard(setId: string, key: string, value: string, dedupe: boolean): Promise<AddCardResult>;
  /** AI back for a front (the app's Auto). Nothing is stored server-side. */
  completeCard(setId: string, key: string, backDescription?: string): Promise<CompleteResult>;
}

export interface ClientOptions {
  apiKey: string;
  /** e.g. `browser-extension/1.2.0` */
  clientId: string;
  fetchFn?: typeof fetch;
  baseUrl?: string;
}

export function createClient(o: ClientOptions): ApiClient {
  const fetchFn = o.fetchFn ?? fetch;
  const base = o.baseUrl ?? BASE_URL;

  async function call<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
    let res: Response;
    try {
      res = await fetchFn(base + path, {
        method,
        headers: {
          authorization: 'Bearer ' + o.apiKey,
          'x-client': o.clientId,
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError('network', null, e instanceof Error ? e.message : 'network error');
    }
    if (res.status === 401) throw new ApiError('auth', 401, 'unauthorized');
    if (res.status === 429) {
      // Either the per-key rate limit or the daily AI fill bucket; the body
      // tells which (`ai_fill_daily_limit` carries `resetAt`).
      let body: { error?: string; resetAt?: number } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        /* not json */
      }
      const e = new ApiError('rate', 429, body.error ?? 'rate limited');
      e.resetAt = typeof body.resetAt === 'number' ? body.resetAt : null;
      throw e;
    }
    if (res.status === 404) throw new ApiError('notFound', 404, 'not found');
    if (res.status === 409) throw new ApiError('conflict', 409, await safeText(res));
    if (res.status === 422) throw new ApiError('unprocessable', 422, await safeText(res));
    if (res.status === 400) throw new ApiError('validation', 400, await safeText(res));
    if (res.status >= 500) throw new ApiError('server', res.status, await safeText(res));
    const data = (res.status === 204 ? undefined : await res.json()) as T;
    return { status: res.status, data };
  }

  return {
    async listSets() {
      // Paged by cursor (`SetList`: { data, cursor, hasMore }); the overlay's
      // picker shows the first 100, most recently updated first — enough for
      // a select box.
      const { data } = await call<{ data: SetSummary[]; cursor?: string | null }>(
        'GET',
        '/api/v1/sets?limit=100',
      );
      if (!Array.isArray(data?.data)) throw new ApiError('server', 200, 'unexpected list shape');
      return data.data;
    },
    async createSet(name: string) {
      // createSet answers with the full `Set` (cards array), not a summary.
      const { data } = await call<{ id: string; name: string; updatedAt: string; cards?: unknown[] }>(
        'POST',
        '/api/v1/sets',
        { name, cards: [] },
      );
      return {
        id: data.id,
        name: data.name,
        updatedAt: data.updatedAt,
        cardCount: Array.isArray(data.cards) ? data.cards.length : 0,
      };
    },
    async addCard(setId, key, value, dedupe) {
      const { status, data } = await call<Card | { duplicate: true; card: Card }>(
        'POST',
        `/api/v1/sets/${encodeURIComponent(setId)}/cards`,
        { key, value, ...(dedupe ? { dedupe: true } : {}) },
      );
      if (status === 200 && 'duplicate' in data) return { status: 'duplicate', card: data.card };
      return { status: 'created', card: data as Card };
    },
    async completeCard(setId, key, backDescription) {
      try {
        const { data } = await call<{ value: string; backDescription: string }>(
          'POST',
          `/api/v1/sets/${encodeURIComponent(setId)}/cards/complete`,
          { key, ...(backDescription ? { backDescription } : {}) },
        );
        return { status: 'ok', value: data.value, backDescription: data.backDescription };
      } catch (e) {
        if (e instanceof ApiError && e.kind === 'unprocessable') return { status: 'needsDescription' };
        if (e instanceof ApiError && e.kind === 'rate' && e.message === 'ai_fill_daily_limit') {
          return { status: 'limit', resetAt: e.resetAt ?? 0 };
        }
        throw e;
      }
    },
  };
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return '';
  }
}
