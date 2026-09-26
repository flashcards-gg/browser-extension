/**
 * The in-page form (shadow DOM), the desktop twin of the app's quick-add
 * page: front from the selection, the last-used set, a back to type, Save.
 * Injected on demand by the background on a context-menu click; no network
 * and no key here — everything goes through `chrome.runtime.sendMessage`.
 */
import type { AddCardResult, CompleteResult, SetSummary } from './api';
import { t } from './i18n';
import type { Failure, OpenOverlay, ToBackground } from './messages';
import { frontFrom, isLong, sameFront } from './normalize';

declare global {
  interface Window {
    __flashcardsGgOverlay?: boolean;
  }
}

const NEW_SET = '__new__';

if (!window.__flashcardsGgOverlay) {
  window.__flashcardsGgOverlay = true;
  chrome.runtime.onMessage.addListener((msg: OpenOverlay) => {
    if (msg?.type === 'open') open(msg);
  });
}

type State = {
  text: string;
  nokey: boolean;
  sets: SetSummary[];
  setId: string;
  newSetName: string;
  front: string;
  back: string;
  swapped: boolean;
  loading: boolean;
  saving: boolean;
  error: Failure['error'] | null;
  saved: { set: SetSummary; front: string; back: string } | null;
  duplicate: { set: SetSummary; existing: { key: string; value: string } } | null;
  filling: boolean;
  /** The set has no back description: ask once, then retry the fill. */
  askSpec: boolean;
  specDraft: string;
  fillNote: 'limit' | 'failed' | null;
};

let host: HTMLElement | null = null;

function send<T>(msg: ToBackground): Promise<T> {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, (r: T) => resolve(r)));
}

function open(msg: OpenOverlay): void {
  close();
  const state: State = {
    text: msg.text,
    nokey: msg.nokey,
    sets: [],
    setId: '',
    newSetName: '',
    front: frontFrom(msg.text),
    back: '',
    swapped: false,
    loading: !msg.nokey,
    saving: false,
    error: null,
    saved: null,
    duplicate: null,
    filling: false,
    askSpec: false,
    specDraft: '',
    fillNote: null,
  };
  host = document.createElement('div');
  host.id = 'flashcards-gg-overlay';
  host.style.all = 'initial';
  const root = host.attachShadow({ mode: 'open' });
  document.documentElement.appendChild(host);
  render(root, state);
  if (!msg.nokey) void loadSets(root, state);
}

function close(): void {
  host?.remove();
  host = null;
  document.removeEventListener('keydown', onKey, true);
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.stopPropagation();
    close();
  }
}

async function loadSets(root: ShadowRoot, s: State, refresh = false): Promise<void> {
  s.loading = true;
  s.error = null;
  render(root, s);
  const r = await send<{ ok: true; sets: SetSummary[]; lastSetId: string | null } | Failure>({
    type: 'sets',
    refresh,
  });
  if (!r.ok) {
    s.loading = false;
    s.error = r.error;
    if (r.error === 'nokey') s.nokey = true;
    render(root, s);
    return;
  }
  s.sets = r.sets;
  s.loading = false;
  if (r.sets.length === 0) s.setId = NEW_SET;
  else if (r.lastSetId && r.sets.some((x) => x.id === r.lastSetId)) s.setId = r.lastSetId;
  else s.setId = r.sets[0]!.id; // most recently updated first
  render(root, s);
}

async function save(root: ShadowRoot, s: State, dedupe: boolean): Promise<void> {
  const front = s.front.trim();
  const back = s.back.trim();
  if (!front || !back || s.saving) return;
  s.saving = true;
  s.error = null;
  render(root, s);
  let set: SetSummary | undefined = s.sets.find((x) => x.id === s.setId);
  if (s.setId === NEW_SET) {
    const name = s.newSetName.trim() || t('setNameHint');
    const r = await send<{ ok: true; set: SetSummary } | Failure>({ type: 'createSet', name });
    if (!r.ok) {
      s.saving = false;
      s.error = r.error;
      render(root, s);
      return;
    }
    set = r.set;
    s.sets = [r.set, ...s.sets];
    s.setId = r.set.id;
  }
  if (!set) {
    s.saving = false;
    render(root, s);
    return;
  }
  const r = await send<{ ok: true; result: AddCardResult } | Failure>({
    type: 'addCard',
    setId: set.id,
    key: front,
    value: back,
    dedupe,
  });
  s.saving = false;
  if (!r.ok) {
    s.error = r.error;
    render(root, s);
    return;
  }
  if (r.result.status === 'duplicate') {
    s.duplicate = { set, existing: { key: r.result.card.key, value: r.result.card.value } };
  } else {
    s.saved = { set, front, back };
    set.cardCount += 1;
  }
  render(root, s);
}

