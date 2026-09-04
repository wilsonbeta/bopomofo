'use client';

import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { Cells, Slot } from '@/lib/bopomofo';
import { ANIM_MS } from '@/lib/config';
import { EMPTY_BORDER, SLOT_COLOR } from '@/lib/palette';

const MotionBox = motion.create(Box);
const D = ANIM_MS / 1000;

interface CellProps {
    slot: Slot;
    symbol: string | null;
    highlighted: boolean;
    size: number;
    /** 聲調符號（ˉ ˊ ˇ ˋ ˙）的字面比其他注音小很多，要放大補回來。 */
    glyphScale?: number;
}

function Cell({ slot, symbol, highlighted, size, glyphScale = 0.62 }: CellProps) {
    const c = SLOT_COLOR[slot];
    return (
        <MotionBox
            data-slot={slot}
            data-symbol={symbol ?? ''}
            data-highlighted={highlighted ? 'true' : 'false'}
            width={`${size}px`}
            height={`${size}px`}
            borderRadius="18px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="700"
            lineHeight="1"
            userSelect="none"
            position="relative"
            zIndex={highlighted ? 2 : 1}
            style={{
                fontSize: `${size * glyphScale}px`,
                border: symbol ? `4px solid ${c.base}` : `4px dashed ${EMPTY_BORDER}`,
                color: highlighted ? c.ink : c.base,
                background: highlighted ? c.bright : 'transparent'
            }}
            animate={{ scale: highlighted ? 1.4 : 1 }}
            transition={{ duration: D, ease: 'easeOut' }}
        >
            {symbol ?? ''}
        </MotionBox>
    );
}

export interface SyllableBoardProps {
    cells: Cells;
    /** 目前高亮哪一格；'whole' = 四格一起脈動＋外框發光。 */
    active: Slot | 'whole' | null;
    /** 念完整串後的收尾彈跳。 */
    finished: boolean;
}

export function SyllableBoard({ cells, active, finished }: SyllableBoardProps) {
    const whole = active === 'whole';
    const size = 132;
    return (
        <MotionBox
            data-testid="syllable-board"
            padding="18px"
            borderRadius="28px"
            style={{
                boxShadow: whole ? '0 0 0 6px #FFD43B, 0 0 34px 10px rgba(255, 212, 59, 0.75)' : '0 0 0 0 rgba(0,0,0,0)'
            }}
            animate={whole ? { scale: [1, 1.08, 1] } : finished ? { y: [0, -14, 0] } : { scale: 1, y: 0 }}
            transition={{ duration: D, ease: 'easeOut' }}
        >
            <Flex align="center" gap="18px">
                <Flex direction="column" gap="20px">
                    <Cell slot="initial" symbol={cells.initial} highlighted={whole || active === 'initial'} size={size} />
                    <Cell slot="medial" symbol={cells.medial} highlighted={whole || active === 'medial'} size={size} />
                    <Cell slot="final" symbol={cells.final} highlighted={whole || active === 'final'} size={size} />
                </Flex>
                <Cell slot="tone" symbol={cells.tone} highlighted={whole || active === 'tone'} size={size * 0.72} />
            </Flex>
        </MotionBox>
    );
}
