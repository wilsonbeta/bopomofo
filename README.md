# 注音卡拉 OK

小朋友用鍵盤（或直接點畫面上的符號帶）把注音填進「上／中／下」三格＋右邊聲調格，
按 Enter 之後程式逐符號念出來，念到哪個符號，那一格就放大變色。

拼好的音可以存成卡片排在上面那一列：點卡片就念、拖曳排順序、整列連著念，
卡片自動存在瀏覽器裡，也能匯出成 JSON 帶到別台裝置。

畫面**完全不出現中文字**，所有按鈕都是圖示。

## 怎麼跑

```bash
yarn install
yarn dev        # 開 http://localhost:3000/bopomofo/
```

其他指令：

```bash
yarn build      # 型別檢查（tsc --noEmit）＋ 打包到 dist/
yarn preview    # 用打包後的檔案起一個站：http://localhost:4173/bopomofo/
```

**注意網址結尾的 `/bopomofo/`**：`vite.config.ts` 的 `base` 設成 `/bopomofo/`（GitHub Pages
的專案站台就在這個路徑底下），dev 與 preview 都照用同一個 base，免得「本機好好的、上線 404」。

技術上是 **Vite + React 19 + TypeScript**，版面全部原生 CSS（一支 `src/styles.css` ＋
元件的 inline style），動畫用 framer-motion、拖曳用 @dnd-kit。
不需要後端、不需要資料庫、不需要網路，也不載任何網路字型。
發聲用瀏覽器內建的 Web Speech API（`speechSynthesis`），語音來自系統內建的中文語音。

## 怎麼部署（GitHub Pages）

`.github/workflows/pages.yml` 已經寫好了：**push 到 `main` 就自動 build 並上線**，
用的是 GitHub 官方的 `configure-pages` / `upload-pages-artifact` / `deploy-pages`，
零 secret、零金鑰。

第一次要在 GitHub 上開一次開關（只做一次）：

1. repo → **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
2. push 一次 `main`，或到 **Actions → Deploy to GitHub Pages → Run workflow** 手動觸發。
3. 網址是 `https://<你的帳號>.github.io/bopomofo/`。

> repo 必須是 **public**，否則免費方案不能開 Pages。
> 換帳號或改 repo 名稱時，`vite.config.ts` 的 `base` 要跟著改成 `/<新的 repo 名>/`。

## iPad：加到主畫面

在 iPad 的 Safari 打開上面那個網址 → 分享 → **加入主畫面**。
之後從主畫面點開就是**獨立 app**：沒有網址列、沒有分頁列，整個畫面就是一張書頁。

- 橫著拿。畫面是固定 **1180×820** 的舞台等比縮放置中，**任何 iPad 都不會捲動、比例不變**
  （1024×768、1180×820、1366×1024 都實測過）。
- 舞台外的留白就是紙色 `#FAF7F1`，看不出邊界。
- 瀏海／Home indicator 靠 `env(safe-area-inset-*)` 讓出來，狀態列是 black-translucent。
- 圖示是 `public/icon-180.png`（彩色的「ㄅ」）。

## 怎麼玩

- 實體鍵盤是**大千式（標準式）注音鍵盤**，依實體鍵位判斷，不受目前輸入法影響。
    - `1`=ㄅ `2`=ㄉ `3`=ˇ `4`=ˋ `5`=ㄓ `6`=ˊ `7`=˙ `8`=ㄚ `9`=ㄞ `0`=ㄢ `-`=ㄦ
    - `Q`=ㄆ `W`=ㄊ `E`=ㄍ `R`=ㄐ `T`=ㄔ `Y`=ㄗ `U`=ㄧ `I`=ㄛ `O`=ㄟ `P`=ㄣ
    - `A`=ㄇ `S`=ㄋ `D`=ㄎ `F`=ㄑ `G`=ㄕ `H`=ㄘ `J`=ㄨ `K`=ㄜ `L`=ㄠ `;`=ㄤ
    - `Z`=ㄈ `X`=ㄌ `C`=ㄏ `V`=ㄒ `B`=ㄖ `N`=ㄙ `M`=ㄩ `,`=ㄝ `.`=ㄡ `/`=ㄥ
- 符號會依類別自動落格：聲母→上、介音→中、韻母→下、聲調→右。同類再敲一次＝取代該格。
- iPad 上沒有實體鍵盤也沒關係：**直接點右邊三條符號帶**，行為完全一樣。

### 快捷鍵