async function autoFill(root: ShadowRoot, s: State, backDescription?: string): Promise<void> {
  const front = s.front.trim();
  if (!front || s.filling || s.saving || s.loading) return;
  if (s.setId === NEW_SET) {
    // A set that does not exist yet has no description: ask for it, the
    // set is created on Save with the front + the AI back.
    if (!backDescription) {
      s.askSpec = true;
      render(root, s);
      focusFirst(root, 'spec');
      return;
    }
  }
  s.filling = true;
  s.fillNote = null;
  s.error = null;
  render(root, s);
  let setId = s.setId;
  if (setId === NEW_SET) {
    const name = s.newSetName.trim() || t('setNameHint');
    const r = await send<{ ok: true; set: SetSummary } | Failure>({ type: 'createSet', name });
    if (!r.ok) {
      s.filling = false;
      s.error = r.error;
      render(root, s);
      return;
    }
    s.sets = [r.set, ...s.sets];
    s.setId = r.set.id;
    setId = r.set.id;
  }
  const r = await send<{ ok: true; completion: CompleteResult } | Failure>({
    type: 'completeCard',
    setId,
    key: front,
    backDescription,
  });
  s.filling = false;
  if (!r.ok) {
    s.error = r.error;
    render(root, s);
    return;
  }
  const c = r.completion;
  if (c.status === 'needsDescription') {
    s.askSpec = true;
    render(root, s);
    focusFirst(root, 'spec');
    return;
  }
  if (c.status === 'limit') {
    s.fillNote = 'limit';
    render(root, s);
    return;
  }
  if (!c.value.trim()) {
    s.fillNote = 'failed';
    render(root, s);
    return;
  }
  s.askSpec = false;
  await reveal(root, s, c.value.trim());
}

/** Types the answer in word by word — the same beat as the app's Auto. */
async function reveal(root: ShadowRoot, s: State, text: string): Promise<void> {
  const words = text.split(/\s+/);
  let shown = '';
  for (const w of words) {
    if (!host) return;
    shown = shown ? `${shown} ${w}` : w;
    s.back = shown;
    const area = root.getElementById('back') as HTMLTextAreaElement | null;
    if (area) area.value = shown;
    syncSave(root, s);
    await new Promise((r) => setTimeout(r, 42));
  }
}

// ── rendering ────────────────────────────────────────────────────────────────

function render(root: ShadowRoot, s: State): void {
  root.innerHTML = '';
  const style = document.createElement('style');
  style.textContent = CSS;
  root.appendChild(style);
  const card = el('div', 'card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', t('extName'));

  const head = el('div', 'head');
  const title = el('div', 'title', t('extName'));
  const x = button('x', '✕', () => close());
  x.setAttribute('aria-label', t('cancel'));
  head.append(title, x);
  card.appendChild(head);

  if (s.nokey) card.appendChild(viewNoKey());
  else if (s.saved) card.appendChild(viewSaved(root, s));
  else if (s.duplicate) card.appendChild(viewDuplicate(root, s));
  else card.appendChild(viewForm(root, s));

  root.appendChild(card);
  document.addEventListener('keydown', onKey, true);
}

function viewNoKey(): HTMLElement {
  const box = el('div', 'body');
  box.append(
    el('div', 'h', t('noKeyTitle')),
    el('p', 'p', t('noKeyBody')),
    row(
      button('primary', t('openOptions'), () => {
        void send({ type: 'openOptions' });
        close();
      }),
      button('ghost', t('cancel'), () => close()),
    ),
  );
  return box;
}

