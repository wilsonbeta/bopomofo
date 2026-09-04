'use client';

import { Box, Flex } from '@chakra-ui/react';
import { TONES, slotOf, type Slot } from '@/lib/bopomofo';
import { SLOT_COLOR } from '@/lib/palette';

/**
 * 海報模式：國語課本的注音符號表順序，依用途分四區，聲調獨立一區。
 * 每一行是一組（ㄅㄆㄇㄈ／ㄉㄊㄋㄌ／…），行與行間距略大。
 * 區與區之間用淡底色塊區隔，**不用文字標題**——用一小塊該區顏色的色塊當區標。
 */
const ZONES: { slot: Slot; rows: readonly string[][] }[] = [
    {
        slot: 'initial',
        rows: [
            ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ'],
            ['ㄉ', 'ㄊ', 'ㄋ', 'ㄌ'],
            ['ㄍ', 'ㄎ', 'ㄏ'],
            ['ㄐ', 'ㄑ', 'ㄒ'],
            ['ㄓ', 'ㄔ', 'ㄕ', 'ㄖ'],
            ['ㄗ', 'ㄘ', 'ㄙ']
        ]
    },
    { slot: 'medial', rows: [['ㄧ', 'ㄨ', 'ㄩ']] },
    {
        slot: 'final',
        rows: [
            ['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ'],
            ['ㄞ', 'ㄟ', 'ㄠ', 'ㄡ'],
            ['ㄢ', 'ㄣ', 'ㄤ', 'ㄥ'],
            ['ㄦ']
        ]
    },
    { slot: 'tone', rows: [[...TONES]] }
];

/** 把該區的顏色調成很淡的底色。 */
function tint(hex: string, alpha: number): string {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export interface PosterBoardProps {
    onPress: (symbol: string) => void;
}

export function PosterBoard({ onPress }: PosterBoardProps) {
    // align="stretch" ＋ zone width 100%：四個 zone 由最寬的那一區（4 顆鍵）決定寬度，
    // 彼此等寬、左緣對齊；區內按鍵一律從左排起（justify="flex-start"）。
    return (
        <Flex data-testid="poster" direction="column" gap="14px" align="stretch">
            {ZONES.map((zone) => {
                const c = SLOT_COLOR[zone.slot];
                return (
                    <Box
                        key={zone.slot}
                        data-poster-zone={zone.slot}
                        width="100%"
                        position="relative"
                        paddingY="12px"
                        paddingLeft="22px"
                        paddingRight="14px"
                        borderRadius="18px"
                        style={{ background: tint(c.base, 0.07) }}
                    >
                        {/* 區標：一小塊該區的顏色，不用文字 */}
                        <Box
                            position="absolute"
                            left="8px"
                            top="12px"
                            bottom="12px"
                            width="6px"
                            borderRadius="3px"
                            style={{ background: c.base }}
                        />
                        <Flex direction="column" gap="10px">
                            {zone.rows.map((row, ri) => (
                                <Flex key={ri} gap="8px" justify="flex-start">
                                    {row.map((symbol) => {
                                        const slot = slotOf(symbol) ?? zone.slot;
                                        const sc = SLOT_COLOR[slot];
                                        return (
                                            <Box
                                                as="button"
                                                key={symbol}
                                                data-poster-key={symbol}
                                                aria-label={`poster-${symbol}`}
                                                onClick={() => onPress(symbol)}
                                                width="56px"
                                                height="56px"
                                                borderRadius="14px"
                                                fontSize="30px"
                                                fontWeight="700"
                                                lineHeight="1"
                                                cursor="pointer"
                                                transition="transform 120ms ease-out"
                                                _active={{ transform: 'scale(0.9)' }}
                                                style={{
                                                    border: `3px solid ${sc.base}`,
                                                    color: sc.base,
                                                    background: '#FFFFFF'
                                                }}
                                            >
                                                {symbol}
                                            </Box>
                                        );
                                    })}
                                </Flex>
                            ))}
                        </Flex>
                    </Box>
                );
            })}
        </Flex>
    );
}
