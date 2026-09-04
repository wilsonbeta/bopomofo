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
    /**
     * 破音字：**每一個** heteronym 的讀音都登記成候選，不再只認第一讀音。
     *
     * 只認第一讀音會讓「只出現在第二讀音」的音節**整格消失**：
     * 白（ㄅㄛˊ／ㄅㄞˊ）的第一讀音是 ㄅㄛˊ，而 ㄅㄛˊ 那格又輸給單音字「帛」，
     * 於是 `ㄅㄞˊ` 在舊表裡根本不存在——小朋友打「白」就查不到代讀漢字。
     *
     * tier 1 = 該音節就是這個字的第一讀音（引擎最可能照這個音念）
     * tier 2 = 該音節是這個字的其他讀音（引擎有可能念成它的第一讀音，**必須過 PCM 稽核**）
     */
    entry.heteronyms.forEach((het, i) => {
        const syl = normalize(het.bopomofo);
        if (syl) add(syl, { char, strokes, common, tier: i === 0 ? 1 : 2 });
    });
}

/**
 * PCM 稽核修正表（第五期：**全表**多數決稽核，不再只查可疑的）。
 *
 * 做法：每個音節取排序後的前 5 個候選字，各用 `say -v Meijia` 合成一次，再加上
 * 該音節的**注音字串**當硬標準，然後：
 *   硬標準 796 個——某個候選字的音訊與注音字串**位元組相同**，那個字就是對的。
 *   多數決 381 個——候選字彼此音訊相同的分組，取最大的一組；落在組外的字
 *           就是被引擎念成別的音，剔除。
 *   只有一個候選 117 個、兩兩皆不同無法判定 37 個——沿用排序第一名。
 *
 * 這一輪總共把 150 個音節的字換掉。典型症狀是**冷僻單音字引擎不認得**：
 * 例如 `ㄑㄩㄢ` 舊表挑到「弮」（0.334s），與「圈」（0.471s）音訊不同——引擎念成了別的音。
 * 這也是第五期把候選排序改成「常用度優先於單音性」的原因。
 */
const AUDIT_OVERRIDES = {
    'ㄅㄚˋ': '爸', 'ㄅㄛˊ': '帛', 'ㄅㄛˋ': '播', 'ㄅㄠˋ': '抱', 'ㄅㄤˋ': '蚌',
    'ㄅㄥˇ': '琫', 'ㄅㄧ': '逼', 'ㄅㄧˇ': '比', 'ㄅㄧㄠ': '髟', 'ㄅㄧㄣ': '彬',
    'ㄆㄛˋ': '珀', 'ㄆㄟˋ': '沛', 'ㄆㄢˊ': '槃', 'ㄆㄥ': '怦', 'ㄆㄧ': '丕',
    'ㄆㄧㄝ': '瞥', 'ㄆㄧㄠ': '漂', 'ㄆㄧㄢ': '偏', 'ㄆㄧㄢˊ': '胼', 'ㄆㄨ': '噗',
    'ㄇㄛˊ': '摹', 'ㄇㄡˇ': '某', 'ㄇㄢ': '顢', 'ㄇㄢˊ': '瞞', 'ㄇㄧˋ': '汨',
    'ㄇㄧㄥˇ': '酩', 'ㄈㄚˇ': '髮', 'ㄈㄡ': '紑', 'ㄈㄡˊ': '芣', 'ㄈㄢ': '幡',
    'ㄈㄥˇ': '唪', 'ㄈㄨˇ': '甫', 'ㄉㄡˇ': '抖', 'ㄉㄧ': '低', 'ㄉㄧㄝˊ': '迭',
    'ㄉㄧㄢ': '掂', 'ㄉㄧㄥˇ': '頂', 'ㄉㄨˇ': '堵', 'ㄉㄨㄥˋ': '垌', 'ㄊㄚˋ': '沓',
    'ㄊㄧˊ': '啼', 'ㄊㄧㄝ': '貼', 'ㄋㄚˇ': '哪', 'ㄋㄚˊ': '拏', 'ㄋㄚˋ': '吶',
    'ㄋㄧㄣˊ': '您', 'ㄋㄩˋ': '恧', 'ㄌㄚˋ': '辣', 'ㄌㄜˋ': '垃', 'ㄌㄥˋ': '愣',
    'ㄌㄨˋ': '鹿', 'ㄍㄜˇ': '舸', 'ㄍㄠ': '皋', 'ㄍㄢ': '甘', 'ㄍㄢˇ': '敢',
    'ㄍㄤ': '肛', 'ㄍㄥ': '庚', 'ㄍㄥˋ': '更', 'ㄍㄨㄟˋ': '桂', 'ㄍㄨㄢˇ': '管',
    'ㄍㄨㄣˇ': '袞', 'ㄎㄜ': '柯', 'ㄎㄜˊ': '殼', 'ㄎㄞˇ': '凱', 'ㄎㄞˋ': '愾',
    'ㄎㄣˋ': '掯', 'ㄎㄨㄟˇ': '傀', 'ㄏㄜˋ': '賀', 'ㄏㄢˊ': '含', 'ㄏㄤˊ': '杭',
    'ㄏㄤˋ': '沆', 'ㄏㄨㄚ': '花', 'ㄏㄨㄟˇ': '悔', 'ㄏㄨㄣˊ': '魂', 'ㄏㄨㄥ': '訇',
    'ㄐㄧㄚˊ': '戛', 'ㄐㄧㄡ': '糾', 'ㄐㄩ': '拘', 'ㄐㄩㄢ': '娟', 'ㄑㄧˊ': '圻',
    'ㄑㄧㄚˇ': '酠', 'ㄑㄧㄠˊ': '僑', 'ㄑㄧㄡˊ': '囚', 'ㄑㄧㄤˇ': '搶', 'ㄑㄧㄤˊ': '嬙',
    'ㄑㄧㄤˋ': '蹌', 'ㄑㄩㄥ': '穹', 'ㄒㄧㄚ': '瞎', 'ㄒㄧㄠ': '宵', 'ㄒㄧㄠˊ': '洨',
    'ㄒㄧㄤˊ': '庠', 'ㄒㄧㄥˇ': '擤', 'ㄒㄩ': '戌', 'ㄒㄩˇ': '休', 'ㄒㄩㄝˊ': '踅',
    'ㄓㄜ': '遮', 'ㄓㄜˋ': '浙', 'ㄓㄞˊ': '宅', 'ㄓㄞˋ': '債', 'ㄓㄠ': '昭',
    'ㄓㄠˇ': '找', 'ㄓㄢ': '沾', 'ㄓㄣˋ': '朕', 'ㄓㄥ': '征', 'ㄓㄨˊ': '竹',
    'ㄓㄨㄛ': '捉', 'ㄓㄨㄛˊ': '灼', 'ㄓㄨㄢˋ': '撰', 'ㄔㄚˊ': '茶', 'ㄔㄜˋ': '掣',
    'ㄔㄞˇ': '茝', 'ㄔㄞˋ': '蠆', 'ㄔㄠˋ': '耖', 'ㄔㄨㄞˋ': '踹', 'ㄔㄨㄤ': '窗',
    'ㄕㄚ': '沙', 'ㄕㄜˋ': '社', 'ㄕㄞˇ': '骰', 'ㄕㄤˇ': '晌', 'ㄕㄨㄣˇ': '盾',
    'ㄖˋ': '日', 'ㄖㄜˇ': '惹', 'ㄖㄠˇ': '擾', 'ㄖㄠˊ': '饒', 'ㄗ': '孜',
    'ㄗㄚˊ': '砸', 'ㄗㄢˊ': '咱', 'ㄗㄤˇ': '駔', 'ㄗㄥ': '增', 'ㄗㄨˊ': '族',
    'ㄗㄨㄣˋ': '圳', 'ㄘㄠˋ': '肏', 'ㄘㄣ': '嵾', 'ㄘㄨㄢˊ': '巑', 'ㄙㄚ': '仨',
    'ㄙㄠˋ': '臊', 'ㄙㄡ': '搜', 'ㄙㄢˋ': '散', 'ㄙㄨㄣˋ': '巽', 'ㄞˋ': '艾',
    'ㄠˇ': '媼', 'ㄤ': '骯', 'ㄧㄚˇ': '亞', 'ㄧㄠ': '吆', 'ㄧㄢ': '胭',
    'ㄨˊ': '毋', 'ㄨㄟ': '威', 'ㄨㄟˇ': '偉', 'ㄨㄣˋ': '汶', 'ㄩㄢ': '冤'
};