function viewSaved(root: ShadowRoot, s: State): HTMLElement {
  const saved = s.saved!;
  const box = el('div', 'body');
  const preview = el('div', 'preview');
  preview.append(el('div', 'pf', saved.front), el('div', 'pb', saved.back));
  box.append(
    el('div', 'h ok', t('savedTo', saved.set.name)),
    preview,
    row(
      button('primary', t('addAnother'), () => {
        s.saved = null;
        s.front = '';
        s.back = '';
        s.swapped = false;
        render(root, s);
        focusFirst(root, 'front');
      }),
      button('ghost', t('openInApp'), () => {
        void send({ type: 'openSet', setId: saved.set.id });
        close();
      }),
      button('ghost', t('done'), () => close()),
    ),
  );
  return box;
}

function viewDuplicate(root: ShadowRoot, s: State): HTMLElement {
  const d = s.duplicate!;
  const box = el('div', 'body');
  const note = el('div', 'note warn');
  note.append(
    el('div', 'nh', t('dupTitle', d.set.name)),
    el('div', 'nb', `${t('dupBack')} ${d.existing.value}`),
  );
  box.append(
    note,
    row(
      button('primary', t('addAnyway'), () => {
        s.duplicate = null;
        void save(root, s, false);
      }),
      button('ghost', t('openInApp'), () => {
        void send({ type: 'openSet', setId: d.set.id });
        close();
      }),
      button('ghost', t('done'), () => close()),
    ),
  );
  return box;
}

function viewForm(root: ShadowRoot, s: State): HTMLElement {
  const box = el('div', 'body');

  // set row
  const setRow = el('div', 'setrow');
  const setLabel = el('label', 'lbl', t('set'));
  const select = document.createElement('select');
  select.className = 'select';
  select.id = 'set';
  setLabel.setAttribute('for', 'set');
  if (s.loading) {
    const o = document.createElement('option');
    o.textContent = t('loadingSets');
    select.appendChild(o);
    select.disabled = true;
  } else {
    for (const x of s.sets) {
      const o = document.createElement('option');
      o.value = x.id;
      o.textContent = `${x.name} · ${x.cardCount}`;
      o.selected = x.id === s.setId;
      select.appendChild(o);
    }
    const o = document.createElement('option');
    o.value = NEW_SET;
    o.textContent = t('newSet') + '…';
    o.selected = s.setId === NEW_SET;
    select.appendChild(o);
  }
  select.addEventListener('change', () => {
    s.setId = select.value;
    render(root, s);
    if (s.setId === NEW_SET) focusFirst(root, 'newset');
  });
  setRow.append(setLabel, select);
  box.appendChild(setRow);

  if (s.setId === NEW_SET && !s.loading) {
    const nameIn = input('newset', s.newSetName, t('setNameHint'));
    nameIn.addEventListener('input', () => (s.newSetName = nameIn.value));
    box.appendChild(field(t('newSet'), nameIn));
  }

  if (s.error) box.appendChild(errorNote(root, s));
  if (s.fillNote === 'limit') box.appendChild(note('warn', t('dailyLimitFillTitle')));
  if (s.fillNote === 'failed') box.appendChild(note('err', t('autoFillFailed')));
  if (isLong(s.text)) box.appendChild(el('div', 'hint', t('longHint')));

  const frontIn = textarea('front', s.front, '');
  frontIn.maxLength = 500;
  frontIn.addEventListener('input', () => {
    s.front = frontIn.value;
    syncSave(root, s);
  });
  box.appendChild(field(t('front'), frontIn));

  const swap = button('swap', '⇅ ' + t('swap'), () => {
    const f = s.front;
    s.front = s.back;
    s.back = f;
    s.swapped = !s.swapped;
    render(root, s);
  });
  box.appendChild(swap);

  if (s.askSpec) {
    // "What should each back be?" — asked once per set, then saved on it.
    const specBox = el('div', 'note');
    specBox.appendChild(el('div', 'nh', t('autoSpecPromptTitle')));
    const specIn = input('spec', s.specDraft, t('autoSpecPromptHint'));
    specIn.addEventListener('input', () => (s.specDraft = specIn.value));
    specIn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && s.specDraft.trim()) void autoFill(root, s, s.specDraft.trim());
    });
    specBox.appendChild(specIn);
    specBox.appendChild(
      row(
        button('primary', t('autoSpecUseThis'), () => {
          if (s.specDraft.trim()) void autoFill(root, s, s.specDraft.trim());
        }),
        button('ghost', t('cancel'), () => {
          s.askSpec = false;
          render(root, s);
        }),
      ),
    );
    box.appendChild(specBox);
  }

  const backIn = textarea('back', s.back, s.filling ? t('autoGenerating') : t('backHint'));
  backIn.maxLength = 2000;
  backIn.disabled = s.filling;
  backIn.addEventListener('input', () => {
    s.back = backIn.value;
    syncSave(root, s);
  });
  backIn.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void save(root, s, true);
  });
  const autoPill = button('pill' + (s.filling ? ' on' : ''), '✦ ' + t('autoFillLabel'), () => void autoFill(root, s));
  autoPill.disabled = s.filling || s.loading || !s.front.trim();
  autoPill.title = t('autoFillLabel');
  box.appendChild(field(t('back'), backIn, autoPill));

  const saveBtn = button('primary wide', s.saving ? '…' : t('save'), () => void save(root, s, true));
  saveBtn.id = 'save';
  saveBtn.disabled = !canSave(s);
  box.appendChild(saveBtn);

  queueMicrotask(() => focusFirst(root, s.front.trim() ? 'back' : 'front'));
  return box;
}

