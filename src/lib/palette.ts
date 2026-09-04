import type { Slot } from './bopomofo';

/**
 * 色票＝設計稿 `note/design/gen.mjs` 的 `C`，一字不差搬過來。
 * **全 app 只從這裡取色**，元件裡不寫死任何 hex。
 */

/** 紙色：舞台底色，也是舞台外留白的顏色（看不出舞台邊界）。 */
export const PAPER = '#FAF7F1';
/** 淡紙色：句子列的底。 */
export const PAPER2 = '#F3EEE5';
export const INK = '#2B2A28';
/** 分隔線／空格虛線／輕邊框。 */
export const LINE = '#E4DDD0';
/** 次要圖示（× 刪除鈕）。 */
export const MUTE = '#B8B0A2';
export const WHITE = '#FFFFFF';

/** 動作色：播放鈕、播放中高亮。 */
export const YELLOW = '#FFD43B';
export const YELLOW_DEEP = '#FAB005';
export const YELLOW_SOFT = '#FFF3BF';

/** 錯誤：不合法音節的搖頭邊框、匯入失敗紅框、壞卡標示。 */
export const DANGER = '#E03131';

/** 四類符號各一個固定顏色，讓小孩一眼看出哪格是什麼。 */
export const SLOT_COLOR: Record<Slot, string> = {
    initial: '#D9480F',
    medial: '#2B8A3E',
    final: '#1864AB',
    tone: '#862E9C'
};

/** 同一組顏色的 8% 版本，當各區的底色（設計稿的 initialT / medialT / finalT / toneT）。 */
export const SLOT_TINT: Record<Slot, string> = {
    initial: 'rgba(217, 72, 15, 0.08)',
    medial: 'rgba(43, 138, 62, 0.08)',
    final: 'rgba(24, 100, 171, 0.08)',
    tone: 'rgba(134, 46, 156, 0.08)'
};

/** 整字播放時的黃色外光。 */
export const WHOLE_GLOW = `0 0 0 6px ${YELLOW}, 0 0 40px 12px rgba(255, 212, 59, 0.55)`;
/** 整列播放時句子列的柔光。 */
export const STRIP_GLOW = '0 0 28px 6px rgba(255, 212, 59, 0.45)';

/** 不載 Google Fonts：iPad 用系統的 PingFang TC 就對了。 */
export const FONT_STACK = '"Noto Sans TC", "PingFang TC", "Heiti TC", sans-serif';
