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

/** 整列播放時，卡片與卡片之間的停頓。 */
export const DECK_GAP_MS = 500;

/** localStorage key：卡片組。 */
export const DECK_STORAGE_KEY = 'bopomofo.deck.v1';

/** localStorage key：右欄要顯示鍵盤還是海報。 */
export const RIGHT_PANE_STORAGE_KEY = 'bopomofo.rightpane.v1';

/** 匯入失敗時紅框閃爍的時間。 */
export const IMPORT_ERROR_MS = 600;

/** 迷你卡片相對於主字格的縮放比例。 */
export const CARD_SCALE = 0.35;
