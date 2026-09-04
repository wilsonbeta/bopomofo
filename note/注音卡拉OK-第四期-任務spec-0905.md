# 注音卡拉OK 第四期 — 任務 spec（0905，Opus partner）

> 母題：注音卡拉 OK；三期已上線（HEAD `d59c7c9`）。本期＝**架構搬家（Next → Vite）＋ iPad 版面 redesign**，Wilson 0905 裁「就這麼決定」。
> **主線一句話**：同一套功能，變成一個在 iPad 橫向全螢幕、像 app 而不像網站的靜態頁；版面照 `note/design/Main.html` 做到像素級。

## 0. 結案判準

「iPad 打開 GitHub Pages 網址、加到主畫面、點開就是整個畫面一張書頁：上面一列句子卡、左邊字格、右邊三條符號帶對著三格。不會捲動、不會出現網址列。功能跟現在 localhost 一模一樣。」

## 1. 架構（已裁，不重開）

| 項目 | 裁定 |
|---|---|
| 建置 | **Vite + React 19 + TypeScript**。移除 Next.js、App Router、`providers.tsx`、`next.config.ts` |
| UI 庫 | **移除 Chakra 與 Emotion**。版面用原生 CSS（一支 `styles.css` ＋ 元件 inline style），動畫仍用 framer-motion，拖曳仍用 @dnd-kit |
| 保留不動 | `lib/bopomofo.ts`、`lib/speech.ts`、`lib/deck.ts`、`lib/syllable-reading.ts`、`lib/config.ts`、`scripts/`。**發聲、合法性、卡片資料、localStorage、匯出匯入的行為一律不變** |
| 部署 | GitHub Pages：`vite.config.ts` 設 `base: '/bopomofo/'`；加 `.github/workflows/pages.yml`（push main → build → deploy-pages，官方 actions，零 secret） |
| iPad app 感 | `index.html` 加 `apple-mobile-web-app-capable`、`apple-mobile-web-app-status-bar-style=black-translucent`、`viewport-fit=cover`、`apple-touch-icon`（一張 SVG/PNG，畫面是彩色的「ㄅ」）、`<title>` 用 `ㄅㄆㄇ` |
| 縮排 | 4 空格 |

## 2. 版面（照設計稿，`note/design/Main.html` 是權威，`gen.mjs` 有全部尺寸與色票）

### 2.1 縮放策略
- 設計基準 **1180×820**。整個 app 是一個固定 1180×820 的舞台，外層用 `transform: scale(min(vw/1180, vh/820))` 置中——像遊戲畫面那樣等比縮放，**任何 iPad（1024×768、1180×820、1366×1024）都不捲動、比例不變**。桌機瀏覽器也一樣。
- `body` 背景 `#FAF7F1`（紙色），舞台外的留白就是紙色，看不出邊界。

### 2.2 結構（由上到下）
1. **品牌列**（高 28）：左上角小小的「ㄅㄆㄇ」三色字，無其他東西。
2. **句子列**（`sentenceStrip`）：淡底 `#F3EEE5` 圓角 24；左端 ▶▶ 圓鈕 76；中間橫向卡片列（卡 92×132，課本排法：符號直疊、聲調在右、空格不佔位、一聲不標，角落 × 刪除），**最右邊永遠一個虛線空位**；右端匯出／匯入兩顆 44 小鈕直排。整列播放中：底變 `#FFF3BF`＋黃色柔光、▶▶ 變 ■。
3. **書頁**（白底、`#E4DDD0` 2px 邊、圓角 30、flex-grow）：
   - 左：**字格**（三格 104 直排、聲調格 76 在中格右側）＋ 下方**動作列**（▶ 168×76 黃、儲存 76 藍線框、清除 76 紫線框）。格子：有符號＝該色 8% 底＋該色 3px 實線邊；空＝虛線邊；播放高亮＝該色實心白字、scale 1.12；整字＝四格一起＋黃色外光。
   - 右：**三條符號帶**，每條高 104，與左邊三格**同高對齊**（帶的間距 14 ≈ 格的間距 14，微調到視覺上對齊為準）：
     - 聲母帶（橘 8% 底、左側 5px 橘色棒）：兩排 44 鍵 `ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏ` / `ㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ`
     - 介音帶（綠）：`ㄧㄨㄩ` 52 鍵；**同一條帶的右端**放聲調小區（紫 8% 底、紫棒、`ˉˊˇˋ˙` 48 鍵）
     - 韻母帶（藍）：兩排 44 鍵 `ㄚㄛㄜㄝㄞㄟㄠㄡ` / `ㄢㄣㄤㄥㄦ`
   - 鍵：該色 8% 底、該色符號、圓角 14、無邊框；按下 scale 0.9。
