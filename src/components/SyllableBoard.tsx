import { motion } from 'framer-motion';
import type { Cells, Slot } from '@/lib/bopomofo';
import { ANIM_MS } from '@/lib/config';
import { LINE, SLOT_COLOR, SLOT_TINT, WHITE, WHOLE_GLOW } from '@/lib/palette';

/**
 * 輕聲符號。`lib/bopomofo.ts` 只匯出 `TONE_1` 與整個 `TONES` 陣列，
 * 而那支檔案本期不動，所以「哪一個是輕聲」的常數定義在這裡（版面規則的所在地），
 * 卡片那邊 import 同一個，兩處不會各寫各的。
 */
export const TONE_LIGHT = '˙';

/**
 * 字格尺寸。三格 104 直排、間距 14 → 節距 118，
 * 與右邊三條符號帶（高 104、間距 14）**完全相同**，所以中線對得上（第四期驗收 §4-5）。
 * 全域 `box-sizing: border-box`，3px 邊框不會把格子撐成 110。
 */
export const CELL = 104;
export const TONE_CELL = 76;
export const CELL_GAP = 14;

/**
 * 書頁左右兩欄共用的頂部留白。
 *
 * 輕聲的「˙」要浮在三格**正上方**（課本排法），那個格子是 `position: absolute`、
 * **不佔 flex 高度**——否則三格會被往下推、與右邊三條帶的中線就對不上了。
 * 不佔高度的代價是它會往上長出去，所以整個字格區域往下讓 24px 把它容進白色書頁裡。
 * **左欄與右欄一定要用同一個值**，中線才不會漂掉；所以這個常數由這裡匯出、兩邊都 import。
 */
export const COLUMN_TOP_PAD = 24;

/** 輕聲格：矮、與三格同寬，只放一個點。 */
const LIGHT_TONE_H = 38;
const LIGHT_TONE_GAP = 6;

/**
 * 聲調符號（˙ ˇ ˊ ˋ）的墨水位置補償，單位 em。
 *
 * 實測（canvas 量墨水框，PingFang TC 700，font-size 100）：
 *   ˙ ˇ ˊ ˋ 的墨水都落在**基線上方 78–89**（墨水中心約 0.835em），
 *   而一般注音（ㄅ）是 -4–81（中心約 0.385em）。
 * 也就是聲調符號天生就長在 em 框的很上面。方格（76×76）裡它只是偏高、還看得到；
 * 但輕聲格只有 38 高，flex 置中會把那個點推到框線外被裁掉（實際看到的是一個空的框）。
 *
 * 0.475em = F/2 − 0.025F，是把墨水中心拉到格子正中央所需的位移
 * （推導：lineHeight 1 時墨水中心距行框頂 0.025F，行框在格子裡置中；
 * 與格子高度無關，所以 38 高的輕聲格與 76 高的方格用同一個值）。
 * **兩個位置都套**：右側方格原本沿用設計稿的高位置，但那其實是字型 metrics 的副作用
 * 而不是設計意圖，看起來就是「符號黏在框的上緣」；一致性優先，一起置中。
 */
const TONE_INK_SHIFT_EM = 0.475;

/** 兩個位置共用同一個 layoutId，framer-motion 才會把「點跑上去」演出來。 */
const TONE_LAYOUT_ID = 'tone-cell';

interface CellProps {
    slot: Slot;
    symbol: string | null;
    highlighted: boolean;
    whole: boolean;
    width: number;
    height: number;
    /** 字級是照哪一邊算的：方格照邊長，扁格照高度會太小，所以另外給。 */
    fontSize: number;
    layoutId?: string;
    /** 把符號的墨水往下推幾 em（只有輕聲格需要，見 TONE_INK_SHIFT_EM）。 */
    glyphShiftEm?: number;
}

