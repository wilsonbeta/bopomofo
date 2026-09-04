/**
 * 生成 src/lib/syllable-reading.ts：正規化注音音節 → 一個代讀漢字。
 *
 * 為什麼需要這張表：
 *   macOS Meijia 只對**一部分**注音字串解析得出整字音，含 ㄨ／ㄩ 的音節幾乎全滅
 *   （實測 ㄔㄨㄤˋ 0.723s vs 創 0.365s，明顯是退化成逐符號念）。
 *   所以「整字 token」改送漢字給語音引擎。漢字只進引擎，畫面永遠不顯示。
 *
 * 用法（原始辭典檔不進 repo，本機跑一次）：
 *   node scripts/build-syllable-reading.mjs <dict-revised.json> <dict-concised.audio.json>
 *
 * 來源：g0v moedict-data
 *   dict-revised.json          教育部重編國語辭典修訂本（陣列，含 heteronyms[].bopomofo、stroke_count）
 *   dict-concised.audio.json   簡編本（扁平 map，key = "詞.注音"），拿來當「常用字」過濾器
 */

import fs from 'node:fs';
import path from 'node:path';

const [revisedPath, concisedPath] = process.argv.slice(2);
if (!revisedPath || !concisedPath) {
    console.error('usage: node scripts/build-syllable-reading.mjs <dict-revised.json> <dict-concised.audio.json>');
    process.exit(1);
}

const INITIALS = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ';
const MEDIALS = 'ㄧㄨㄩ';
const FINALS = 'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ';
const TONES = 'ˊˇˋ˙';
const VALID = new RegExp(`^[${INITIALS}]?[${MEDIALS}]?[${FINALS}]?[${TONES}]?$`);

/**
 * moedict 的注音 → 我們的正規化寫法。
 * 一聲不帶符號（兩邊一致）；輕聲 moedict 是**前綴** ˙ㄧㄝ，我們用**字尾** ㄧㄝ˙
 * （前綴會被 Meijia 忽略、念成一聲，字尾才是真的輕聲）。
 */
function normalize(bopomofo) {
    if (!bopomofo) return null;
    let s = bopomofo.replace(/[\s　]/g, '');
    if (!s) return null;
    if (s.startsWith('˙')) s = s.slice(1) + '˙';
    if (!VALID.test(s)) return null;
    // 至少要有一個介音或韻母，純聲母不是完整音節（ㄓㄔㄕㄖㄗㄘㄙ 例外：空韻）
    if (!/[ㄧㄨㄩㄚ-ㄦ]/.test(s) && !/^[ㄓㄔㄕㄖㄗㄘㄙ][ˊˇˋ˙]?$/.test(s)) return null;
    return s;
}

const revised = JSON.parse(fs.readFileSync(revisedPath, 'utf8'));
const concised = JSON.parse(fs.readFileSync(concisedPath, 'utf8'));

/** 簡編本裡出現過的單字（＝常用字白名單）。 */
const commonChars = new Set();
for (const key of Object.keys(concised)) {
    const word = key.slice(0, key.indexOf('.'));
    if ([...word].length === 1) commonChars.add(word);
}

/** syllable -> 候選 {char, strokes, common, exact} */
const bySyllable = new Map();
const add = (syl, cand) => {
    if (!bySyllable.has(syl)) bySyllable.set(syl, []);
    bySyllable.get(syl).push(cand);
};

let singleCharEntries = 0;
for (const entry of revised) {
    if (!entry || !entry.title || [...entry.title].length !== 1) continue;
    if (!Array.isArray(entry.heteronyms) || entry.heteronyms.length === 0) continue;
    singleCharEntries++;
    const char = entry.title;
    if (!/[一-鿿]/.test(char)) continue; // 只要漢字
    const strokes = typeof entry.stroke_count === 'number' ? entry.stroke_count : 99;
    const common = commonChars.has(char);
    // 只挑「單音字」——只有一個 heteronym，唸法唯一，送進引擎不會挑錯破音。
    if (entry.heteronyms.length === 1) {
        const syl = normalize(entry.heteronyms[0].bopomofo);
        if (syl) add(syl, { char, strokes, common, tier: 0 });
        continue;
    }
    // 破音字：只當備胎，而且只認「第一個 heteronym」的讀音（辭典的主要讀音）。
    const first = normalize(entry.heteronyms[0].bopomofo);
    if (first) add(first, { char, strokes, common, tier: 1 });
}

