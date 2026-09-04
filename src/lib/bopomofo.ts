/**
 * 注音符號資料表。
 *
 * 鍵盤配置＝大千式（Windows 稱「標準式」，macOS 亦同）。
 * 已對照維基百科「注音輸入法」條目的「大千注音對應表」原始碼逐鍵驗證，41 鍵全數相符。
 */

export type Slot = 'initial' | 'medial' | 'final' | 'tone';

/** 聲母（21 個）→ 上格 */
export const INITIALS = [
    'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ',
    'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ'
] as const;

/** 介音（3 個）→ 中格 */
export const MEDIALS = ['ㄧ', 'ㄨ', 'ㄩ'] as const;

/** 韻母（13 個）→ 下格 */
export const FINALS = [
    'ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ', 'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ'
] as const;

/**
 * 聲調 → 右格。
 * 一聲在正統注音裡不標符號，但格子需要看得見的回饋，因此畫面用 'ˉ'（U+02C9）顯示，
 * 組合成整字字串時會被拿掉。
 */
export const TONE_1 = 'ˉ';
export const TONES = [TONE_1, 'ˊ', 'ˇ', 'ˋ', '˙'] as const;

export type Symbol = string;

const SLOT_OF: Record<string, Slot> = {};
for (const s of INITIALS) SLOT_OF[s] = 'initial';
for (const s of MEDIALS) SLOT_OF[s] = 'medial';
for (const s of FINALS) SLOT_OF[s] = 'final';
for (const s of TONES) SLOT_OF[s] = 'tone';

export function slotOf(symbol: string): Slot | null {
    return SLOT_OF[symbol] ?? null;
}

/**
 * 大千式鍵盤：event.code → 注音符號。
 * 用 event.code（實體鍵位）而非 event.key，所以不受使用者當下輸入法影響。
 */
export const KEY_LAYOUT: { code: string; label: string; symbol: string }[][] = [
    [
        { code: 'Digit1', label: '1', symbol: 'ㄅ' },
        { code: 'Digit2', label: '2', symbol: 'ㄉ' },
        { code: 'Digit3', label: '3', symbol: 'ˇ' },
        { code: 'Digit4', label: '4', symbol: 'ˋ' },
        { code: 'Digit5', label: '5', symbol: 'ㄓ' },
        { code: 'Digit6', label: '6', symbol: 'ˊ' },
        { code: 'Digit7', label: '7', symbol: '˙' },
        { code: 'Digit8', label: '8', symbol: 'ㄚ' },
        { code: 'Digit9', label: '9', symbol: 'ㄞ' },
        { code: 'Digit0', label: '0', symbol: 'ㄢ' },
        { code: 'Minus', label: '-', symbol: 'ㄦ' }
    ],
    [
        { code: 'KeyQ', label: 'Q', symbol: 'ㄆ' },
        { code: 'KeyW', label: 'W', symbol: 'ㄊ' },
        { code: 'KeyE', label: 'E', symbol: 'ㄍ' },
        { code: 'KeyR', label: 'R', symbol: 'ㄐ' },
        { code: 'KeyT', label: 'T', symbol: 'ㄔ' },
        { code: 'KeyY', label: 'Y', symbol: 'ㄗ' },
        { code: 'KeyU', label: 'U', symbol: 'ㄧ' },
        { code: 'KeyI', label: 'I', symbol: 'ㄛ' },
        { code: 'KeyO', label: 'O', symbol: 'ㄟ' },
        { code: 'KeyP', label: 'P', symbol: 'ㄣ' }
    ],
    [
        { code: 'KeyA', label: 'A', symbol: 'ㄇ' },
        { code: 'KeyS', label: 'S', symbol: 'ㄋ' },
        { code: 'KeyD', label: 'D', symbol: 'ㄎ' },
        { code: 'KeyF', label: 'F', symbol: 'ㄑ' },
        { code: 'KeyG', label: 'G', symbol: 'ㄕ' },
        { code: 'KeyH', label: 'H', symbol: 'ㄘ' },
        { code: 'KeyJ', label: 'J', symbol: 'ㄨ' },
        { code: 'KeyK', label: 'K', symbol: 'ㄜ' },
        { code: 'KeyL', label: 'L', symbol: 'ㄠ' },
        { code: 'Semicolon', label: ';', symbol: 'ㄤ' }
    ],
    [
        { code: 'KeyZ', label: 'Z', symbol: 'ㄈ' },
        { code: 'KeyX', label: 'X', symbol: 'ㄌ' },
        { code: 'KeyC', label: 'C', symbol: 'ㄏ' },
        { code: 'KeyV', label: 'V', symbol: 'ㄒ' },
        { code: 'KeyB', label: 'B', symbol: 'ㄖ' },
        { code: 'KeyN', label: 'N', symbol: 'ㄙ' },
        { code: 'KeyM', label: 'M', symbol: 'ㄩ' },
        { code: 'Comma', label: ',', symbol: 'ㄝ' },
        { code: 'Period', label: '.', symbol: 'ㄡ' },
        { code: 'Slash', label: '/', symbol: 'ㄥ' }
    ]
];