| 鍵 | 動作 |
|---|---|
| `Space` | 一聲 |
| `Enter` | 念目前的字格 |
| `Shift+Enter` | 整列播放（＝句子列左邊的 ▶▶） |
| `Cmd/Ctrl+S` | 儲存成卡片（＝字格底下的儲存鈕） |
| `Backspace` | 清最後填的一格（聲調 → 下 → 中 → 上） |
| `Esc` | 全清字格、取消選中、停止播放 |

## 版面：一張書頁

由上到下三塊，全部塞在 1180×820 的舞台裡，不捲動：

1. **品牌列**（高 28）：左上角小小的「ㄅㄆㄇ」三色字。
2. **句子列**：左端 ▶▶ 圓鈕、中間橫向卡片列（最右邊永遠留一個虛線空位）、
   右端匯出／匯入兩顆小鈕。整列播放中整條會亮起來、▶▶ 變成 ■。
3. **書頁**（白底圓角）：
   - 左邊是**字格**（三格 104 直排＋聲調格 76 在中格右側）與**動作列**（▶ 念一次／儲存／清除）。
   - 右邊是**三條符號帶**：聲母（橘）、介音（綠，右端掛著紫色的聲調小區）、韻母（藍）。
   - 三條帶的高度與間距（104 ＋ 14）跟左邊三格**完全相同**，所以「聲母帶對上格、
     介音帶對中格、韻母帶對下格」——中線是排出來的，不是湊出來的（實測差 0.0px）。

顏色全部來自 `src/lib/palette.ts`，元件裡不寫死任何 hex：
紙色 `#FAF7F1`、聲母 `#D9480F`、介音 `#2B8A3E`、韻母 `#1864AB`、聲調 `#862E9C`，
各自的 8% 當底色；動作黃 `#FFD43B`。

### 為什麼要用「舞台縮放」

整個 app 是一個固定 1180×820 的 `<div>`，外層算出 `min(可用寬/1180, 可用高/820)`
再整個 `transform: scale()` 置中——像遊戲畫面那樣。好處是**版面只要排一次**，
所有 iPad 與桌機看到的比例完全一樣，不用寫任何斷點。

代價有一個，已經修掉了：@dnd-kit 把「指標在螢幕上移動了幾 px」直接當成 CSS transform，
在縮放過的舞台裡卡片會跟不上手指。`MiniCard` 把拖曳位移**除以舞台倍率**修正
（`Stage.tsx` 的 `useStageScale()`），實測貼合誤差 0.0px。

另外 framer-motion 的 `animate={{ scale }}` 會接管同一個元素的 `transform`，
把 dnd-kit 寫的位移蓋掉——所以 `MiniCard` 是**外層純 div 管拖曳、內層 motion.div 管彈跳**，
這兩層不能合併。

## 卡片

### 操作

| 動作 | 怎麼做 |
|---|---|
| 新增 | 沒有選中卡片時按儲存鈕（或 `Cmd/Ctrl+S`），加在列表最後。字格不會清空 |
| 修改 | 點卡片載入到字格 → 改 → 再按儲存，覆寫該卡並保持選中 |
| 取消選中 | 按 `Esc`，或再點一次同一張卡。之後按儲存就是新增 |
| 單張播放 | 點卡片：載入字格、選中，並立刻念一次完整序列 |
| 刪除 | 卡片右上角的 ×，直接刪不確認 |
| 排序 | 拖卡片本體，**水平**拖曳 |
| 整列播放 | 句子列左邊的 ▶▶（或 `Shift+Enter`）。把整列串成**一句話一口氣念完**。播放中再按一次＝停止；播放中不能拖曳也不能刪 |

空字格按儲存不會有任何動作。卡片長得像課本裡的注音字：沒有格子框，空的格子不佔位，
一聲不標（`ˉ` 只在字格當「我按到了」的回饋）。

### 什麼音存得進去

**只有國語真的有的音存得進去**——判準就是 `src/lib/syllable-reading.ts` 這張 1250 個音節的表。
拼出 ㄈㄞ 這種不存在的音節按儲存，字格會**左右搖頭**、邊框閃一下紅，不會存進去，也不會跳任何文字。

- 想聽聽看不存在的音長什麼樣？**按 `Enter` 或點卡片不擋**，照樣會逐符號念給你聽——那本身就是回饋。
- 匯入的 json 只要有**任何一張**卡不合法，整份拒收。
- 但**已經存在瀏覽器裡的舊卡不會被刪**：不合法的會用紅框標示，整列播放時跳過它。

### 整列播放為什麼聲調聽起來會不一樣