4. **螢幕上的大千鍵盤與「鍵盤／海報」切換：移除。** 實體鍵盤的大千鍵位（`CODE_TO_SYMBOL`）照常可用；`RightPane`、`OnScreenKeyboard`、`PosterBoard` 三個元件退役，`RIGHT_PANE_STORAGE_KEY` 移除。

### 2.3 色票（gen.mjs 的 `C`）
paper `#FAF7F1`、paper2 `#F3EEE5`、ink `#2B2A28`、line `#E4DDD0`、mute `#B8B0A2`；
聲母 `#D9480F`、介音 `#2B8A3E`、韻母 `#1864AB`、聲調 `#862E9C`（各自 8% 為底色）；
動作黃 `#FFD43B`／深 `#FAB005`／柔 `#FFF3BF`。**更新 `palette.ts` 為這組**，全 app 只從 palette 取色。
字型：`"Noto Sans TC", "PingFang TC", sans-serif`（不載 Google Fonts，iPad 用 PingFang 就對了）。

### 2.4 互動不變
敲鍵即念、Enter 念、Shift+Enter 整句、Cmd+S 存、Backspace／Esc、點卡片載入＋念、選中再存＝覆寫、拖曳排序（改 **horizontal** sorting strategy）、不合法搖頭、匯入紅框、舊壞卡標紅跳過——全部沿用第三期邏輯，只換殼。

## 3. 已知不確定處（★先查證）

1. **GitHub Pages 對 private repo 的限制**：免費方案的 private repo 不能開 Pages。用 `gh api /repos/wilsonbeta/bopomofo` 與 `gh api /user` 查 plan／visibility，**只查不改**，結果寫回報；要不要轉 public 由 Wilson 裁。
2. **scale-to-fit 舞台與 @dnd-kit**：transform 縮放的容器裡拖曳座標會偏——實測；偏了就用 dnd-kit 的 `modifiers` 或改在舞台內部算比例修正。
3. **iPad Safari 的 speechSynthesis 語音名稱**：iOS 上美佳的 `voice.name` 可能是「美佳」也可能是 `Meijia`，`PREFERRED_VOICE_PATTERNS` 已兩者皆比；本機無法實測 iPad，**標需人工**，但把 `pickVoice` 的退路（zh-TW local → zh-TW → zh）確認仍活著。
4. **`apple-mobile-web-app-capable` 全螢幕下 100vh／safe-area** 的行為，用 `100dvh`＋`env(safe-area-inset-*)`；本機用 Chrome 裝置模擬 iPad 橫向確認不捲動。

## 4. 驗收（實跑附證據）

1. `yarn build` 產出 `dist/`，`yarn preview` 開頁無 console error、DOM 無漢字；repo 內無 Next／Chakra／Emotion 依賴殘留（`package.json` 與 `yarn.lock` grep）。
2. Chrome 裝置模擬 **1180×820、1024×768、1366×1024** 三種橫向：`document.documentElement.scrollHeight <= clientHeight`（不捲動），截圖三張進回報（存 `note/design/shots/`）。
3. 截圖 1180×820 與 `note/design/Main.html` 在 Chrome 開的截圖並排比對：位置、尺寸、顏色一致（允許字型 metrics 差異）。
4. 第三期 §6 的功能驗收（存卡、點卡念、拖曳、整句一個 utterance、ㄈㄞ 搖頭、匯入紅框、舊壞卡跳過、重整保留）全部重跑一次——**因為換了殼，回歸必須全跑**。
5. 三條符號帶與三格的中線 y 座標各差 ≤ 4px（量出來寫進回報）。
6. `.github/workflows/pages.yml` 存在且 `act` 或至少 `yaml` 語法檢查通過；`base` 設對。
7. Safari 人工（標需人工）。

## 5. 交付

不 commit。寫 `note/注音卡拉OK-第四期-實作回報-0905.md`（§3 查證放最前面，附截圖路徑）、README 重寫「怎麼跑／怎麼部署／iPad 加到主畫面」。回報只回路徑＋五行摘要。
