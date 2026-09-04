'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { OnScreenKeyboard } from '@/components/OnScreenKeyboard';
import { SyllableBoard } from '@/components/SyllableBoard';
import {
    CLEAR_ORDER,
    CODE_TO_SYMBOL,
    EMPTY_CELLS,
    SYMBOL_CHAR_READING,
    isEmpty,
    slotOf,
    type Cells,
    type Slot
} from '@/lib/bopomofo';
import { ANIM_MS, SPEAK_ON_KEY } from '@/lib/config';
import { PAGE_BG, SLOT_COLOR } from '@/lib/palette';
import {
    buildTokens,
    cancelAll,
    pickVoice,
    playSequence,
    shouldUseCharReading,
    speakOne,
    waitForVoices
} from '@/lib/speech';

const MotionBox = motion.create(Box);

export default function Page() {
    const [cells, setCells] = useState<Cells>(EMPTY_CELLS);
    const [active, setActive] = useState<Slot | 'whole' | null>(null);
    const [finished, setFinished] = useState(false);
    const [playing, setPlaying] = useState(false);

    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const charReadingRef = useRef(false);
    const signalRef = useRef<{ cancelled: boolean }>({ cancelled: false });
    const cellsRef = useRef(cells);
    cellsRef.current = cells;

    useEffect(() => {
        let alive = true;
        waitForVoices().then((voices) => {
            if (!alive) return;
            const v = pickVoice(voices);
            voiceRef.current = v;
            charReadingRef.current = shouldUseCharReading(v);
        });
        return () => {
            alive = false;
            cancelAll();
        };
    }, []);

    /** 敲鍵當下立刻念一次那個符號（單 utterance、不高亮）。 */
    const echoSymbol = useCallback((symbol: string) => {
        if (!SPEAK_ON_KEY) return;
        const text = charReadingRef.current ? SYMBOL_CHAR_READING[symbol] ?? symbol : symbol;
        void speakOne(text, { voice: voiceRef.current });
    }, []);

    const insert = useCallback(
        (symbol: string) => {
            const slot = slotOf(symbol);
            if (!slot) return;
            setFinished(false);
            // 同類再敲一次＝取代該格。
            setCells((prev) => ({ ...prev, [slot]: symbol }));
            echoSymbol(symbol);
        },
        [echoSymbol]
    );

    const backspace = useCallback(() => {
        setFinished(false);
        setCells((prev) => {
            for (const slot of CLEAR_ORDER) {
                if (prev[slot]) return { ...prev, [slot]: null };
            }
            return prev;
        });
    }, []);

    const clearAll = useCallback(() => {
        setFinished(false);
        setCells(EMPTY_CELLS);
    }, []);

    /** 播放中再按念＝先 cancel 再重播，不疊音。 */
    const play = useCallback(async () => {
        const current = cellsRef.current;
        if (isEmpty(current)) return;

        signalRef.current.cancelled = true;
        cancelAll();
        const signal = { cancelled: false };
        signalRef.current = signal;

        setFinished(false);
        setPlaying(true);
        const tokens = buildTokens(current, charReadingRef.current);
        const completed = await playSequence(tokens, {
            voice: voiceRef.current,
            signal,
            onToken: (_i, t) => setActive(t.kind),
            onTokenEnd: () => setActive(null)
        });
        if (signal.cancelled) return;
        setActive(null);
        setPlaying(false);
        if (completed) {
            setFinished(true);
            setTimeout(() => setFinished(false), ANIM_MS + 60);
        }
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                e.preventDefault();
                void play();
                return;
            }
            if (e.code === 'Backspace') {
                e.preventDefault();
                backspace();
                return;
            }
            if (e.code === 'Escape') {
                e.preventDefault();
                clearAll();
                return;
            }
            const symbol = CODE_TO_SYMBOL[e.code];
            if (symbol) {
                e.preventDefault();
                insert(symbol);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [play, backspace, clearAll, insert]);

    return (
        <Flex
            direction="column"
            align="center"
            gap="26px"
            minHeight="100vh"
            paddingY="34px"
            paddingX="16px"
            style={{ background: PAGE_BG }}
        >
            <SyllableBoard cells={cells} active={active} finished={finished} />

            <Flex gap="18px" align="center">
                <MotionBox
                    as="button"
                    data-testid="play"
                    aria-label="play"
                    onClick={() => void play()}
                    width="132px"
                    height="88px"
                    borderRadius="24px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    style={{ border: 'none', background: playing ? '#FFD43B' : '#FFC078' }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: ANIM_MS / 1000 }}
                >
                    <Box
                        width="0"
                        height="0"
                        style={{
                            borderTop: '26px solid transparent',
                            borderBottom: '26px solid transparent',
                            borderLeft: '42px solid #212529',
                            marginLeft: '8px'
                        }}
                    />
                </MotionBox>

                <Box
                    as="button"
                    data-testid="clear"
                    aria-label="clear"
                    onClick={clearAll}
                    width="88px"
                    height="88px"
                    borderRadius="24px"
                    cursor="pointer"
                    style={{ border: `4px solid ${SLOT_COLOR.tone.base}`, background: '#FFFFFF' }}
                >
                    <Box
                        margin="0 auto"
                        width="38px"
                        height="6px"
                        borderRadius="3px"
                        style={{ background: SLOT_COLOR.tone.base }}
                    />
                </Box>
            </Flex>

            <OnScreenKeyboard onPress={insert} />
        </Flex>
    );
}
