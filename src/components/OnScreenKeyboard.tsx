'use client';

import { Box, Flex } from '@chakra-ui/react';
import { KEY_LAYOUT, slotOf } from '@/lib/bopomofo';
import { SLOT_COLOR } from '@/lib/palette';

export interface OnScreenKeyboardProps {
    onPress: (symbol: string) => void;
}

/** 給不熟鍵盤的孩子用：一排排大按鈕，排列與大千式實體鍵盤一致。 */
export function OnScreenKeyboard({ onPress }: OnScreenKeyboardProps) {
    return (
        <Flex direction="column" gap="8px" align="center">
            {KEY_LAYOUT.map((row, ri) => (
                <Flex key={ri} gap="8px" justify="center" wrap="wrap">
                    {row.map((k) => {
                        const slot = slotOf(k.symbol);
                        const c = slot ? SLOT_COLOR[slot] : SLOT_COLOR.initial;
                        return (
                            <Box
                                as="button"
                                key={k.code}
                                data-key-code={k.code}
                                aria-label={k.label}
                                onClick={() => onPress(k.symbol)}
                                width="60px"
                                height="60px"
                                borderRadius="14px"
                                fontSize="30px"
                                fontWeight="700"
                                lineHeight="1"
                                cursor="pointer"
                                transition="transform 120ms ease-out"
                                _active={{ transform: 'scale(0.9)' }}
                                style={{ border: `3px solid ${c.base}`, color: c.base, background: '#FFFFFF' }}
                            >
                                {k.symbol}
                            </Box>
                        );
                    })}
                </Flex>
            ))}
        </Flex>
    );
}