function errorNote(root: ShadowRoot, s: State): HTMLElement {
  const map: Record<string, string> = {
    auth: 'errAuth',
    rate: 'errRate',
    network: 'errNetwork',
    notFound: 'errGeneric',
    validation: 'errGeneric',
    conflict: 'errGeneric',
    unprocessable: 'errGeneric',
    server: 'errGeneric',
    nokey: 'noKeyBody',
  };
  const note = el('div', 'note err');
  note.appendChild(el('div', 'nb', t(map[s.error ?? 'server'] ?? 'errGeneric')));
  const actions = row();
  if (s.error === 'auth' || s.error === 'nokey') {
    actions.appendChild(
      button('ghost', t('openOptions'), () => {
        void send({ type: 'openOptions' });
        close();
      }),
    );
  } else if (s.sets.length === 0) {
    actions.appendChild(button('ghost', t('retry'), () => void loadSets(root, s, true)));
  }
  if (actions.childElementCount) note.appendChild(actions);
  return note;
}

function canSave(s: State): boolean {
  return !s.loading && !s.saving && s.front.trim().length > 0 && s.back.trim().length > 0;
}

function syncSave(root: ShadowRoot, s: State): void {
  const b = root.getElementById('save') as HTMLButtonElement | null;
  if (b) b.disabled = !canSave(s);
}

function focusFirst(root: ShadowRoot, id: string): void {
  const n = root.getElementById(id) as HTMLElement | null;
  n?.focus();
}

// ── tiny DOM helpers ─────────────────────────────────────────────────────────

