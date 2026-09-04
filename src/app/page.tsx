'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { CardStrip } from '@/components/CardStrip';
import { SaveIcon } from '@/components/Icons';
import { RightPane, type PaneMode } from '@/components/RightPane';
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
import {
    ANIM_MS,
    BOUNDARY_FALLBACK_MS,
    IMPORT_ERROR_MS,
    RIGHT_PANE_STORAGE_KEY,
    SENTENCE_SEPARATOR,
    SHAKE_MS,
    SPEAK_ON_KEY
} from '@/lib/config';
import {
    deckToJson,
    downloadJson,
    exportFilename,
    isLegalCard,
    isLegalCells,
    loadDeck,
    moveCard,
    newCardId,
    parseDeckJson,
    readingOf,
    saveDeck,
    type Card
} from '@/lib/deck';
import { PAGE_BG, SLOT_COLOR } from '@/lib/palette';
import {
    buildSentence,
    buildTokens,
    cancelAll,
    cardIndexAt,
    pickVoice,
    playSequence,
    shouldUseCharReading,
    speakOne,
    waitForVoices
} from '@/lib/speech';

const MotionBox = motion.create(Box);

/** 三欄各包一層很淡的底，給「這裡是另一個功能區」的心理暗示，但不搶戲。 */
const PANEL = {
    background: 'rgba(0, 0, 0, 0.03)',
    borderRadius: '24px',
    padding: '20px'
} as const;