▶▶ 是把整列卡片的代讀漢字接成**一個** utterance 交給引擎念，讓它自己處理句子韻律。
代價是**引擎會套國語的三聲連讀變調**：兩個三聲連在一起，前一個會念成二聲
（卡片寫 ㄇㄚˇ ㄏㄠˇ，聽到的是 ㄇㄚˊ ㄏㄠˇ）。

這是**刻意接受的**——真人念句子本來就會變調，這樣才自然。
如果你要的是「每張卡都念出它自己寫的聲調」，把 `src/lib/config.ts` 的
`SENTENCE_SEPARATOR` 從 `''` 改成 `'，'` 就好：

| | `''`（預設） | `'，'` |
|---|---|---|
| 聲調 | 會連讀變調 | 完全照卡片 |
| 卡片高亮 | 整列一起淡淡發光 | **逐張依序亮**，中間字格跟著換 |
| 三張卡的長度 | 0.717 秒 | 1.402 秒 |
| 聽感 | 一句話一氣呵成 | 字間有停頓，像慢慢念 |

（空白類分隔符沒有用，引擎會直接忽略；要有效必須是標點。這兩件事都是實測出來的，
數字寫在 `config.ts` 的註解裡。）

### 存在哪裡

自動存在瀏覽器的 `localStorage`，key 是 `bopomofo.deck.v1`。
沒有後端、沒有資料庫，換瀏覽器或清掉瀏覽資料就會不見——要保存請用匯出。
讀到壞掉的資料時會當成空的卡片組，不會讓畫面爆掉。

### 匯出／匯入

- **⤓ 匯出**：下載 `bopomofo-deck-YYYYMMDD.json`。
- **⤒ 匯入**：選一個 json 檔，**整份取代**現有卡片（不是附加）。
  檔案必須 `version` 是 `1`、每張卡的 `cells` 四欄都是該格合法的注音符號或 `null`；
  任何一項不合就整份不收，句子列閃一下紅框，現有卡片不受影響。

```json
{
    "version": 1,
    "cards": [
        {
            "id": "c...",
            "cells": { "initial": "ㄅ", "medial": null, "final": "ㄚ", "tone": "ˇ" }
        }
    ]
}
```

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
| `TOKEN_GAP_MS` | `180` | 同一張卡裡，符號與符號之間的停頓 |
| `SENTENCE_SEPARATOR` | `''` | 整列播放的字間分隔符。`''`＝自然連讀（會變調、整列發光）；`'，'`＝聲調正確＋逐卡高亮 |
| `BOUNDARY_FALLBACK_MS` | `900` | 等這麼久還沒收到 onboundary 就退回整列發光 |
| `SHAKE_MS` | `300` | 存到不合法音節時字格搖頭的時間 |
| `ANIM_MS` | `260` | 動畫長度上限 |

## 目錄

```
index.html                    進入點；iPad 全螢幕與 apple-touch-icon 的 meta 都在這
vite.config.ts                base: '/bopomofo/'、@ 別名
.github/workflows/pages.yml   push main → build → GitHub Pages
public/icon.svg               圖示原稿
public/icon-180.png           apple-touch-icon（180×180）

src/main.tsx                  掛載
src/App.tsx                   全部狀態與行為：播放、字格、卡片、鍵盤
src/styles.css                重置與舞台外框（100dvh ＋ safe-area）

src/components/Stage.tsx          1180×820 舞台的等比縮放與 useStageScale()
src/components/SentenceStrip.tsx  句子列：▶▶、卡片橫列、匯出匯入
src/components/MiniCard.tsx       一張卡（外層拖曳／內層動畫）
src/components/SyllableBoard.tsx  字格四格
src/components/SymbolBands.tsx    三條符號帶＋聲調小區
src/components/ActionRow.tsx      ▶ 念一次／儲存／清除
src/components/Icons.tsx          全部 inline SVG 圖示

src/lib/bopomofo.ts           注音符號分類、大千式鍵盤表、聲調詞、讀音代字表、整字字串組合
src/lib/speech.ts             語音挑選、token 序列、一 token 一 utterance 的循序播放
src/lib/config.ts             可切換常數
src/lib/palette.ts            全部色票（設計稿 note/design/gen.mjs 的 C）
src/lib/syllable-reading.ts   注音音節 → 代讀漢字（生成物，勿手改）
src/lib/deck.ts               卡片組的型別、驗證、localStorage、匯出匯入
scripts/                      代讀漢字表的生成腳本
note/design/                  設計稿（Main / Karaoke / Sentence .html ＋ gen.mjs）與驗收截圖
```
