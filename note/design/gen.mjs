// 產生注音卡拉OK iPad 版面的設計 artboards（.dc.html）
import fs from 'node:fs';

const C = {
    paper: '#FAF7F1', paper2: '#F3EEE5', ink: '#2B2A28', line: '#E4DDD0', mute: '#B8B0A2',
    initial: '#D9480F', medial: '#2B8A3E', final: '#1864AB', tone: '#862E9C',
    initialT: 'rgba(217,72,15,0.08)', medialT: 'rgba(43,138,62,0.08)', finalT: 'rgba(24,100,171,0.08)', toneT: 'rgba(134,46,156,0.08)',
    yellow: '#FFD43B', yellowDeep: '#FAB005', yellowSoft: '#FFF3BF'
};
const T = { initial: C.initialT, medial: C.medialT, final: C.finalT, tone: C.toneT };

const INITIALS = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ';
const MEDIALS = 'ㄧㄨㄩ';
const FINALS = 'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ';
const TONES = ['ˉ', 'ˊ', 'ˇ', 'ˋ', '˙'];
const slotOf = (s) => INITIALS.includes(s) ? 'initial' : MEDIALS.includes(s) ? 'medial' : FINALS.includes(s) ? 'final' : 'tone';

const KB_ROWS = [
    ['ㄅ','ㄉ','ˇ','ˋ','ㄓ','ˊ','˙','ㄚ','ㄞ','ㄢ','ㄦ'],
    ['ㄆ','ㄊ','ㄍ','ㄐ','ㄔ','ㄗ','ㄧ','ㄛ','ㄟ','ㄣ'],
    ['ㄇ','ㄋ','ㄎ','ㄑ','ㄕ','ㄘ','ㄨ','ㄜ','ㄠ','ㄤ'],
    ['ㄈ','ㄌ','ㄏ','ㄒ','ㄖ','ㄙ','ㄩ','ㄝ','ㄡ','ㄥ']
];
const POSTER = [
    { slot: 'initial', rows: [['ㄅ','ㄆ','ㄇ','ㄈ'],['ㄉ','ㄊ','ㄋ','ㄌ'],['ㄍ','ㄎ','ㄏ'],['ㄐ','ㄑ','ㄒ'],['ㄓ','ㄔ','ㄕ','ㄖ'],['ㄗ','ㄘ','ㄙ']] },
    { slot: 'medial', rows: [['ㄧ','ㄨ','ㄩ']] },
    { slot: 'final', rows: [['ㄚ','ㄛ','ㄜ','ㄝ'],['ㄞ','ㄟ','ㄠ','ㄡ'],['ㄢ','ㄣ','ㄤ','ㄥ'],['ㄦ']] },
    { slot: 'tone', rows: [TONES] }
];

// ---------- icons (stroke, 24 grid) ----------
const svg = (inner, size = 24, stroke = 'currentColor') =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const I = {
    play: (s = 28, col = C.ink) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${col}"><path d="M7 4.5v15l12-7.5z"/></svg>`,
    playAll: (s = 28, col = C.ink) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${col}"><path d="M3 5v14l8-7z"/><path d="M12 5v14l8-7z"/></svg>`,
    stop: (s = 24, col = C.ink) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${col}"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>`,
    save: (s = 26) => svg('<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 19h16"/>', s),
    clear: (s = 26) => svg('<path d="M5 12h14"/>', s),
    close: (s = 14) => svg('<path d="M6 6l12 12"/><path d="M18 6L6 18"/>', s),
    exportI: (s = 22) => svg('<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 19h16"/>', s),
    importI: (s = 22) => svg('<path d="M12 19V8"/><path d="M7 12l5-5 5 5"/><path d="M4 4h16"/>', s),
    keyboard: (s = 22) => svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>', s),
    poster: (s = 22) => svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>', s)
};

// ---------- pieces ----------
function key(sym, opt = {}) {
    const slot = slotOf(sym);
    const size = opt.size ?? 60;
    const fs = slot === 'tone' ? Math.round(size * 0.46) : Math.round(size * 0.5);
    return `<div class="key" style="width: ${size}px; height: ${size}px; background: ${T[slot]}; color: ${C[slot]}; font-size: ${fs}px;">${sym}</div>`;
}

function keyboardPanel(active = 'keyboard') {
    const rows = KB_ROWS.map((r, i) =>
        `<div style="display: flex; gap: 8px; justify-content: flex-start; padding-left: ${i * 18}px;">${r.map((s) => key(s)).join('')}</div>`
    ).join('');
    return `
    <div style="display: flex; flex-direction: column; gap: 10px;">${rows}</div>`;
}

