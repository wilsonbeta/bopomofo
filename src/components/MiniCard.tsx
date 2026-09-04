'use client';

import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Cells, Slot } from '@/lib/bopomofo';
import { ANIM_MS, CARD_SCALE } from '@/lib/config';
import { EMPTY_BORDER, SLOT_COLOR } from '@/lib/palette';
import { CloseIcon } from './Icons';

const MotionBox = motion.create(Box);
const D = ANIM_MS / 1000;

/** 主字格的格子邊長，乘上 CARD_SCALE 就是迷你版。 */
const BASE_SIZE = 132;

function MiniCell({ slot, symbol, playing, size }: { slot: Slot; symbol: string | null; playing: boolean; size: number }) {
    const c = SLOT_COLOR[slot];
    return (
        <Box
            data-mini-slot={slot}
            data-mini-symbol={symbol ?? ''}
            width={`${size}px`}
            height={`${size}px`}
            borderRadius={`${Math.max(4, size * 0.14)}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="700"
            lineHeight="1"
            userSelect="none"
            style={{
                fontSize: `${size * 0.62}px`,
                border: symbol ? `2px solid ${c.base}` : `2px dashed ${EMPTY_BORDER}`,
                color: playing ? c.ink : c.base,
                background: playing ? c.bright : 'transparent'
            }}
        >
            {symbol ?? ''}
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
    /** 播放中要禁用拖曳與刪除。 */
    locked: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export function MiniCard({ id, cells, selected, playing, flash, locked, onSelect, onDelete }: MiniCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: locked
    });
    const size = Math.round(BASE_SIZE * CARD_SCALE);

    return (
        <MotionBox
            ref={setNodeRef}
            data-card-id={id}
            data-card-selected={selected ? 'true' : 'false'}
            data-card-playing={playing ? 'true' : 'false'}
            {...attributes}
            {...listeners}
            onClick={() => onSelect(id)}
            position="relative"
            width="120px"
            borderRadius="16px"
            cursor={locked ? 'default' : 'pointer'}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.4 : 1,
                touchAction: 'none',
                background: playing ? '#FFF9DB' : '#FFFFFF',
                border: selected ? '4px solid #212529' : `2px solid ${EMPTY_BORDER}`,
                // 選中時邊框變粗，用 padding 補回來，避免卡片跳動。
                padding: selected ? '8px' : '10px',
                boxShadow: playing ? '0 0 0 4px #FFD43B' : 'none'
            }}
            animate={flash ? { scale: [1, 1.12, 1] } : { scale: playing ? 1.06 : 1 }}
            transition={{ duration: D, ease: 'easeOut' }}
        >
            <Flex align="center" justify="center" gap="6px">
                <Flex direction="column" gap="6px">
                    <MiniCell slot="initial" symbol={cells.initial} playing={playing} size={size} />
                    <MiniCell slot="medial" symbol={cells.medial} playing={playing} size={size} />
                    <MiniCell slot="final" symbol={cells.final} playing={playing} size={size} />
                </Flex>
                <MiniCell slot="tone" symbol={cells.tone} playing={playing} size={Math.round(size * 0.72)} />
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
                    top="-10px"
                    right="-10px"
                    width="26px"
                    height="26px"
                    borderRadius="13px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    style={{ border: '2px solid #ADB5BD', background: '#FFFFFF', color: '#868E96' }}
                >
                    <CloseIcon size={13} />
                </Box>
            )}
        </MotionBox>
    );
}