export default function Page() {
    const [cells, setCells] = useState<Cells>(EMPTY_CELLS);
    const [active, setActive] = useState<Slot | 'whole' | null>(null);
    const [finished, setFinished] = useState(false);
    const [playing, setPlaying] = useState(false);

    const [deck, setDeck] = useState<Card[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [flashId, setFlashId] = useState<string | null>(null);
    const [deckRunning, setDeckRunning] = useState(false);
    const [importError, setImportError] = useState(false);
    /** 整列播放拿不到可用的 onboundary 時，整欄一起淡發光（不假裝逐卡同步）。 */
    const [deckGlow, setDeckGlow] = useState(false);
    /** 存到不合法音節時，字格搖頭。 */
    const [shake, setShake] = useState(false);
    const [paneMode, setPaneMode] = useState<PaneMode>('keyboard');
    /**
     * localStorage 讀完了沒。
     *
     * 這個必須是 state 不能是 ref：ref 在同一次 commit 裡就會變 true，
     * 於是同一批 effect 中排在後面的「寫入」effect 會拿 deck 還是 []
     * 的舊值把 localStorage 洗掉（StrictMode 二次 mount 時會真的把卡片清光）。
     */
    const [hydrated, setHydrated] = useState(false);

    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const charReadingRef = useRef(false);
    const signalRef = useRef<{ cancelled: boolean }>({ cancelled: false });
    const cellsRef = useRef(cells);
    cellsRef.current = cells;
    const deckRef = useRef(deck);
    deckRef.current = deck;
    const selectedRef = useRef(selectedId);
    selectedRef.current = selectedId;
    const runningRef = useRef(false);

    /* ---------- 載入：語音、deck、右欄模式 ---------- */

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

    // localStorage 只能在 client 讀，所以放 effect 裡；直接在 render 讀會造成 hydration mismatch。
    useEffect(() => {
        setDeck(loadDeck());
        try {
            const m = window.localStorage.getItem(RIGHT_PANE_STORAGE_KEY);
            if (m === 'poster' || m === 'keyboard') setPaneMode(m);
        } catch {
            /* 讀不到就用預設 */
        }
        setHydrated(true);
    }, []);

    // 每次變動即寫。hydrated 擋掉「還沒讀進來就先寫空陣列」把既有資料洗掉。
    useEffect(() => {
        if (hydrated) saveDeck(deck);
    }, [deck, hydrated]);

    const changePaneMode = useCallback((m: PaneMode) => {
        setPaneMode(m);
        try {
            window.localStorage.setItem(RIGHT_PANE_STORAGE_KEY, m);
        } catch {
            /* 存不進去就算了 */
        }
    }, []);

    /* ---------- 播放：單張與整列共用同一顆取消信號 ---------- */

    /**
     * 停止所有播放並把高亮狀態清乾淨。
     *
     * §5-2 的重點：`active`（字格高亮）與 `playingId`（卡片高亮）是兩套 state，
     * 但**只有一顆 signal**。停止的責任全放在這個函式裡——被中斷的迴圈只負責 return、
     * 不再碰任何 state，所以不會有「cancel 後殘留高亮」或兩邊互相覆寫的情形。
     */
    const stopPlayback = useCallback(() => {
        signalRef.current.cancelled = true;
        runningRef.current = false;
        cancelAll();
        setActive(null);
        setPlaying(false);
        setDeckRunning(false);
        setPlayingId(null);
        setDeckGlow(false);
        setFinished(false);
    }, []);

    const newSignal = useCallback(() => {
        signalRef.current.cancelled = true;
        cancelAll();
        const s = { cancelled: false };
        signalRef.current = s;
        return s;
    }, []);

    /** 念一組四格（符號 → 聲調 → 整字），字格同步高亮。 */
    const runCells = useCallback(async (target: Cells, signal: { cancelled: boolean }) => {
        const tokens = buildTokens(target, charReadingRef.current);
        return playSequence(tokens, {
            voice: voiceRef.current,
            signal,
            onToken: (_i, t) => {
                if (!signal.cancelled) setActive(t.kind);
            },
            onTokenEnd: () => setActive(null)
        });
    }, []);

    /** 播放中再按念＝先 cancel 再重播，不疊音。 */
    const play = useCallback(
        async (override?: Cells) => {
            const target = override ?? cellsRef.current;
            if (isEmpty(target)) return;

            const signal = newSignal();
            runningRef.current = false;
            setDeckRunning(false);
            setPlayingId(null);
            setFinished(false);
            setPlaying(true);

            const completed = await runCells(target, signal);
            if (signal.cancelled) return;
            setActive(null);
            setPlaying(false);
            if (completed) {
                setFinished(true);
                setTimeout(() => setFinished(false), ANIM_MS + 60);
            }
        },
        [newSignal, runCells]
    );

    /**
     * 整列播放＝「念一句話」：把整列卡片的代讀漢字串成**一個 utterance** 念完，
     * 讓引擎自己處理句子韻律，而不是一張卡走一遍符號序列。
     *
     * 兩件事被 `SENTENCE_SEPARATOR` 綁在一起（都是實測結論，見 config 註解）：
     * 有分隔符 → 三聲不會被連讀變調，而且 onboundary 一字一個、間隔均勻 → **逐卡高亮**；
     * 沒有分隔符 → 會變調，且 onboundary 擠在句尾 → 退回**整列淡發光**，不假裝同步。
     * 就算有分隔符，事件沒來（換瀏覽器／換語音）也一樣退回發光。
     *
     * 不合法的舊卡直接跳過，但留在畫面上（紅框標示），不刪。
     */
    const playAll = useCallback(async () => {
        if (runningRef.current) {
            stopPlayback();
            return;
        }
        const cards = deckRef.current.filter(isLegalCard);
        if (!cards.length) return;
        const readings = cards.map((c) => readingOf(c.cells) as string);
        const { text, offsets } = buildSentence(readings);

        const signal = newSignal();
        runningRef.current = true;
        setPlaying(false);
        setFinished(false);
        setActive(null);
        setDeckRunning(true);

        const perCard = SENTENCE_SEPARATOR.length > 0;
        setDeckGlow(!perCard);
        setPlayingId(null);

        let gotBoundary = false;
        const fallback = perCard
            ? setTimeout(() => {
                  if (!gotBoundary && !signal.cancelled) {
                      setDeckGlow(true);
                      setPlayingId(null);
                  }
              }, BOUNDARY_FALLBACK_MS)
            : undefined;

        await speakOne(text, {
            voice: voiceRef.current,
            signal,
            // 整句比單 token 長很多，用預設的 6 秒上限會被保險絲提早切斷。
            timeoutMs: Math.max(4000, text.length * 900),
            onBoundary: perCard
                ? (charIndex) => {
                      if (signal.cancelled) return;
                      const i = cardIndexAt(charIndex, offsets, readings);
                      // 落在分隔符上：不屬於任何一張卡，保持現狀別亂跳。
                      if (i < 0) return;
                      gotBoundary = true;
                      setDeckGlow(false);
                      setPlayingId(cards[i].id);
                      setCells(cards[i].cells);
                  }
                : undefined
        });

        if (fallback) clearTimeout(fallback);
        if (signal.cancelled) return;
        runningRef.current = false;
        setActive(null);
        setPlayingId(null);
        setDeckGlow(false);
        setDeckRunning(false);
    }, [newSignal, stopPlayback]);

    /* ---------- 字格編輯 ---------- */

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

    /** Esc：全清字格並取消選中。順手把還在跑的播放停掉，免得字格空了還在亮。 */
    const clearAll = useCallback(() => {
        stopPlayback();
        setCells(EMPTY_CELLS);
        setSelectedId(null);
    }, [stopPlayback]);

    /* ---------- 卡片操作 ---------- */

    const flash = useCallback((id: string) => {
        setFlashId(id);
        setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), ANIM_MS + 40);
    }, []);

    /** 存不進去時的回饋：字格左右搖頭＋邊框短暫變紅，不彈任何文字。 */
    const rejectSave = useCallback(() => {
        setShake(true);
        setTimeout(() => setShake(false), SHAKE_MS);
    }, []);

    /**
     * 有選中＝覆寫該卡並保持選中；沒選中＝存成新卡加在最後。字格都不清空。
     * 音節查不到代讀漢字（例：ㄈㄞ）就不存，改成搖頭——這張表就是「國語有沒有這個音」的判準。
     */
    const saveCard = useCallback(() => {
        const current = cellsRef.current;
        if (isEmpty(current)) return;
        if (!isLegalCells(current)) {
            rejectSave();
            return;
        }
        const sel = selectedRef.current;
        if (sel && deckRef.current.some((c) => c.id === sel)) {
            setDeck((prev) => prev.map((c) => (c.id === sel ? { ...c, cells: current } : c)));
            flash(sel);
            return;
        }
        const card: Card = { id: newCardId(), cells: current };
        setDeck((prev) => [...prev, card]);
        flash(card.id);
    }, [flash, rejectSave]);

    /** 點卡片：已選中的再點一次＝取消選中；否則載入字格＋選中＋立刻念一次。 */
    const selectCard = useCallback(
        (id: string) => {
            if (runningRef.current) return;
            if (selectedRef.current === id) {
                stopPlayback();
                setSelectedId(null);
                return;
            }
            const card = deckRef.current.find((c) => c.id === id);
            if (!card) return;
            setCells(card.cells);
            setSelectedId(id);
            void play(card.cells);
        },
        [play, stopPlayback]
    );

    const deleteCard = useCallback((id: string) => {
        if (runningRef.current) return;
        setDeck((prev) => prev.filter((c) => c.id !== id));
        setSelectedId((cur) => (cur === id ? null : cur));
    }, []);

    const reorder = useCallback((fromId: string, toId: string) => {
        setDeck((prev) => moveCard(prev, fromId, toId));
    }, []);

    const exportDeck = useCallback(() => {
        downloadJson(exportFilename(), deckToJson(deckRef.current));
    }, []);

    /** 合法就整份取代；不合法閃紅框 600ms，什麼都不改。 */
    const importDeck = useCallback(async (file: File) => {
        let parsed = null;
        try {
            // 第二個參數＝匯入才開的嚴格關：任何一張音節不合法就整份拒收。
            parsed = parseDeckJson(await file.text(), true);
        } catch {
            parsed = null;
        }
        if (!parsed) {
            setImportError(true);
            setTimeout(() => setImportError(false), IMPORT_ERROR_MS);
            return;
        }
        stopPlayback();
        setDeck(parsed.cards);
        setSelectedId(null);
    }, [stopPlayback]);

    /* ---------- 鍵盤 ---------- */

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl+S＝儲存。瀏覽器預設是「儲存網頁」，一定要 preventDefault。
            if ((e.metaKey || e.ctrlKey) && e.code === 'KeyS') {
                e.preventDefault();
                saveCard();
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                e.preventDefault();
                if (e.shiftKey) void playAll();
                else void play();
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
            if (e.shiftKey) return;
            const symbol = CODE_TO_SYMBOL[e.code];
            if (symbol) {
                e.preventDefault();
                insert(symbol);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [play, playAll, saveCard, backspace, clearAll, insert]);

    /* ---------- 版面 ---------- */

    return (
        <Box minHeight="100vh" paddingY="34px" paddingX="16px" style={{ background: PAGE_BG }}>
            <Flex
                direction={{ base: 'column', lg: 'row' }}
                align={{ base: 'center', lg: 'flex-start' }}
                justify={{ base: 'center', lg: 'space-between' }}
                gap={{ base: '26px', lg: '40px' }}
                maxWidth="1400px"
                marginX="auto"
            >
            {/* 左欄：卡片列表。窄螢幕排到最後（字格 → 鍵盤 → 列表）。 */}
            <Box data-testid="panel-cards" order={{ base: 3, lg: 1 }} style={PANEL}>
                <CardStrip
                    cards={deck}
                    selectedId={selectedId}
                    playingId={playingId}
                    flashId={flashId}
                    running={deckRunning}
                    glow={deckGlow}
                    importError={importError}
                    onSelect={selectCard}
                    onDelete={deleteCard}
                    onReorder={reorder}
                    onPlayAll={() => void playAll()}
                    onExport={exportDeck}
                    onImport={(f) => void importDeck(f)}
                />
            </Box>

            {/* 中欄：字格＋按鈕。字格與按鈕列左緣對齊，不置中。 */}
            <Flex
                data-testid="panel-board"
                order={{ base: 1, lg: 2 }}
                direction="column"
                align="flex-start"
                gap="26px"
                style={PANEL}
            >
                <SyllableBoard cells={cells} active={active} finished={finished} shake={shake} />

                <Flex gap="14px" align="center">
                    <MotionBox
                        as="button"
                        data-testid="play"
                        aria-label="play"
                        onClick={() => void play()}
                        width="120px"
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
                        data-testid="save"
                        aria-label="save"
                        onClick={saveCard}
                        width="88px"
                        height="88px"
                        borderRadius="24px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        style={{
                            border: `4px solid ${SLOT_COLOR.final.base}`,
                            color: SLOT_COLOR.final.base,
                            background: '#FFFFFF'
                        }}
                    >
                        <SaveIcon size={44} />
                    </Box>

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
            </Flex>

            {/* 右欄：鍵盤 ⇄ 海報 */}
            <Box data-testid="panel-pane" order={{ base: 2, lg: 3 }} style={PANEL}>
                <RightPane mode={paneMode} onModeChange={changePaneMode} onPress={insert} />
            </Box>
            </Flex>
        </Box>
    );
}
