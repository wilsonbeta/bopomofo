/**
 * 可切換常數集中處。改這裡就能換行為，不需要動元件。
 */

/**
 * 符號 token 的發音來源。
 *
 * - 'symbol'：直接把注音符號本身送進語音引擎（預設）。
 *   實測依據：macOS zh-TW 語音 Meijia（美佳）把「ㄅ」合成出的 PCM 與「玻」**逐位元組完全相同**，
 *   37 個符號中 36 個與教育部標準讀音代字完全相同（ㄇ 讀成「ㄇㄜ」而非「ㄇㄛ」），
 *   且 Wilson 已用耳朵確認 `say -v Meijia "ㄅ"` 念的是 /bo/。
 * - 'char'：改送 SYMBOL_CHAR_READING 的代字（純發音用，畫面永遠不顯示漢字）。
 *   供沒有 Meijia 的機器、或日後換引擎時備援。
 */
export const SYMBOL_READING_MODE: 'symbol' | 'char' = 'symbol';

/**
 * 找不到「能念注音符號」的語音時，是否自動退回代字讀音。
 * 實測：macOS 26.1 上 10 個 zh-TW 語音裡，只有 Meijia 念得出注音符號；
 * Eddy / Flo / Sandy / Grandma / Grandpa / Reed / Rocko / Shelley 對「ㄅ」輸出的是
 * 0.016 秒、RMS = 0 的**純靜音**。若沒有這層備援，選錯語音會導致整個程式無聲。
 */
export const AUTO_FALLBACK_TO_CHAR_READING = true;

/**
 * 整字 token 是否改送「代讀漢字」給語音引擎（漢字只進引擎，畫面永遠不顯示）。
 *
 * 實測依據：Meijia 對注音字串的整字解析**只對一部分音節有效**，含 ㄨ／ㄩ 的幾乎全滅：
 *   ㄅㄚˇ 0.248s == 把 0.248s（相同，OK）
 *   ㄔㄨㄤˋ 0.723s vs 創 0.365s（約兩倍長，退化成逐符號念）
 *   ㄨㄛˇ 0.436s vs 我 0.285s／ㄒㄩㄝˊ 0.797s vs 學 0.423s（同樣退化）
 * 所以整字改查 SYLLABLE_READING 表；查不到才退回注音字串。
 */
export const WHOLE_TOKEN_USE_HANZI_READING = true;

/** 敲鍵填入符號的當下，立刻念一次那個符號（單 utterance、不高亮）。 */
export const SPEAK_ON_KEY = true;

/** 語音偏好順序（比對 voice.name）。第一個命中的就用。 */
export const PREFERRED_VOICE_PATTERNS: RegExp[] = [/美佳/, /Meijia/i];

/** onend 沒回來時的保險絲：等待上限 = 文字長度 × 這個值，並夾在上下限之間。 */
export const UTTERANCE_TIMEOUT_PER_CHAR_MS = 700;
export const UTTERANCE_TIMEOUT_MIN_MS = 1500;
export const UTTERANCE_TIMEOUT_MAX_MS = 6000;

/** 每個 token 之間的空隙，讓小朋友聽得出一個一個。 */
export const TOKEN_GAP_MS = 180;

/** 動畫長度上限（ms）。 */
export const ANIM_MS = 260;

/** localStorage key：卡片組。 */
export const DECK_STORAGE_KEY = 'bopomofo.deck.v1';

/** localStorage key：右欄要顯示鍵盤還是海報。 */
export const RIGHT_PANE_STORAGE_KEY = 'bopomofo.rightpane.v1';

/** 匯入失敗時紅框閃爍的時間。 */
export const IMPORT_ERROR_MS = 600;

/** 迷你卡片相對於主字格的縮放比例。 */
export const CARD_SCALE = 0.35;

/**
 * 整列播放時，卡片代讀漢字之間插入的分隔符。
 *
 * **預設 `''`（不插分隔符）＝自然連讀**，Wilson 裁示：「變調沒關係，這樣才自然」。
 * 這條路的代價是實測出來的，寫在這裡免得日後有人以為是漏掉：
 *
 * 1. **引擎會套三聲連讀變調。** F0 輪廓比對（Meijia）：「馬好」的第一個音節 slope +2.23，
 *    與真的是二聲的「麻好」+2.19 幾乎重合，而孤立的「馬」是 slope -4.94（降到低的三聲）。
 *    也就是卡片寫 ㄇㄚˇ、念出來是 ㄇㄚˊ。這是刻意接受的取捨，不是 bug。
 * 2. **onboundary 會擠在句尾**，無法逐卡高亮：「貓媽蜜」全長 831ms，
 *    第 2、3 字的 boundary 都在 809ms 才一起到。此時自動退回「整列淡發光」。
 *
 * 設成 `'，'`（或任何標點：、、·、；效果完全相同）則反過來：
 * 聲調正確，且 onboundary 變成一字一個、間隔均勻（101 / 731 / 1243 / 1819 / 2341ms），
 * 逐卡高亮才能誠實地做，中欄字格也會跟著換成當前卡。代價是長度約兩倍、字間有停頓。
 *
 * **空白類無效**：全形／半形空白都會被引擎直接忽略，PCM 與不插時等長。只有標點有效。
 */
export const SENTENCE_SEPARATOR: string = '';

/** 整列播放開始後，等這麼久還沒收到任何 onboundary 就退回「整列淡發光」。 */
export const BOUNDARY_FALLBACK_MS = 900;

/** 存到不合法音節時，字格搖頭的時間。 */
export const SHAKE_MS = 300;
