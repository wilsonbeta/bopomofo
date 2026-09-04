import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionRow } from '@/components/ActionRow';
import { SentenceStrip } from '@/components/SentenceStrip';
import { Stage } from '@/components/Stage';
import { SymbolBands } from '@/components/SymbolBands';
import { COLUMN_TOP_PAD, SyllableBoard } from '@/components/SyllableBoard';
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
import { ANIM_MS, BOUNDARY_FALLBACK_MS, IMPORT_ERROR_MS, SENTENCE_SEPARATOR, SPEAK_ON_KEY } from '@/lib/config';
import {
    deckToJson,
    downloadJson,
    exportFilename,
    loadDeck,
    moveCard,
    newCardId,
    parseDeckJson,
    saveDeck,
    sentenceReadingOf,
    type Card
} from '@/lib/deck';
import { LINE, PAPER, SLOT_COLOR, WHITE } from '@/lib/palette';
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

/** 左上角的品牌字：三個注音、三個顏色，不放任何其他東西。 */
function Brand() {
    return (
        <div
            data-testid="brand"
            style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 2,
                userSelect: 'none'
            }}
        >
            <span style={{ color: SLOT_COLOR.initial }}>ㄅ</span>
            <span style={{ color: SLOT_COLOR.medial }}>ㄆ</span>
            <span style={{ color: SLOT_COLOR.final }}>ㄇ</span>
        </div>
    );
}

export default function App() {
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
    /** 整列播放拿不到可用的 onboundary 時，整列一起淡發光（不假裝逐卡同步）。 */
    const [deckGlow, setDeckGlow] = useState(false);
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

    /* ---------- 載入：語音、deck ---------- */

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

    useEffect(() => {
        setDeck(loadDeck());
        setHydrated(true);
    }, []);

    // 每次變動即寫。hydrated 擋掉「還沒讀進來就先寫空陣列」把既有資料洗掉。
    useEffect(() => {
        if (hydrated) saveDeck(deck);
    }, [deck, hydrated]);

    /* ---------- 播放：單張與整列共用同一顆取消信號 ---------- */

    /**
     * 停止所有播放並把高亮狀態清乾淨。
     *
     * `active`（字格高亮）與 `playingId`（卡片高亮）是兩套 state，但**只有一顆 signal**。
     * 停止的責任全放在這個函式裡——被中斷的迴圈只負責 return、不再碰任何 state。
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
     *
     * 不合法的舊卡直接跳過，但留在畫面上（紅框標示），不刪。
     */
    const playAll = useCallback(async () => {
        if (runningRef.current) {
            stopPlayback();
            return;
        }
        /**
         * 第五期起不再因為「不合法」跳過任何卡。這裡只會漏掉**連近似漢字都湊不出來**的卡
         * （base 在代讀表裡完全沒有任何聲調，例如 ㄈㄞ 這種國語沒有的音）——
         * 那種卡沒有東西可以念進句子裡，只能不放進這一句。
         */
        const speakable = deckRef.current
            .map((c) => ({ card: c, reading: sentenceReadingOf(c.cells) }))
            .filter((x): x is { card: Card; reading: string } => x.reading !== null);
        if (!speakable.length) return;
        const cards = speakable.map((x) => x.card);
        const readings = speakable.map((x) => x.reading);
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

    /** Esc／清除鈕：全清字格並取消選中。順手把還在跑的播放停掉，免得字格空了還在亮。 */
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

    /**
     * 有選中＝覆寫該卡並保持選中；沒選中＝存成新卡加在最後。字格都不清空。
     *
     * **第五期起不再擋任何音節。** 舊版用「代讀漢字表查不查得到」當合法性判準，
     * 但那張表本來就有洞（ㄅㄞˊ 這種破音字第二讀音、ㄉㄧ˙ 這種詞裡才出現的輕聲），
     * 於是小朋友打得出來的字反而存不進去。查不到現在只影響**發音走哪條路**。
     */
    const saveCard = useCallback(() => {
        const current = cellsRef.current;
        if (isEmpty(current)) return;
        const sel = selectedRef.current;
        if (sel && deckRef.current.some((c) => c.id === sel)) {
            setDeck((prev) => prev.map((c) => (c.id === sel ? { ...c, cells: current } : c)));
            flash(sel);
            return;
        }
        const card: Card = { id: newCardId(), cells: current };
        setDeck((prev) => [...prev, card]);
        flash(card.id);
    }, [flash]);

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
    const importDeck = useCallback(
        async (file: File) => {
            let parsed = null;
            try {
                // 只驗資料形狀（version、四格的值）；不再驗「這個音國語有沒有」。
                parsed = parseDeckJson(await file.text());
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
        },
        [stopPlayback]
    );

    /* ---------- 實體鍵盤（大千鍵位照常可用） ---------- */

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

    /* ---------- 版面：品牌列 → 句子列 → 書頁 ---------- */

    return (
        <Stage>
            <div
                data-testid="app"
                style={{
                    width: '100%',
                    height: '100%',
                    background: PAPER,
                    padding: '22px 28px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                    overflow: 'hidden'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 28 }}>
                    <Brand />
                </div>

                <SentenceStrip
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

                {/* 書頁：左邊字格＋動作列，右邊三條符號帶 */}
                <div
                    data-testid="page"
                    style={{
                        display: 'flex',
                        gap: 36,
                        alignItems: 'flex-start',
                        padding: '26px 28px',
                        borderRadius: 30,
                        background: WHITE,
                        border: `2px solid ${LINE}`,
                        flexGrow: 1,
                        minHeight: 0
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            alignItems: 'flex-start',
                            flexShrink: 0,
                            // 與右欄 SymbolBands 的 paddingTop 用同一個常數，三格與三條帶的中線才會完全重合。
                            paddingTop: COLUMN_TOP_PAD
                        }}
                    >
                        <SyllableBoard cells={cells} active={active} finished={finished} />
                        <ActionRow
                            playing={playing}
                            onPlay={() => void play()}
                            onSave={saveCard}
                            onClear={clearAll}
                        />
                    </div>

                    <SymbolBands onPress={insert} />
                </div>
            </div>
        </Stage>
    );
}