/**
 * PCM 稽核修正表。
 *
 * 生成後我把 1250 個音節全部合成成 WAV 比對（`say -v Meijia`，22.05 kHz PCM）：
 *   744 個 = 注音字串與代讀漢字**位元組完全相同**（挑字方法本身的 sanity check，通過）
 *   406 個 = 注音字串明顯較長（退化成逐符號念），漢字才是對的 —— 這就是這張表的價值
 *    93 個 = 兩者時長相近但波形不同，需要再查
 * 對那 93 個再做「同讀音獨立字互證」：把辭典中同音節的其他單音字也合成出來，
 * 看有沒有 ≥2 個字產生完全相同的音訊。結果 25 個確認、52 個無法互證（候選不足）、
 * **16 個發現原本挑到的字被引擎唸錯**（例如「干」被唸成 ㄍㄢˋ、「砝」被唸成 ㄈㄚˊ），
 * 改成多數組的字。同一個多數組內的字音訊位元組完全相同，所以挑哪一個都一樣。
 */
const AUDIT_OVERRIDES = {
    'ㄅㄧˇ': '妣', 'ㄆㄤˊ': '螃', 'ㄈㄚˇ': '髮', 'ㄉㄡˇ': '抖', 'ㄉㄧㄥˇ': '頂',
    'ㄌㄧㄡˋ': '霤', 'ㄍㄢ': '甘', 'ㄍㄢˇ': '敢', 'ㄐㄧㄚˊ': '戛', 'ㄑㄧㄤˊ': '嬙',
    'ㄒㄩˇ': '姁', 'ㄔˇ': '侈', 'ㄕㄠ': '筲', 'ㄖㄠˊ': '饒', 'ㄢˇ': '唵', 'ㄧㄚˇ': '厊'
};

/** 排序：單音字優先 → 常用字優先 → 筆畫少者優先 → 字碼小者（穩定） */
function pick(cands) {
    return cands.slice().sort((a, b) =>
        a.tier - b.tier ||
        Number(b.common) - Number(a.common) ||
        a.strokes - b.strokes ||
        a.char.codePointAt(0) - b.char.codePointAt(0)
    )[0];
}

const table = {};
const fallbacks = [];
let overridden = 0;
for (const [syl, cands] of [...bySyllable.entries()].sort()) {
    const best = pick(cands);
    if (!best) continue;
    if (AUDIT_OVERRIDES[syl]) {
        table[syl] = AUDIT_OVERRIDES[syl];
        overridden++;
        continue;
    }
    table[syl] = best.char;
    if (best.tier === 1) fallbacks.push(`${syl}=${best.char}`);
}

const banner = `/**
 * 正規化注音音節 → 代讀漢字。**只進語音引擎，畫面永遠不顯示。**
 *
 * 由 scripts/build-syllable-reading.mjs 從 g0v moedict-data 生成，請勿手改。
 * 生成當下：${Object.keys(table).length} 個音節；${fallbacks.length} 個只找得到破音字（取辭典第一讀音）；
 * ${overridden} 個由 PCM 稽核修正（原本挑到的字會被語音引擎唸錯）。
 */`;

const body = Object.entries(table)
    .map(([k, v]) => `    '${k}': '${v}'`)
    .join(',\n');

const outPath = path.join(process.cwd(), 'src/lib/syllable-reading.ts');
fs.writeFileSync(outPath, `${banner}\nexport const SYLLABLE_READING: Record<string, string> = {\n${body}\n};\n`);

console.log(`single-char entries scanned : ${singleCharEntries}`);
console.log(`common chars (concised)     : ${commonChars.size}`);
console.log(`syllables written           : ${Object.keys(table).length}`);
console.log(`heteronym fallbacks         : ${fallbacks.length}`);
console.log(`PCM audit overrides applied : ${overridden}`);
console.log(`fallback list               : ${fallbacks.join(' ')}`);
console.log(`written to                  : ${outPath}`);