function posterPanel() {
    return `<div style="display: flex; flex-direction: column; gap: 12px;">${POSTER.map((z) => `
      <div style="display: flex; gap: 12px; align-items: stretch; padding: 10px 12px; border-radius: 16px; background: ${T[z.slot]};">
        <div style="width: 5px; border-radius: 3px; background: ${C[z.slot]};"></div>
        <div style="display: flex; flex-direction: column; gap: 6px;">${z.rows.map((r) =>
            `<div style="display: flex; gap: 6px;">${r.map((s) => key(s, { size: 46 })).join('')}</div>`).join('')}
        </div>
      </div>`).join('')}
    </div>`;
}

function modeToggle(active) {
    const btn = (name, icon) => `<div class="seg ${active === name ? 'on' : ''}">${icon}</div>`;
    return `<div style="display: flex; gap: 4px; padding: 4px; border-radius: 14px; background: ${C.paper2};">
      ${btn('keyboard', I.keyboard())}${btn('poster', I.poster())}
    </div>`;
}

function rightPane(mode) {
    return `
    <div style="display: flex; flex-direction: column; gap: 16px; width: 448px; flex-shrink: 0; align-items: flex-end;">
      ${modeToggle(mode)}
      <div style="align-self: stretch;">${mode === 'poster' ? posterPanel() : keyboardPanel()}</div>
    </div>`;
}

/** 字格：像生字簿一格。cells = {initial, medial, final, tone}，hl = 高亮哪一格 */
function board(cells, hl = null, whole = false) {
    const cell = (slot, sym, size) => {
        const on = whole || hl === slot;
        const fill = sym ? (on ? C[slot] : '#FFFFFF') : 'transparent';
        const color = on ? '#FFFFFF' : C[slot];
        const border = sym ? `3px solid ${C[slot]}` : `3px dashed ${C.line}`;
        const scale = on && !whole ? 'transform: scale(1.14);' : '';
        const fs = slot === 'tone' ? Math.round(size * 0.5) : Math.round(size * 0.62);
        return `<div style="width: ${size}px; height: ${size}px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${fs}px; line-height: 1; background: ${fill}; color: ${color}; border: ${border}; ${scale} transition: transform 200ms;">${sym ?? ''}</div>`;
    };
    const glow = whole ? `box-shadow: 0 0 0 6px ${C.yellow}, 0 0 40px 12px rgba(255,212,59,0.55);` : '';
    return `
    <div style="position: relative; width: 420px; height: 420px; border-radius: 28px; background: #FFFFFF; border: 2px solid ${C.line}; ${glow}">
      <div style="position: absolute; left: 50%; top: 20px; bottom: 20px; width: 0; border-left: 2px dashed ${C.paper2};"></div>
      <div style="position: absolute; top: 50%; left: 20px; right: 20px; height: 0; border-top: 2px dashed ${C.paper2};"></div>
      <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 22px;">
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${cell('initial', cells.initial, 104)}${cell('medial', cells.medial, 104)}${cell('final', cells.final, 104)}
        </div>
        ${cell('tone', cells.tone, 76)}
      </div>
    </div>`;
}


/** 一張書頁：左邊字格、右邊符號表，三條符號帶與上／中／下三格同高對齊。 */
function page(cells, hl = null, whole = false, playing = false) {
    const band = (slot, groups, extra = '') => `
      <div style="display: flex; align-items: center; gap: 22px; height: 104px; padding: 0 16px; border-radius: 22px; background: ${T[slot]};">
        <div style="width: 5px; height: 56px; border-radius: 3px; background: ${C[slot]}; flex-shrink: 0;"></div>
        ${groups}${extra}
      </div>`;
    const row = (syms, size = 48) => `<div style="display: flex; gap: 6px;">${syms.map((x) => key(x, { size })).join('')}</div>`;
    const initials = `<div style="display: flex; flex-direction: column; gap: 6px;">
        ${row(['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ'], 44)}
        ${row(['ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ'], 44)}
      </div>`;
    const medials = row(['ㄧ','ㄨ','ㄩ'], 52);
    const tones = `<div style="display: flex; align-items: center; gap: 14px; margin-left: auto; padding: 6px 10px 6px 16px; border-radius: 18px; background: ${C.toneT};">
        <div style="width: 5px; height: 40px; border-radius: 3px; background: ${C.tone};"></div>${row(TONES, 48)}
      </div>`;
    const finals = `<div style="display: flex; flex-direction: column; gap: 6px;">
        ${row(['ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ'], 44)}
        ${row(['ㄢ','ㄣ','ㄤ','ㄥ','ㄦ'], 44)}
      </div>`;
    return `
    <div style="display: flex; gap: 36px; align-items: flex-start; padding: 26px 28px; border-radius: 30px; background: #FFFFFF; border: 2px solid ${C.line}; flex-grow: 1;">
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: flex-start; flex-shrink: 0;">
        ${boardCells(cells, hl, whole)}
        ${actionRow(playing)}
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px; flex-grow: 1; padding-top: 2px;">
        ${band('initial', initials)}
        ${band('medial', medials, tones)}
        ${band('final', finals)}
      </div>
    </div>`;
}