function el(tag: string, cls: string, text?: string): HTMLElement {
  const n = document.createElement(tag);
  n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function row(...children: HTMLElement[]): HTMLElement {
  const r = el('div', 'row');
  r.append(...children);
  return r;
}

function button(cls: string, label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn ' + cls;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function field(label: string, control: HTMLElement, trailing?: HTMLElement): HTMLElement {
  const f = el('div', 'field');
  const l = el('label', 'lbl', label);
  l.setAttribute('for', control.id);
  if (trailing) {
    const head = el('div', 'fhead');
    head.append(l, trailing);
    f.append(head, control);
  } else {
    f.append(l, control);
  }
  return f;
}

function note(tone: 'warn' | 'err' | '', text: string): HTMLElement {
  const n = el('div', 'note ' + tone);
  n.appendChild(el('div', 'nb', text));
  return n;
}

function input(id: string, value: string, placeholder: string): HTMLInputElement {
  const i = document.createElement('input');
  i.type = 'text';
  i.id = id;
  i.className = 'in';
  i.value = value;
  i.placeholder = placeholder;
  i.autocomplete = 'off';
  return i;
}

function textarea(id: string, value: string, placeholder: string): HTMLTextAreaElement {
  const a = document.createElement('textarea');
  a.id = id;
  a.className = 'in';
  a.value = value;
  a.placeholder = placeholder;
  a.rows = 2;
  return a;
}

// Design tokens from the app (lib/design/tokens.dart), light + dark.
const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.card {
  --canvas:#FAFAF7; --s1:#FFFFFF; --s2:#F3F2EE; --s3:#ECEBE5; --ink:#1A1A18; --muted:#4A4A45; --subtle:#83837C;
  --line:#E5E4DF; --primary:#0F8E7E; --on-primary:#fff; --pc:#CDEEEA; --onpc:#003B33; --warn:#D89B3C; --err:#C75148;
  position: fixed; z-index: 2147483647; right: 16px; bottom: 16px; width: min(380px, calc(100vw - 32px));
  max-height: calc(100vh - 32px); overflow: auto; background: var(--s1); color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 10px 30px rgba(26,26,24,.16), 0 1px 2px rgba(26,26,24,.08);
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) {
  .card { --canvas:#0E0E0C; --s1:#181816; --s2:#23231F; --s3:#2D2D29; --ink:#F0F0EC; --muted:#B5B5AE; --subtle:#7A7A73;
    --line:#2D2D29; --primary:#2FB5A3; --on-primary:#06201C; --pc:#0F3F38; --onpc:#BFEDE6; --warn:#FFA726; --err:#EF5350;
    box-shadow: 0 10px 30px rgba(0,0,0,.5); }
}
.head { display:flex; align-items:center; gap:8px; padding: 12px 8px 4px 16px; }
.title { flex:1; font-weight:600; font-size:15px; letter-spacing:-.2px; }
.body { display:flex; flex-direction:column; gap:10px; padding: 8px 16px 16px; }
.h { font-weight:600; font-size:16px; letter-spacing:-.2px; }
.h.ok::before { content:"✓ "; color: var(--primary); }
.p { margin:0; color: var(--muted); }
.lbl { display:block; font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color: var(--subtle); margin-bottom:5px; }
.field { display:flex; flex-direction:column; }
.in { width:100%; font: inherit; color: var(--ink); background: var(--s2); border:1.5px solid var(--line); border-radius:12px; padding:9px 12px; resize: vertical; min-height: 40px; outline: none; }
.in:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--pc); }
.in::placeholder { color: var(--subtle); }
.setrow { display:flex; flex-direction:column; }
.select { width:100%; font: inherit; color: var(--ink); background: var(--s2); border:1px solid var(--line); border-radius:12px; padding:9px 12px; }
.row { display:flex; flex-wrap:wrap; gap:8px; }
.btn { font: inherit; font-weight:600; border-radius:12px; border:1px solid var(--line); background: var(--s2); color: var(--ink); padding: 9px 14px; cursor:pointer; }
.btn:hover { filter: brightness(.97); }
.btn:disabled { opacity:.5; cursor:default; }
.btn.primary { background: var(--primary); color: var(--on-primary); border-color: transparent; }
.btn.wide { width:100%; padding: 12px; }
.btn.ghost { background: transparent; border-color: transparent; color: var(--primary); }
.btn.x { background: transparent; border-color: transparent; color: var(--muted); padding: 6px 10px; font-size: 16px; }
.fhead { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
.fhead .lbl { margin-bottom:0; }
.btn.pill { border-radius:999px; padding:3px 10px; font-size:11px; font-weight:800; letter-spacing:.4px; color: var(--muted); background: transparent; }
.btn.pill.on, .btn.pill:not(:disabled):hover { color:#fff; border-color: transparent; background: linear-gradient(90deg,#7B5CFA,#D160E0); }
.btn.swap { align-self:center; background: transparent; border-color: var(--line); color: var(--muted); border-radius: 999px; padding: 4px 12px; font-weight:500; font-size:12.5px; margin: -2px 0; }
.note { border:1px solid var(--line); background: var(--s2); border-radius: 12px; padding: 10px 12px; display:flex; flex-direction:column; gap:8px; }
.note.warn { border-color: color-mix(in srgb, var(--warn) 55%, var(--line)); }
.note.err { border-color: color-mix(in srgb, var(--err) 55%, var(--line)); }
.nh { font-weight:600; }
.nb { color: var(--muted); }
.hint { font-size:12.5px; color: var(--subtle); }
.preview { background: var(--s2); border-radius: 12px; padding: 10px 12px; }
.pf { font-weight:600; }
.pb { color: var(--muted); }
`;
