import { motion } from 'framer-motion';
import type { Cells, Slot } from '@/lib/bopomofo';
import { ANIM_MS } from '@/lib/config';
import { DANGER, LINE, SLOT_COLOR, SLOT_TINT, WHITE, WHOLE_GLOW } from '@/lib/palette';

/**
 * 字格尺寸。三格 104 直排、間距 14 → 節距 118，
 * 與右邊三條符號帶（高 104、間距 14）**完全相同**，所以中線對得上（驗收 §4-5）。
 * 全域 `box-sizing: border-box`，3px 邊框不會把格子撐成 110。
 */
export const CELL = 104;
export const TONE_CELL = 76;
export const CELL_GAP = 14;

interface CellProps {
    slot: Slot;
    symbol: string | null;
    highlighted: boolean;
    whole: boolean;
    size: number;
}

function Cell({ slot, symbol, highlighted, whole, size }: CellProps) {
    const color = SLOT_COLOR[slot];
    const on = whole || highlighted;
    // 聲調符號（ˉ ˊ ˇ ˋ ˙）的字面比其他注音小很多，比例調小一點反而看起來一樣大。
    const fontSize = Math.round(size * (slot === 'tone' ? 0.5 : 0.62));
    return (
        <motion.div
            data-slot={slot}
            data-symbol={symbol ?? ''}
            data-highlighted={on ? 'true' : 'false'}
            style={{
                width: size,
                height: size,
                borderRadius: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize,
                lineHeight: 1,
                userSelect: 'none',
                position: 'relative',
                zIndex: on ? 2 : 1,
                background: symbol ? (on ? color : SLOT_TINT[slot]) : 'transparent',
                color: on ? WHITE : color,
                border: symbol ? `3px solid ${color}` : `3px dashed ${LINE}`
            }}
            animate={{ scale: highlighted && !whole ? 1.12 : 1 }}
            transition={{ duration: ANIM_MS / 1000, ease: 'easeOut' }}
        >
            {symbol ?? ''}
        </motion.div>
    );
}

export interface SyllableBoardProps {
    cells: Cells;
    /** 目前高亮哪一格；'whole' = 四格一起＋黃色外光。 */
    active: Slot | 'whole' | null;
    /** 念完整串後的收尾彈跳。 */
    finished: boolean;
    /** 存到不合法音節：左右搖頭＋邊框短暫變紅，不彈任何文字。 */
    shake: boolean;
}

export function SyllableBoard({ cells, active, finished, shake }: SyllableBoardProps) {
    const whole = active === 'whole';
    const glow = whole ? WHOLE_GLOW : shake ? `0 0 0 5px ${DANGER}` : '0 0 0 0 rgba(0, 0, 0, 0)';
    return (
        <motion.div
            data-testid="syllable-board"
            data-shake={shake ? 'true' : 'false'}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 10px',
                borderRadius: 28,
                boxShadow: glow
            }}
            animate={
                shake
                    ? { x: [0, -10, 10, -6, 6, 0] }
                    : whole
                      ? { scale: [1, 1.04, 1] }
                      : finished
                        ? { y: [0, -14, 0] }
                        : { scale: 1, x: 0, y: 0 }
            }
            transition={{ duration: ANIM_MS / 1000, ease: 'easeOut' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP }}>
                <Cell slot="initial" symbol={cells.initial} highlighted={active === 'initial'} whole={whole} size={CELL} />
                <Cell slot="medial" symbol={cells.medial} highlighted={active === 'medial'} whole={whole} size={CELL} />
                <Cell slot="final" symbol={cells.final} highlighted={active === 'final'} whole={whole} size={CELL} />
            </div>
            <Cell slot="tone" symbol={cells.tone} highlighted={active === 'tone'} whole={whole} size={TONE_CELL} />
        </motion.div>
    );
}