/** 字格本體（不再包白色方塊：整張書頁就是白的），四格與右側三條帶同高。 */
function boardCells(cells, hl = null, whole = false) {
    const cell = (slot, sym, size) => {
        const on = whole || hl === slot;
        const fill = sym ? (on ? C[slot] : T[slot]) : 'transparent';
        const color = on ? '#FFFFFF' : C[slot];
        const border = sym ? `3px solid ${C[slot]}` : `3px dashed ${C.line}`;
        const scale = on && !whole ? 'transform: scale(1.12);' : '';
        const fs = slot === 'tone' ? Math.round(size * 0.5) : Math.round(size * 0.62);
        return `<div style="width: ${size}px; height: ${size}px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${fs}px; line-height: 1; background: ${fill}; color: ${color}; border: ${border}; ${scale} transition: transform 200ms;">${sym ?? ''}</div>`;
    };
    const glow = whole ? `box-shadow: 0 0 0 6px ${C.yellow}, 0 0 40px 12px rgba(255,212,59,0.55);` : '';
    return `
    <div style="display: flex; align-items: center; gap: 18px; padding: 0 10px; border-radius: 28px; ${glow}">
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${cell('initial', cells.initial, 104)}${cell('medial', cells.medial, 104)}${cell('final', cells.final, 104)}
      </div>
      ${cell('tone', cells.tone, 76)}
    </div>`;
}

function actionRow(playing = false) {
    return `
    <div style="display: flex; gap: 16px; align-items: center;">
      <div class="btn" style="width: 168px; height: 76px; background: ${playing ? C.yellowDeep : C.yellow};">${I.play(34)}</div>
      <div class="btn" style="width: 76px; height: 76px; background: #FFFFFF; border: 2.5px solid ${C.final}; color: ${C.final};">${I.save()}</div>
      <div class="btn" style="width: 76px; height: 76px; background: #FFFFFF; border: 2.5px solid ${C.tone}; color: ${C.tone};">${I.clear()}</div>
    </div>`;
}

/** 句子卡：課本排法，空格不佔位、一聲不標 */
function card(cells, opt = {}) {
    const stack = ['initial', 'medial', 'final'].filter((s) => cells[s]).map((s) =>
        `<div style="font-size: 34px; font-weight: 700; line-height: 1.05; color: ${C[s]};">${cells[s]}</div>`).join('');
    const tone = cells.tone && cells.tone !== 'ˉ' ? `<div style="font-size: 26px; font-weight: 700; color: ${C.tone}; width: 18px;">${cells.tone}</div>` : '<div style="width: 18px;"></div>';
    const bg = opt.playing ? C.yellowSoft : '#FFFFFF';
    const border = opt.selected ? `2px solid ${C.ink}` : opt.illegal ? `2px solid #E03131` : `1.5px solid ${C.line}`;
    const shadow = opt.playing ? `box-shadow: 0 0 0 4px ${C.yellow};` : '';
    return `
    <div style="position: relative; width: 92px; height: 132px; border-radius: 16px; background: ${bg}; border: ${border}; ${shadow} display: flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">${stack}</div>
      ${tone}
      <div style="position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 12px; background: #FFFFFF; border: 1.5px solid ${C.line}; color: ${C.mute}; display: flex; align-items: center; justify-content: center;">${I.close()}</div>
    </div>`;
}

