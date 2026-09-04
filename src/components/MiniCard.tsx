import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TONE_1, type Cells, type Slot } from '@/lib/bopomofo';
import { ANIM_MS } from '@/lib/config';
import { DANGER, INK, LINE, MUTE, SLOT_COLOR, WHITE, YELLOW, YELLOW_SOFT } from '@/lib/palette';
import { useStageScale } from './Stage';
import { CloseIcon } from './Icons';

export const CARD_W = 92;
export const CARD_H = 132;
/** 卡片上的注音字級。課本感：字要大，不要框。 */
const GLYPH = 34;
/** 聲調符號的字面本來就小很多，放大補回來。 */
const TONE_GLYPH = 26;
/** 聲調欄固定佔位，兩張卡的符號堆才會左右對齊（一聲不標時就是一個空欄）。 */
const TONE_COL = 18;

const D = ANIM_MS / 1000;

function Glyph({ slot, symbol, size }: { slot: Slot; symbol: string; size: number }) {
    return (
        <div
            data-mini-slot={slot}
            data-mini-symbol={symbol}
            style={{ fontSize: size, fontWeight: 700, lineHeight: 1.05, color: SLOT_COLOR[slot] }}
        >
            {symbol}
        </div>
    );
}

export interface MiniCardProps {
    id: string;
    cells: Cells;
    selected: boolean;
    playing: boolean;
    /** 剛儲存過，做一次回饋彈跳。 */
    flash: boolean;
    /** 音節查不到代讀漢字（第二期之前存的舊卡）：保留但標紅，整列播放會跳過。 */
    illegal: boolean;
    /** 播放中要禁用拖曳與刪除。 */
    locked: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export function MiniCard({ id, cells, selected, playing, flash, illegal, locked, onSelect, onDelete }: MiniCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: locked
    });
    const scale = useStageScale();

    // 舞台被 scale() 縮過，dnd-kit 給的位移是螢幕 px；除回去才會貼著手指走（見 Stage.tsx）。
    const dragTransform = transform ? { ...transform, x: transform.x / scale, y: transform.y / scale } : null;

    // 空格不佔位：只把真的有的符號堆起來。
    const stack: { slot: Slot; symbol: string }[] = [];
    if (cells.initial) stack.push({ slot: 'initial', symbol: cells.initial });
    if (cells.medial) stack.push({ slot: 'medial', symbol: cells.medial });
    if (cells.final) stack.push({ slot: 'final', symbol: cells.final });
    // 課本一聲不標；ˉ 只在主字格當「我按到了」的輸入回饋。
    const tone = cells.tone && cells.tone !== TONE_1 ? cells.tone : null;

    const border = illegal
        ? `2px solid ${DANGER}`
        : selected
          ? `2px solid ${INK}`
          : `1.5px solid ${LINE}`;

    /**
     * 外層放拖曳、內層放動畫——**兩層不能合併**。
     *
     * framer-motion 的 `animate={{ scale }}` 會自己接管該元素的 `transform`，
     * 把 dnd-kit 寫在 inline style 裡的位移整個蓋掉（實測：手指走到 348.9，卡片停在原地 164.9）。
     * 拖曳位移交給外層的純 div、彈跳交給內層的 motion.div，兩邊各寫各的 transform 就不會打架。
     */
    return (
        <div
            ref={setNodeRef}
            data-card-id={id}
            data-card-selected={selected ? 'true' : 'false'}
            data-card-playing={playing ? 'true' : 'false'}
            data-card-illegal={illegal ? 'true' : 'false'}
            {...attributes}
            {...listeners}
            onClick={() => onSelect(id)}
            style={{
                transform: CSS.Transform.toString(dragTransform),
                transition,
                opacity: isDragging ? 0.4 : 1,
                touchAction: 'none',
                position: 'relative',
                width: CARD_W,
                height: CARD_H,
                flexShrink: 0,
                cursor: locked ? 'default' : 'pointer',
                userSelect: 'none'
            }}
        >
            <motion.div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 16,
                    background: playing ? YELLOW_SOFT : WHITE,
                    border,
                    boxShadow: playing ? `0 0 0 4px ${YELLOW}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                }}
                animate={flash ? { scale: [1, 1.12, 1] } : { scale: playing ? 1.06 : 1 }}
                transition={{ duration: D, ease: 'easeOut' }}
            >
                {/* 課本排法：聲母／介音／韻母垂直堆疊，聲調在右側偏中 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {stack.map((g) => (
                        <Glyph key={g.slot} slot={g.slot} symbol={g.symbol} size={GLYPH} />
                    ))}
                </div>
                <div style={{ width: TONE_COL, flexShrink: 0 }}>
                    {tone && <Glyph slot="tone" symbol={tone} size={TONE_GLYPH} />}
                </div>
            </motion.div>

            {!locked && (
                <button
                    data-card-delete={id}
                    aria-label="delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        background: WHITE,
                        border: `1.5px solid ${LINE}`,
                        color: MUTE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <CloseIcon size={14} />
                </button>
            )}
        </div>
    );
}
