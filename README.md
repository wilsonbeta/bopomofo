# 注音卡拉 OK

小朋友用鍵盤把注音填進「上／中／下」三格＋右邊聲調格，按 Enter 之後程式逐符號念出來，
念到哪個符號，畫面上那一格就放大變色。

## 怎麼跑

```bash
yarn install
yarn dev
# 開 http://localhost:3000
```

不需要後端、不需要資料庫、不需要網路。發聲用瀏覽器內建的 Web Speech API
（`speechSynthesis`），語音來自 macOS 系統內建的中文語音。

## 怎麼玩

- 鍵盤是**大千式（標準式）注音鍵盤**，依實體鍵位判斷，不受目前輸入法影響。
    - `1`=ㄅ `2`=ㄉ `3`=ˇ `4`=ˋ `5`=ㄓ `6`=ˊ `7`=˙ `8`=ㄚ `9`=ㄞ `0`=ㄢ `-`=ㄦ
    - `Q`=ㄆ `W`=ㄊ `E`=ㄍ `R`=ㄐ `T`=ㄔ `Y`=ㄗ `U`=ㄧ `I`=ㄛ `O`=ㄟ `P`=ㄣ
    - `A`=ㄇ `S`=ㄋ `D`=ㄎ `F`=ㄑ `G`=ㄕ `H`=ㄘ `J`=ㄨ `K`=ㄜ `L`=ㄠ `;`=ㄤ
    - `Z`=ㄈ `X`=ㄌ `C`=ㄏ `V`=ㄒ `B`=ㄖ `N`=ㄙ `M`=ㄩ `,`=ㄝ `.`=ㄡ `/`=ㄥ
- `Space` = 一聲、`Enter` = 念、`Backspace` = 清最後一格、`Esc` = 全清。
- 也可以直接用滑鼠點畫面下方的注音鍵盤。
- 符號會依類別自動落格：聲母→上、介音→中、韻母→下、聲調→右。同類再敲一次＝取代該格。

## 語音

**這個程式一定要用 Meijia（美佳）這個語音才有聲音。**

macOS 26.1 上實測：10 個 zh-TW 系統語音裡，只有 Meijia 念得出注音符號本身；
其他 9 個（Eddy / Flo / Sandy / Grandma / Grandpa / Reed / Rocko / Shelley）對「ㄅ」
合成出來的是 0.016 秒、RMS = 0 的**純靜音**。Chrome 的預設 zh-TW 語音剛好是 Eddy，
所以只設 `lang = 'zh-TW'` 會全程無聲。

`src/lib/speech.ts` 的 `pickVoice()` 會優先挑名字含「美佳 / Meijia」的語音；
真的挑不到時，`src/lib/config.ts` 的 `AUTO_FALLBACK_TO_CHAR_READING` 會讓符號改用
教育部標準讀音代字發音（純發音用，畫面上永遠不會出現漢字）。

### 整字為什麼要查漢字表

Meijia 對「整串注音字串」的解析**只對一部分音節有效**，含 ㄨ／ㄩ 的音節幾乎全滅，
會退化成一個一個符號念：

| 音節 | 送注音字串 | 送漢字 | 結果 |
|---|---|---|---|
| ㄅㄚˇ | 0.248s | 靶 0.248s | 位元組完全相同，注音字串 OK |
| ㄔㄨㄤˋ | 0.723s | 愴 0.365s | 約兩倍長 → 退化成逐符號念 |
| ㄨㄛˇ | 0.436s | 婑 0.285s | 同上 |
| ㄒㄩㄝˊ | 0.797s | 學 0.423s | 同上 |

所以「整字 token」改查 `src/lib/syllable-reading.ts`（1250 個音節 → 一個代讀漢字），
**漢字只送進語音引擎，畫面上永遠不顯示**，查不到才退回注音字串。

這張表由 `scripts/build-syllable-reading.mjs` 從 g0v moedict-data 生成
（原始辭典檔不進 repo，本機跑一次）：

```bash
node scripts/build-syllable-reading.mjs <dict-revised.json> <dict-concised.audio.json>
```

挑字規則：只挑**單音字**（`heteronyms` 長度 = 1，避開破音字）→ 簡編本收錄的常用字優先
→ 筆畫少者優先；再加上 16 個由 PCM 稽核修正的例外（原本挑到的字會被引擎唸錯，
例如「干」被唸成 ㄍㄢˋ）。

## 可切換常數

都在 `src/lib/config.ts`：

| 常數 | 預設 | 作用 |
|---|---|---|
| `SYMBOL_READING_MODE` | `'symbol'` | `'symbol'` 直接念注音符號；`'char'` 改念讀音代字 |
| `AUTO_FALLBACK_TO_CHAR_READING` | `true` | 挑不到 Meijia 時自動退回代字讀音 |
| `SPEAK_ON_KEY` | `true` | 敲鍵當下立刻念一次那個符號 |
| `WHOLE_TOKEN_USE_HANZI_READING` | `true` | 整字 token 送代讀漢字（關掉就退回送注音字串） |
| `PREFERRED_VOICE_PATTERNS` | `[/美佳/, /Meijia/i]` | 語音偏好順序 |

## 目錄

```
src/lib/bopomofo.ts   注音符號分類、大千式鍵盤表、聲調詞、讀音代字表、整字字串組合
src/lib/speech.ts     語音挑選、token 序列、一 token 一 utterance 的循序播放
src/lib/config.ts     可切換常數
src/lib/palette.ts    四類符號的顏色
src/lib/syllable-reading.ts  注音音節 → 代讀漢字（生成物，勿手改）
scripts/               代讀漢字表的生成腳本
src/components/       字格與螢幕鍵盤
src/app/              Next.js App Router 入口
```