function sentenceStrip(cards, opt = {}) {
    const running = opt.running;
    return `
    <div style="display: flex; align-items: center; gap: 18px; padding: 16px 18px; border-radius: 24px; background: ${running ? C.yellowSoft : C.paper2}; ${running ? `box-shadow: 0 0 28px 6px rgba(255,212,59,0.45);` : ''}">
      <div class="btn" style="width: 76px; height: 76px; border-radius: 38px; background: ${running ? C.yellowDeep : C.yellow}; flex-shrink: 0;">${running ? I.stop(30) : I.playAll(32)}</div>
      <div style="display: flex; align-items: center; gap: 14px; flex-grow: 1; overflow: hidden; padding: 10px 4px;">
        ${cards.map((c) => card(c.cells, c)).join('')}
        <div style="width: 92px; height: 132px; border-radius: 16px; border: 2px dashed ${C.line}; flex-shrink: 0;"></div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
        <div class="btn" style="width: 44px; height: 44px; border-radius: 12px; background: #FFFFFF; border: 2px solid ${C.final}; color: ${C.final};">${I.exportI()}</div>
        <div class="btn" style="width: 44px; height: 44px; border-radius: 12px; background: #FFFFFF; border: 2px solid ${C.medial}; color: ${C.medial};">${I.importI()}</div>
      </div>
    </div>`;
}

function brand() {
    return `<div style="display: flex; align-items: baseline; gap: 4px; font-weight: 700; font-size: 22px; letter-spacing: 2px;">
      <span style="color: ${C.initial};">ㄅ</span><span style="color: ${C.medial};">ㄆ</span><span style="color: ${C.final};">ㄇ</span>
    </div>`;
}

const HEAD = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700&display=swap">
  <style>
    body { margin: 0; font-family: "Noto Sans TC", "PingFang TC", "Heiti TC", sans-serif; color: ${C.ink}; }
    a { color: ${C.final}; } a:hover { color: ${C.initial}; }
    .key { border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 700; line-height: 1; user-select: none; }
    .btn { border-radius: 22px; display: flex; align-items: center; justify-content: center; }
    .seg { width: 52px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; color: ${C.mute}; }
    .seg.on { background: #FFFFFF; color: ${C.ink}; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
  </style>
</helmet>`;
const TAIL = `</x-dc>
</body>
</html>`;

function screen({ cards, cells, hl, whole, running, playing, mode }) {
    return `${HEAD}
<div style="width: 1180px; height: 820px; box-sizing: border-box; background: ${C.paper}; padding: 22px 28px 26px; display: flex; flex-direction: column; gap: 18px; overflow: hidden;">
  <div style="display: flex; align-items: center; justify-content: space-between; height: 28px;">
    ${brand()}
  </div>
  ${sentenceStrip(cards, { running })}
  ${page(cells, hl, whole, playing)}
</div>
${TAIL}`;
}

const DECK = [
    { cells: { initial: 'ㄨ', medial: null, final: 'ㄛ', tone: 'ˇ' } },
    { cells: { initial: 'ㄒ', medial: 'ㄧ', final: 'ㄤ', tone: 'ˇ' } },
    { cells: { initial: 'ㄔ', medial: null, final: null, tone: 'ˉ' } },
    { cells: { initial: 'ㄆ', medial: null, final: 'ㄧ', tone: 'ˊ' } },
    { cells: { initial: 'ㄍ', medial: 'ㄨ', final: 'ㄛ', tone: 'ˇ' } }
];
// 修正：ㄆㄧˊ 的 ㄧ 是介音位；ㄨㄛˇ 的 ㄨ 是介音位
DECK[0].cells = { initial: null, medial: 'ㄨ', final: 'ㄛ', tone: 'ˇ' };
DECK[3].cells = { initial: 'ㄆ', medial: 'ㄧ', final: null, tone: 'ˊ' };

const out = process.argv[2];
fs.writeFileSync(`${out}/Main.dc.html`, screen({
    cards: DECK.map((c, i) => ({ ...c, selected: i === 4 })),
    cells: { initial: 'ㄍ', medial: 'ㄨ', final: 'ㄛ', tone: 'ˇ' }
}));
fs.writeFileSync(`${out}/Karaoke.dc.html`, screen({
    cards: DECK.slice(0, 3), cells: { initial: 'ㄅ', medial: null, final: 'ㄚ', tone: 'ˇ' }, hl: 'final', playing: true
}));
fs.writeFileSync(`${out}/Sentence.dc.html`, screen({
    cards: DECK.map((c) => ({ ...c, playing: true })), cells: { initial: 'ㄍ', medial: 'ㄨ', final: 'ㄛ', tone: 'ˇ' }, running: true
}));
console.log('ok');
