import { TONES, slotOf, type Slot } from '@/lib/bopomofo';
import { SLOT_COLOR, SLOT_TINT } from '@/lib/palette';
import { CELL, CELL_GAP } from './SyllableBoard';

/**
 * 三條符號帶。每條高 104、彼此間距 14——與左邊三格的節距一模一樣，
 * 所以「聲母帶對上格、介音帶對中格、韻母帶對下格」是排出來的，不是湊出來的。
 * 聲調沒有自己的帶：它掛在介音帶的右端（設計稿的排法），因為聲調格也在中格右側。
 */
const BAND_H = CELL;
const BAND_GAP = CELL_GAP;

const INITIAL_ROWS = [
    ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ'],
    ['ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ']
];
const MEDIAL_ROW = ['ㄧ', 'ㄨ', 'ㄩ'];
const FINAL_ROWS = [
    ['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ'],
    ['ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ']
];

interface KeyProps {
    symbol: string;
    size: number;
    onPress: (symbol: string) => void;
}

function Key({ symbol, size, onPress }: KeyProps) {
    const slot = slotOf(symbol) as Slot;
    return (
        <button
            className="press"
            data-key={symbol}
            aria-label={symbol}
            onClick={() => onPress(symbol)}
            style={{
                width: size,
                height: size,
                border: 'none',
                borderRadius: 14,
                background: SLOT_TINT[slot],
                color: SLOT_COLOR[slot],
                fontSize: Math.round(size * (slot === 'tone' ? 0.46 : 0.5)),
                fontWeight: 700,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                flexShrink: 0
            }}
        >
            {symbol}
        </button>
    );
}

function Row({ symbols, size, onPress }: { symbols: string[]; size: number; onPress: (s: string) => void }) {
    return (
        <div style={{ display: 'flex', gap: 6 }}>
            {symbols.map((s) => (
                <Key key={s} symbol={s} size={size} onPress={onPress} />
            ))}
        </div>
    );
}

function Band({ slot, children }: { slot: Slot; children: React.ReactNode }) {
    return (
        <div
            data-band={slot}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                height: BAND_H,
                padding: '0 16px',
                borderRadius: 22,
                background: SLOT_TINT[slot]
            }}
        >
            <div
                style={{ width: 5, height: 56, borderRadius: 3, background: SLOT_COLOR[slot], flexShrink: 0 }}
            />
            {children}
        </div>
    );
}

export function SymbolBands({ onPress }: { onPress: (symbol: string) => void }) {
    return (
        <div
            data-testid="symbol-bands"
            style={{ display: 'flex', flexDirection: 'column', gap: BAND_GAP, flexGrow: 1, paddingTop: 2 }}
        >
            <Band slot="initial">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {INITIAL_ROWS.map((row, i) => (
                        <Row key={i} symbols={row} size={44} onPress={onPress} />
                    ))}
                </div>
            </Band>

            <Band slot="medial">
                <Row symbols={MEDIAL_ROW} size={52} onPress={onPress} />
                <div
                    data-band="tone"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        marginLeft: 'auto',
                        padding: '6px 10px 6px 16px',
                        borderRadius: 18,
                        background: SLOT_TINT.tone
                    }}
                >
                    <div
                        style={{ width: 5, height: 40, borderRadius: 3, background: SLOT_COLOR.tone, flexShrink: 0 }}
                    />
                    <Row symbols={[...TONES]} size={48} onPress={onPress} />
                </div>
            </Band>

            <Band slot="final">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {FINAL_ROWS.map((row, i) => (
                        <Row key={i} symbols={row} size={44} onPress={onPress} />
                    ))}
                </div>
            </Band>
        </div>
    );
}
