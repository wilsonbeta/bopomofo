'use client';

import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TONE_1, type Cells, type Slot } from '@/lib/bopomofo';
import { ANIM_MS } from '@/lib/config';
import { SLOT_COLOR } from '@/lib/palette';
import { CloseIcon } from './Icons';

const MotionBox = motion.create(Box);
const D = ANIM_MS / 1000;

/** 卡片上的注音字級。課本感：字要大，不要框。 */
const GLYPH = 38;
/** 聲調符號的字面本來就小很多，放大補回來。 */
const TONE_GLYPH = 30;

function Glyph({ slot, symbol, size }: { slot: Slot; symbol: string; size: number }) {
    return (
        <Box
            data-mini-slot={slot}
            data-mini-symbol={symbol}
            fontWeight="700"
            lineHeight="1.05"
            userSelect="none"
            textAlign="center"
            style={{ fontSize: `${size}px`, color: SLOT_COLOR[slot].base }}
        >
            {symbol}
        </Box>
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

export function MiniCard({
    id,
    cells,
    selected,
    playing,
    flash,
    illegal,
    locked,
    onSelect,
    onDelete
}: MiniCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: locked
    });

    // 空格不佔位：只把真的有的符號堆起來。
    const stack: { slot: Slot; symbol: string }[] = [];
    if (cells.initial) stack.push({ slot: 'initial', symbol: cells.initial });
    if (cells.medial) stack.push({ slot: 'medial', symbol: cells.medial });
    if (cells.final) stack.push({ slot: 'final', symbol: cells.final });
    // 課本一聲不標；ˉ 只在主字格當「我按到了」的輸入回饋。
    const tone = cells.tone && cells.tone !== TONE_1 ? cells.tone : null;

    const border = illegal
        ? '2px solid #E03131'
        : selected
          ? '2px solid #212529'
          : '1.5px solid #DEE2E6';

    return (
        <MotionBox
            ref={setNodeRef}
            data-card-id={id}
            data-card-selected={selected ? 'true' : 'false'}
            data-card-playing={playing ? 'true' : 'false'}
            data-card-illegal={illegal ? 'true' : 'false'}
            {...attributes}
            {...listeners}
            onClick={() => onSelect(id)}
            position="relative"
            width="112px"
            paddingY="14px"
            paddingX="10px"
            borderRadius="16px"
            cursor={locked ? 'default' : 'pointer'}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.4 : 1,
                touchAction: 'none',
                background: playing ? '#FFF9DB' : '#FFFFFF',
                border,
                boxShadow: playing ? '0 0 0 4px #FFD43B' : 'none'
            }}
            animate={flash ? { scale: [1, 1.12, 1] } : { scale: playing ? 1.06 : 1 }}
            transition={{ duration: D, ease: 'easeOut' }}
        >
            {/* 課本排法：聲母／介音／韻母垂直堆疊，聲調在右側偏中 */}
            <Flex align="center" justify="center" gap="2px">
                <Flex direction="column" align="center" gap="2px">
                    {stack.map((g) => (
                        <Glyph key={g.slot} slot={g.slot} symbol={g.symbol} size={GLYPH} />
                    ))}
                </Flex>
                <Box width="20px" flexShrink={0}>
                    {tone && <Glyph slot="tone" symbol={tone} size={TONE_GLYPH} />}
                </Box>
            </Flex>

            {!locked && (
                <Box
                    as="button"
                    data-card-delete={id}
                    aria-label="delete"
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                    onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                    position="absolute"
                    top="-9px"
                    right="-9px"
                    width="24px"
                    height="24px"
                    borderRadius="12px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    style={{ border: '2px solid #ADB5BD', background: '#FFFFFF', color: '#868E96' }}
                >
                    <CloseIcon size={12} />
                </Box>
            )}
        </MotionBox>
    );
}
