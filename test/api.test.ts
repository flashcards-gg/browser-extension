import { describe, expect, it, vi } from 'vitest';
import { ApiError, createClient } from '../src/api';

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
}

describe('api client', () => {
  it('sends the key and X-Client on every call', async () => {
    const f = mockFetch(200, { data: [], cursor: null, hasMore: false });
    const api = createClient({ apiKey: 'flc_x', clientId: 'browser-extension/9.9.9', fetchFn: f as unknown as typeof fetch });
    await api.listSets();
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://flashcards.gg/api/v1/sets?limit=100');
    const h = init.headers as Record<string, string>;
    expect(h.authorization).toBe('Bearer flc_x');
    expect(h['x-client']).toBe('browser-extension/9.9.9');
  });

  it('listSets reads the SetList envelope and createSet maps the full Set to a summary', async () => {
    const list = mockFetch(200, {
      data: [{ id: 'set_1', name: 'Spanish B1', cardCount: 312, updatedAt: '2026-09-26T00:00:00.000Z' }],
      cursor: null,
      hasMore: false,
    });
    let api = createClient({ apiKey: 'k', clientId: 'c', fetchFn: list as unknown as typeof fetch });
    expect(await api.listSets()).toEqual([
      { id: 'set_1', name: 'Spanish B1', cardCount: 312, updatedAt: '2026-09-26T00:00:00.000Z' },
    ]);
    const created = mockFetch(201, { id: 'set_2', name: 'From reading', updatedAt: 'x', cards: [] });
    api = createClient({ apiKey: 'k', clientId: 'c', fetchFn: created as unknown as typeof fetch });
    expect(await api.createSet('From reading')).toEqual({ id: 'set_2', name: 'From reading', updatedAt: 'x', cardCount: 0 });
  });

  it('addCard: 201 → created, 200 duplicate → duplicate with the existing card', async () => {
    const created = mockFetch(201, { id: 'card_1', key: 'hola', value: 'hello' });
    let api = createClient({ apiKey: 'k', clientId: 'c', fetchFn: created as unknown as typeof fetch });
    expect(await api.addCard('set_1', 'hola', 'hello', true)).toEqual({
      status: 'created',
      card: { id: 'card_1', key: 'hola', value: 'hello' },
    });
    const [, init] = created.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ key: 'hola', value: 'hello', dedupe: true });

    const dup = mockFetch(200, { duplicate: true, card: { id: 'card_0', key: 'Hola', value: 'привіт' } });
    api = createClient({ apiKey: 'k', clientId: 'c', fetchFn: dup as unknown as typeof fetch });
    expect(await api.addCard('set_1', 'hola', 'x', true)).toEqual({
      status: 'duplicate',
      card: { id: 'card_0', key: 'Hola', value: 'привіт' },
    });
  });

  it('addCard without dedupe omits the flag', async () => {
    const f = mockFetch(201, { id: 'card_2', key: 'a', value: 'b' });
    const api = createClient({ apiKey: 'k', clientId: 'c', fetchFn: f as unknown as typeof fetch });
    await api.addCard('set_1', 'a', 'b', false);
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ key: 'a', value: 'b' });
  });

  it('maps 401 / 429 / network failures to ApiError kinds', async () => {
    const api401 = createClient({ apiKey: 'k', clientId: 'c', fetchFn: mockFetch(401, {}) as unknown as typeof fetch });
    await expect(api401.listSets()).rejects.toMatchObject({ kind: 'auth' });
    const api429 = createClient({ apiKey: 'k', clientId: 'c', fetchFn: mockFetch(429, {}) as unknown as typeof fetch });
    await expect(api429.listSets()).rejects.toMatchObject({ kind: 'rate' });
    const down = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const apiDown = createClient({ apiKey: 'k', clientId: 'c', fetchFn: down as unknown as typeof fetch });
    await expect(apiDown.listSets()).rejects.toBeInstanceOf(ApiError);
    await expect(apiDown.listSets()).rejects.toMatchObject({ kind: 'network' });
  });
});