/**
 * 候選排序：**常用度優先於單音性**。
 *
 * 舊規則是「單音字優先」，結果會挑到引擎根本不認得的冷僻單音字：
 * `ㄑㄩㄢ` 挑到「弮」，`say 弮` 與 `say 圈` 音訊不同——引擎把它念成別的音，
 * 而真正該念的「圈」因為是破音字（ㄑㄩㄢ／ㄐㄩㄢˋ）被排到後面。
 * 冷僻字對語音引擎是負債不是資產，所以改成：
 *   1. 簡編本收錄的常用字（不管是不是破音字）
 *   2. 其他單音字
 *   3. 其他破音字
 * 同一層再看「該音節是不是這個字的第一讀音」（引擎比較可能照第一讀音念），最後看筆畫。
 */
function rank(c) {
    return [
        c.common ? 0 : c.tier === 0 ? 1 : 2,
        c.tier === 2 ? 1 : 0,
        c.strokes,
        c.char.codePointAt(0)
    ];
}

function ordered(cands) {
    return cands.slice().sort((a, b) => {
        const ra = rank(a), rb = rank(b);
        for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
        return 0;
    });
}

function pick(cands) {
    return ordered(cands)[0];
}

const table = {};
const fallbacks = [];
/** 只在破音字的「非第一讀音」找得到字的音節——最需要 PCM 稽核的一批。 */
const secondReadings = [];
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
    if (best.tier === 2) secondReadings.push(`${syl}=${best.char}`);
}

const banner = `/**
 * 正規化注音音節 → 代讀漢字。**只進語音引擎，畫面永遠不顯示。**
 *
 * 由 scripts/build-syllable-reading.mjs 從 g0v moedict-data 生成，請勿手改。
 * 生成當下：${Object.keys(table).length} 個音節；${fallbacks.length} 個只找得到破音字的第一讀音、
 * ${secondReadings.length} 個只找得到破音字的非第一讀音；
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
console.log(`heteronym fallbacks (1st)   : ${fallbacks.length}`);
console.log(`heteronym fallbacks (2nd+)  : ${secondReadings.length}`);
console.log(`PCM audit overrides applied : ${overridden}`);
console.log(`second-reading list         : ${secondReadings.join(' ')}`);
console.log(`written to                  : ${outPath}`);