function Cell({ slot, symbol, highlighted, whole, width, height, fontSize, layoutId, glyphShiftEm }: CellProps) {
    const color = SLOT_COLOR[slot];
    const on = whole || highlighted;
    return (
        <motion.div
            layoutId={layoutId}
            data-slot={slot}
            data-symbol={symbol ?? ''}
            data-highlighted={on ? 'true' : 'false'}
            style={{
                width,
                height,
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
            {glyphShiftEm ? (
                <span style={{ display: 'block', transform: `translateY(${glyphShiftEm}em)` }}>{symbol ?? ''}</span>
            ) : (
                (symbol ?? '')
            )}
        </motion.div>
    );
}

export interface SyllableBoardProps {
    cells: Cells;
    /** 目前高亮哪一格；'whole' = 四格一起＋黃色外光。 */
    active: Slot | 'whole' | null;
    /** 念完整串後的收尾彈跳。 */
    finished: boolean;
}

export function SyllableBoard({ cells, active, finished }: SyllableBoardProps) {
    const whole = active === 'whole';
    const toneOn = active === 'tone';
    /**
     * 課本排法：**輕聲的點在音節正上方，ˊˇˋ（含一聲 ˉ）在右側**。
     * 所以同一個 tone 格會在兩個位置之間搬家，位置由 `cells.tone` 決定。
     */
    const light = cells.tone === TONE_LIGHT;

    return (
        <motion.div
            data-testid="syllable-board"
            data-tone-position={light ? 'top' : 'right'}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 10px',
                borderRadius: 28,
                boxShadow: whole ? WHOLE_GLOW : '0 0 0 0 rgba(0, 0, 0, 0)'
            }}
            animate={whole ? { scale: [1, 1.04, 1] } : finished ? { y: [0, -14, 0] } : { scale: 1, y: 0 }}
            transition={{ duration: ANIM_MS / 1000, ease: 'easeOut' }}
        >
            {/* position: relative 只是給上方的輕聲格一個定位基準，本身高度仍然是三格 340 */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: CELL_GAP }}>
                {light && (
                    <div
                        data-testid="tone-top-slot"
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: `calc(100% + ${LIGHT_TONE_GAP}px)`,
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        <Cell
                            slot="tone"
                            symbol={cells.tone}
                            highlighted={toneOn}
                            whole={whole}
                            width={CELL}
                            height={LIGHT_TONE_H}
                            fontSize={Math.round(TONE_CELL * 0.5)}
                            layoutId={TONE_LAYOUT_ID}
                            glyphShiftEm={TONE_INK_SHIFT_EM}
                        />
                    </div>
                )}
                <Cell slot="initial" symbol={cells.initial} highlighted={active === 'initial'} whole={whole}
                      width={CELL} height={CELL} fontSize={Math.round(CELL * 0.62)} />
                <Cell slot="medial" symbol={cells.medial} highlighted={active === 'medial'} whole={whole}
                      width={CELL} height={CELL} fontSize={Math.round(CELL * 0.62)} />
                <Cell slot="final" symbol={cells.final} highlighted={active === 'final'} whole={whole}
                      width={CELL} height={CELL} fontSize={Math.round(CELL * 0.62)} />
            </div>

            {/*
              輕聲時右邊那格空著就好——**格子本身不能拿掉**，
              拿掉會讓左欄寬度變動、右邊三條帶跟著左右跳。留一個等寬的透明佔位。
            */}
            {light ? (
                <div data-testid="tone-right-spacer" style={{ width: TONE_CELL, height: TONE_CELL }} />
            ) : (
                <Cell
                    slot="tone"
                    symbol={cells.tone}
                    highlighted={toneOn}
                    whole={whole}
                    width={TONE_CELL}
                    height={TONE_CELL}
                    fontSize={Math.round(TONE_CELL * 0.5)}
                    layoutId={TONE_LAYOUT_ID}
                    glyphShiftEm={TONE_INK_SHIFT_EM}
                />
            )}
        </motion.div>
    );
}
