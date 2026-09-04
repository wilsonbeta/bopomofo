'use client';

import {
    AUTO_FALLBACK_TO_CHAR_READING,
    WHOLE_TOKEN_USE_HANZI_READING,
    PREFERRED_VOICE_PATTERNS,
    SYMBOL_READING_MODE,
    TOKEN_GAP_MS,
    UTTERANCE_TIMEOUT_MAX_MS,
    UTTERANCE_TIMEOUT_MIN_MS,
    UTTERANCE_TIMEOUT_PER_CHAR_MS
} from './config';
import { SYMBOL_CHAR_READING, TONE_WORD, TONE_1, type Cells, type Slot, toSyllable } from './bopomofo';
import { SYLLABLE_READING } from './syllable-reading';

export function isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** getVoices() 在剛載入時常常是空的，等 voiceschanged 或輪詢。 */
export function waitForVoices(timeoutMs = 4000): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
        if (!isSupported()) return resolve([]);
        const now = window.speechSynthesis.getVoices();
        if (now.length) return resolve(now);
        const t0 = Date.now();
        const tick = () => {
            const vs = window.speechSynthesis.getVoices();
            if (vs.length || Date.now() - t0 > timeoutMs) resolve(vs);
            else setTimeout(tick, 100);
        };
        window.speechSynthesis.addEventListener('voiceschanged', tick, { once: true });
        setTimeout(tick, 100);
    });
}

/**
 * 挑語音。**這一步是整個程式能不能發出聲音的關鍵**。
 *
 * macOS 26.1 實測：10 個 zh-TW 系統語音裡，只有 Meijia（美佳）念得出注音符號本身；
 * 其他 9 個對「ㄅ」「ㄅㄚˇ」輸出 0.016 秒的純靜音（RMS = 0），只有漢字才有聲音。
 * Chrome 的預設 zh-TW 語音剛好是 Eddy，也就是說「只設 lang = 'zh-TW'」會全程無聲。
 */
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    for (const re of PREFERRED_VOICE_PATTERNS) {
        const hit = voices.find((v) => re.test(v.name) && /^zh/i.test(v.lang));
        if (hit) return hit;
    }
    const localTw = voices.find((v) => /^zh[-_]TW$/i.test(v.lang) && v.localService);
    if (localTw) return localTw;
    const anyTw = voices.find((v) => /^zh[-_]TW$/i.test(v.lang));
    if (anyTw) return anyTw;
    return voices.find((v) => /^zh/i.test(v.lang)) ?? null;
}

/** 選到的語音是不是已知念得出注音符號的那一個。 */
export function voiceReadsBopomofo(voice: SpeechSynthesisVoice | null): boolean {
    if (!voice) return false;
    return PREFERRED_VOICE_PATTERNS.some((re) => re.test(voice.name));
}

export type TokenKind = Slot | 'whole';

export interface SpeechToken {
    /** 高亮哪一格；'whole' 代表四格一起。 */
    kind: TokenKind;
    /** 真正送進語音引擎的文字。 */
    text: string;
}

/**
 * 四格 → token 序列：[上] → [中] → [下] → [聲調詞] → [整字注音字串]。
 * 空格跳過；沒填聲調視為一聲並照念「一聲」。
 */
export function buildTokens(cells: Cells, useCharReading: boolean): SpeechToken[] {
    const reading = (sym: string) => (useCharReading ? SYMBOL_CHAR_READING[sym] ?? sym : sym);
    const tokens: SpeechToken[] = [];
    if (cells.initial) tokens.push({ kind: 'initial', text: reading(cells.initial) });
    if (cells.medial) tokens.push({ kind: 'medial', text: reading(cells.medial) });
    if (cells.final) tokens.push({ kind: 'final', text: reading(cells.final) });
    tokens.push({ kind: 'tone', text: TONE_WORD[cells.tone ?? TONE_1] });
    const syllable = toSyllable(cells);
    if (syllable) tokens.push({ kind: 'whole', text: wholeTokenText(syllable) });
    return tokens;
}

/**
 * 整字 token 真正要送進引擎的文字。
 * 查得到代讀漢字就送漢字（發音才正確）；查不到才退回注音字串，讓引擎逐符號念。
 * 不論哪一種，畫面上顯示的永遠是四格注音，不會出現漢字。
 */
export function wholeTokenText(syllable: string): string {
    if (!WHOLE_TOKEN_USE_HANZI_READING) return syllable;
    return SYLLABLE_READING[syllable] ?? syllable;
}

function timeoutFor(text: string): number {
    return Math.min(
        UTTERANCE_TIMEOUT_MAX_MS,
        Math.max(UTTERANCE_TIMEOUT_MIN_MS, text.length * UTTERANCE_TIMEOUT_PER_CHAR_MS)
    );
}

export interface SpeakOneOptions {
    voice: SpeechSynthesisVoice | null;
    onStart?: () => void;
    onEnd?: () => void;
    signal?: { cancelled: boolean };
}

/**
 * 念一個 token，回傳一個在 onend（或保險絲逾時）時 resolve 的 Promise。
 *
 * 一 token 一 utterance 是為了拿到可靠的 onstart/onend 時間點——不用 onboundary。
 * Chrome 實測（macOS 26.1 / Chrome 152）：連續 8 個 utterance，不論是逐一 await 還是
 * 一次全部排隊，onstart / onend 都 8/8 完整觸發，沒有掉事件。
 * 即使如此仍保留 timeout 雙保險，避免某些瀏覽器吞掉 onend 就整條卡死。
 */
export function speakOne(text: string, opts: SpeakOneOptions): Promise<void> {
    return new Promise((resolve) => {
        if (!isSupported() || !text) {
            opts.onStart?.();
            opts.onEnd?.();
            return resolve();
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-TW';
        if (opts.voice) u.voice = opts.voice;
        u.rate = 0.9;

        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            opts.onEnd?.();
            resolve();
        };
        u.onstart = () => opts.onStart?.();
        u.onend = finish;
        u.onerror = finish;
        const timer = setTimeout(finish, timeoutFor(text));

        // 排隊前先確認沒被取消，避免 cancel() 之後又補塞一個進去。
        if (opts.signal?.cancelled) return finish();
        window.speechSynthesis.speak(u);
    });
}

export function cancelAll(): void {
    if (isSupported()) window.speechSynthesis.cancel();
}

export interface PlayOptions {
    voice: SpeechSynthesisVoice | null;
    onToken: (index: number, token: SpeechToken) => void;
    onTokenEnd: (index: number, token: SpeechToken) => void;
    signal: { cancelled: boolean };
}

/** 依序播完整串 token。 */
export async function playSequence(tokens: SpeechToken[], opts: PlayOptions): Promise<boolean> {
    for (let i = 0; i < tokens.length; i++) {
        if (opts.signal.cancelled) return false;
        const t = tokens[i];
        await speakOne(t.text, {
            voice: opts.voice,
            signal: opts.signal,
            onStart: () => opts.onToken(i, t),
            onEnd: () => opts.onTokenEnd(i, t)
        });
        if (opts.signal.cancelled) return false;
        if (i < tokens.length - 1) await new Promise((r) => setTimeout(r, TOKEN_GAP_MS));
    }
    return true;
}

/** 依設定與實際選到的語音，決定符號 token 要不要走代字。 */
export function shouldUseCharReading(voice: SpeechSynthesisVoice | null): boolean {
    if (SYMBOL_READING_MODE === 'char') return true;
    if (AUTO_FALLBACK_TO_CHAR_READING && !voiceReadsBopomofo(voice)) return true;
    return false;
}