export const CODE_TO_SYMBOL: Record<string, string> = {};
for (const row of KEY_LAYOUT) for (const k of row) CODE_TO_SYMBOL[k.code] = k.symbol;
/** 空白鍵＝一聲 */
CODE_TO_SYMBOL['Space'] = TONE_1;

/** 聲調 → 要念出來的詞（只進語音引擎，畫面不顯示）。 */
export const TONE_WORD: Record<string, string> = {
    [TONE_1]: '一聲',
    'ˊ': '二聲',
    'ˇ': '三聲',
    'ˋ': '四聲',
    '˙': '輕聲'
};

/**
 * 教育部標準注音讀音代字（純發音備援，畫面永遠不顯示）。
 * 除 ㄇ 外，其餘 36 個都經 PCM 逐位元組比對，與 Meijia 直接念符號的輸出完全相同。
 */
export const SYMBOL_CHAR_READING: Record<string, string> = {
    'ㄅ': '玻', 'ㄆ': '坡', 'ㄇ': '摸', 'ㄈ': '佛', 'ㄉ': '得', 'ㄊ': '特', 'ㄋ': '訥',
    'ㄌ': '勒', 'ㄍ': '哥', 'ㄎ': '科', 'ㄏ': '喝', 'ㄐ': '基', 'ㄑ': '欺', 'ㄒ': '希',
    'ㄓ': '知', 'ㄔ': '吃', 'ㄕ': '詩', 'ㄖ': '日', 'ㄗ': '資', 'ㄘ': '雌', 'ㄙ': '思',
    'ㄧ': '衣', 'ㄨ': '烏', 'ㄩ': '迂',
    'ㄚ': '啊', 'ㄛ': '喔', 'ㄜ': '鵝', 'ㄝ': '耶', 'ㄞ': '哀', 'ㄟ': '欸', 'ㄠ': '熬',
    'ㄡ': '歐', 'ㄢ': '安', 'ㄣ': '恩', 'ㄤ': '昂', 'ㄥ': '鞥', 'ㄦ': '兒'
};

export interface Cells {
    initial: string | null;
    medial: string | null;
    final: string | null;
    tone: string | null;
}

export const EMPTY_CELLS: Cells = { initial: null, medial: null, final: null, tone: null };

/** Backspace 清除順序：聲調 → 下 → 中 → 上（最後填的先清）。 */
export const CLEAR_ORDER: Slot[] = ['tone', 'final', 'medial', 'initial'];

/**
 * 四格 → 正規化注音字串，直接送語音引擎當「整字」token。
 * 一聲不帶符號；輕聲的 ˙ 放在**字尾**。
 *
 * 實測依據（Meijia，22.05 kHz PCM）：
 *   ㄅㄚ = 0.248s / ˙ㄅㄚ = 0.248s（前綴被忽略，念成一聲）/ ㄅㄚ˙ = 0.179s（明顯較短，是真的輕聲）
 * 所以這裡用字尾式，與教育部辭典的前綴寫法不同——這是為了發音正確而做的取捨。
 */
export function toSyllable(cells: Cells): string {
    const base = (cells.initial ?? '') + (cells.medial ?? '') + (cells.final ?? '');
    if (!base) return '';
    const tone = cells.tone;
    if (!tone || tone === TONE_1) return base;
    return base + tone;
}

export function isEmpty(cells: Cells): boolean {
    return !cells.initial && !cells.medial && !cells.final && !cells.tone;
}
