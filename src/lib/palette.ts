import type { Slot } from './bopomofo';

/** 四類符號各一個固定顏色，讓小孩一眼看出哪格是什麼。 */
export const SLOT_COLOR: Record<Slot, { base: string; bright: string; ink: string }> = {
    initial: { base: '#E8590C', bright: '#FF922B', ink: '#FFFFFF' },
    medial: { base: '#2F9E44', bright: '#51CF66', ink: '#FFFFFF' },
    final: { base: '#1971C2', bright: '#4DABF7', ink: '#FFFFFF' },
    tone: { base: '#9C36B5', bright: '#DA77F2', ink: '#FFFFFF' }
};

export const EMPTY_BORDER = '#C9CDD4';
export const PAGE_BG = '#FBFBFD';
