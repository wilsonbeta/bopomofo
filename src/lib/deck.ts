/**
 * 卡片組（deck）的資料、驗證與持久化。
 *
 * 沒有後端也沒有 DB：自動存 localStorage，手動走 JSON 匯出／匯入。
 * 這裡刻意不碰 React，元件只呼叫這些純函式。
 */

import { DECK_STORAGE_KEY } from './config';
import { FINALS, INITIALS, MEDIALS, TONES, type Cells } from './bopomofo';

export interface Card {
    id: string;
    cells: Cells;
}

export interface Deck {
    version: 1;
    cards: Card[];
}

export const DECK_VERSION = 1 as const;

const VALID: Record<keyof Cells, readonly string[]> = {
    initial: INITIALS,
    medial: MEDIALS,
    final: FINALS,
    tone: TONES
};

/** 四格的值必須是「該格合法的注音符號」或 null，其他一律不收。 */
export function isValidCells(value: unknown): value is Cells {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    for (const slot of Object.keys(VALID) as (keyof Cells)[]) {
        const cell = v[slot];
        if (cell === null || cell === undefined) continue;
        if (typeof cell !== 'string' || !VALID[slot].includes(cell)) return false;
    }
    return true;
}

/** 把任何形狀的 cells 正規化成四欄齊全（缺的補 null）。 */
function normalizeCells(value: Cells): Cells {
    return {
        initial: value.initial ?? null,
        medial: value.medial ?? null,
        final: value.final ?? null,
        tone: value.tone ?? null
    };
}

export function newCardId(): string {
    return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 把外部 JSON 解析成 Deck。
 * 規則：`version` 必須是 1，每張卡的 `cells` 四欄值皆合法符號或 null。
 * 任何一項不合就整份退回 null（呼叫端閃紅框、不動現有 deck）。
 */
export function parseDeck(raw: unknown): Deck | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;
    if (d.version !== DECK_VERSION) return null;
    if (!Array.isArray(d.cards)) return null;

    const cards: Card[] = [];
    for (const item of d.cards) {
        if (!item || typeof item !== 'object') return null;
        const c = item as Record<string, unknown>;
        if (!isValidCells(c.cells)) return null;
        const id = typeof c.id === 'string' && c.id ? c.id : newCardId();
        cards.push({ id, cells: normalizeCells(c.cells) });
    }
    return { version: DECK_VERSION, cards };
}

export function parseDeckJson(text: string): Deck | null {
    try {
        return parseDeck(JSON.parse(text));
    } catch {
        return null;
    }
}

/** 讀 localStorage。壞資料（parse 失敗／shape 不對）一律當空 deck，不 throw。 */
export function loadDeck(): Card[] {
    if (typeof window === 'undefined') return [];
    try {
        const text = window.localStorage.getItem(DECK_STORAGE_KEY);
        if (!text) return [];
        return parseDeckJson(text)?.cards ?? [];
    } catch {
        return [];
    }
}

/** 寫 localStorage。無痕模式等寫不進去的情況直接忽略，不影響操作。 */
export function saveDeck(cards: Card[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(toDeck(cards)));
    } catch {
        /* 存不進去就算了，畫面照常運作 */
    }
}

export function toDeck(cards: Card[]): Deck {
    return { version: DECK_VERSION, cards };
}

export function deckToJson(cards: Card[]): string {
    return JSON.stringify(toDeck(cards), null, 4);
}

/** 匯出檔名：bopomofo-deck-YYYYMMDD.json（本地時區）。 */
export function exportFilename(now: Date = new Date()): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `bopomofo-deck-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}.json`;
}

/**
 * 觸發下載。
 *
 * 實測（Chrome 152 / macOS 26.1，CDP `Browser.downloadWillBegin`）：`<a download>` 不加進 DOM
 * 也照樣下載成功。但 Safari 這邊無法自動化驗證（remote automation 需人工開權限），
 * 所以採「先 appendChild 再 click 再移除」這個嚴格較安全的寫法。
 */
export function downloadJson(filename: string, text: string): void {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Safari 需要一點時間才真的把 blob 讀走，別立刻 revoke。
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function moveCard(cards: Card[], fromId: string, toId: string): Card[] {
    const from = cards.findIndex((c) => c.id === fromId);
    const to = cards.findIndex((c) => c.id === toId);
    if (from < 0 || to < 0 || from === to) return cards;
    const next = cards.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
}
