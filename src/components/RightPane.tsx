'use client';

import { Box, Flex } from '@chakra-ui/react';
import { EMPTY_BORDER } from '@/lib/palette';
import { GridIcon, KeyboardIcon } from './Icons';
import { OnScreenKeyboard } from './OnScreenKeyboard';
import { PosterBoard } from './PosterBoard';

export type PaneMode = 'keyboard' | 'poster';

export interface RightPaneProps {
    mode: PaneMode;
    onModeChange: (mode: PaneMode) => void;
    onPress: (symbol: string) => void;
}

const SEGMENTS: { mode: PaneMode; Icon: typeof KeyboardIcon }[] = [
    { mode: 'keyboard', Icon: KeyboardIcon },
    { mode: 'poster', Icon: GridIcon }
];

/** 右欄：鍵盤 ⇄ 海報。兩種模式點按行為相同，都呼叫同一個 onPress。 */
export function RightPane({ mode, onModeChange, onPress }: RightPaneProps) {
    return (
        <Flex direction="column" align="center" gap="18px">
            <Flex
                data-testid="pane-toggle"
                data-pane-mode={mode}
                borderRadius="16px"
                overflow="hidden"
                style={{ border: `3px solid ${EMPTY_BORDER}` }}
            >
                {SEGMENTS.map(({ mode: m, Icon }) => {
                    const on = mode === m;
                    return (
                        <Box
                            as="button"
                            key={m}
                            data-pane-button={m}
                            aria-label={m}
                            aria-pressed={on}
                            onClick={() => onModeChange(m)}
                            width="72px"
                            height="46px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            cursor="pointer"
                            style={{
                                border: 'none',
                                background: on ? '#212529' : '#FFFFFF',
                                color: on ? '#FFFFFF' : '#868E96'
                            }}
                        >
                            <Icon size={26} />
                        </Box>
                    );
                })}
            </Flex>

            {mode === 'keyboard' ? <OnScreenKeyboard onPress={onPress} /> : <PosterBoard onPress={onPress} />}
        </Flex>
    );
}
