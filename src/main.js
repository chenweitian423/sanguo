import { ROSTER, STAGES, W, H, CONTINUE_SEC, INTRO_SEC } from './data.js';
import { createPlay } from './play.js';
import { movesFor } from './moves.js';
import { emptyFlags, flagStrip, Gates, fourSwords, swordCount } from './flags.js';
import { ACTIONS, loadBinds, saveBinds, resetBinds, keyLabel } from './binds.js';
import { UI, drawUiText } from './ui.js';
import { drawHeroMini, drawStageThumb, drawLogoPanel, drawStageBackground } from './gfx.js';
import {
  playSfx,
  playBgm,
  unlockAudio,
  tickContinue,
  resetContinueTick,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');

hintEl.textContent =
  '投币5/6 · 1=1P 2=2P · 1P:WASD+J/K/L/I=A/B/C/D · Tab键位 · 手机可投币看演示';

const S = {
  TITLE: 'TitleCoin',
  ATTRACT: 'Attract',
  CHAR: 'CharSelect',
  INTRO: 'StageIntro',
  PLAY: 'Play',
  CLEAR: 'StageClear',
  CONTINUE: 'Continue',
  GAMEOVER: 'GameOver',
  ENDING: 'Ending',
  SETTINGS: 'Settings',
};

/** Attract/demo: cycle stages 1–7 with auto-input (119-style). */
const ATTRACT_STAGES = [0, 1, 2, 3, 4, 5, 6]; // 0-based indices into STAGES
const ATTRACT_HERO = 'guanyu';
const ATTRACT_IDLE_SEC = 2.5;
const ATTRACT_CLIP_SEC = 10;
const ATTRACT_CARD_SEC = 1.4;
const ATTRACT_TITLE_FLASH_SEC = 1.1;

const g = {
  state: S.TITLE,
  credit: 0,
  blink: 0,
  cursor: 0,
  charId: null,
  charName: '',
  charId2: null,
  charName2: '',
  playerCount: 1,
  pickSlot: 1, // 1 or 2 during CharSelect
  stageIndex: 0,
  introT: 0,
  clearT: 0,
  continueT: 0,
  endingT: 0,
  gameOverT: 0,
  runFlags: emptyFlags(),
  deaths: 0,
  clears: 0,
  _lastGateNote: '',
  binds: loadBinds(),
  bindPad: 'p1', // which pad editing
  bindCursor: 0,
  bindListening: false,
  /** Title idle toward attract when CREDIT=0 */
  titleIdleT: 0,
  attract: {
    stageCursor: 0,
    phase: 'card', // 'card' | 'play' | 'title_flash'
    phaseT: 0,
    clipT: 0,
  },
};

const play = createPlay({ W, H });

/** @type {Set<string>} */
const held = new Set();
/** @type {Set<string>} */
const pressed = new Set();

function keyNorm(e) {
  if (e.code === 'Space') return 'Space';
  if (e.code && e.code.startsWith('Numpad')) return e.code;
  if (e.key.startsWith('Arrow')) return e.key;
  if (e.key.length === 1) return e.key.toLowerCase();
  return e.key;
}

window.addEventListener('keydown', (e) => {
  const k = keyNorm(e);
  if (!held.has(k)) pressed.add(k);
  held.add(k);

  if (k === 'Escape') {
    if (g.state === S.SETTINGS) {
      g.bindListening = false;
      g.state = S.TITLE;
    } else {
      backToTitle();
    }
    e.preventDefault();
    return;
  }

  if (k === '5' || k === '6') {
    insertCoin();
    e.preventDefault();
    return;
  }
  // C is coin on title only; in play C is item/guard — handle coin when not in PLAY/CHAR/ATTRACT
  if (k === 'c' && g.state !== S.PLAY && g.state !== S.CHAR) {
    insertCoin();
    e.preventDefault();
    return;
  }

  switch (g.state) {
    case S.TITLE:
      g.titleIdleT = 0;
      if (k === 'Tab') {
        openSettings();
        e.preventDefault();
        break;
      }
      if (k === '1' || k === 'Enter') {
        startRun(1);
        e.preventDefault();
      }
      if (k === '2') {
        startRun(2);
        e.preventDefault();
      }
      break;
    case S.ATTRACT:
      if (k === '1' || k === 'Enter' || k === '2') {
        exitAttract();
        e.preventDefault();
      }
      break;
    case S.SETTINGS:
      handleSettingsKey(k, e);
      break;
    case S.CHAR: {
      const cols = 5;
      const b = g.binds.p1;
      if (k === b.left) {
        const col = g.cursor % cols;
        g.cursor = col === 0 ? g.cursor + cols - 1 : g.cursor - 1;
      }
      if (k === b.right) {
        const col = g.cursor % cols;
        g.cursor = col === cols - 1 ? g.cursor - (cols - 1) : g.cursor + 1;
      }
      if (k === b.up) g.cursor = (g.cursor - cols + ROSTER.length) % ROSTER.length;
      if (k === b.down) g.cursor = (g.cursor + cols) % ROSTER.length;
      if (k === b.A || k === 'Enter') {
        confirmChar();
        e.preventDefault();
      }
      break;
    }
    case S.INTRO:
      if (k === '1' || k === 'Enter') {
        enterPlay();
        e.preventDefault();
      }
      break;
    case S.PLAY:
      if (k === 'Enter') {
        clearStage();
        e.preventDefault();
      }
      break;
    case S.CLEAR:
      if (k === 'Enter' || k === '1') {
        nextAfterClear();
        e.preventDefault();
      }
      break;
    case S.CONTINUE:
      if (k === '1' || k === 'Enter') {
        doContinue();
        e.preventDefault();
      }
      break;
    case S.GAMEOVER:
    case S.ENDING:
      if (k === 'Enter' || k === '1') {
        backToTitle();
        e.preventDefault();
      }
      break;
  }
});

window.addEventListener('keyup', (e) => {
  held.delete(keyNorm(e));
});

function openSettings() {
  g.state = S.SETTINGS;
  g.bindPad = 'p1';
  g.bindCursor = 0;
  g.bindListening = false;
}

function handleSettingsKey(k, e) {
  if (g.bindListening) {
    if (k === 'Escape') {
      g.bindListening = false;
      e.preventDefault();
      return;
    }
    // ignore pure modifiers / tab while listening
    if (k === 'Tab' || k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta') {
      e.preventDefault();
      return;
    }
    const action = ACTIONS[g.bindCursor].id;
    g.binds[g.bindPad][action] = k;
    saveBinds(g.binds);
    g.bindListening = false;
    e.preventDefault();
    return;
  }
  if (k === 'Tab') {
    g.bindPad = g.bindPad === 'p1' ? 'p2' : 'p1';
    e.preventDefault();
    return;
  }
  const b = g.binds.p1;
  if (k === b.up || k === 'ArrowUp') {
    g.bindCursor = (g.bindCursor + ACTIONS.length - 1) % ACTIONS.length;
  }
  if (k === b.down || k === 'ArrowDown') {
    g.bindCursor = (g.bindCursor + 1) % ACTIONS.length;
  }
  if (k === b.A || k === 'Enter' || k === 'j') {
    g.bindListening = true;
    e.preventDefault();
  }
  if (k === 'r') {
    g.binds = resetBinds();
    e.preventDefault();
  }
  if (k === 'Escape' || k === 'Backspace') {
    g.state = S.TITLE;
    e.preventDefault();
  }
}


function insertCoin() {
  unlockAudio();
  g.credit = Math.min(99, g.credit + 1);
  playSfx('coin');
  g.titleIdleT = 0;
  if (g.state === S.ATTRACT) exitAttract();
}

function emptyPadInput() {
  return {
    left: false,
    right: false,
    down: false,
    up: false,
    leftTap: false,
    rightTap: false,
    upTap: false,
    downTap: false,
    aTap: false,
    bTap: false,
    cTap: false,
    cHeld: false,
    dTap: false,
    abcTap: false,
    abTap: false,
    forwardA: false,
  };
}

/** Scripted walk/attack for attract clips (~8–12s). Edge taps from clipT vs prev. */
function buildDemoInput(clipT, prevT) {
  const inp = emptyPadInput();
  const cycle = clipT % 8;
  const beat = Math.floor(clipT * 4);
  const prevBeat = Math.floor(prevT * 4);
  const edge = beat !== prevBeat;

  if (cycle < 2.2) {
    inp.right = true;
    if (edge && beat % 3 === 0) inp.aTap = true;
  } else if (cycle < 3.0) {
    inp.right = true;
    if (edge && beat % 4 === 0) inp.bTap = true;
    if (edge && beat % 5 === 1) inp.aTap = true;
  } else if (cycle < 4.5) {
    inp.right = true;
    if (edge && beat % 2 === 0) {
      inp.forwardA = true;
      inp.aTap = false;
    } else if (edge) {
      inp.aTap = true;
    }
  } else if (cycle < 5.5) {
    inp.left = true;
    if (edge && beat % 4 === 0) inp.aTap = true;
  } else if (cycle < 6.5) {
    inp.right = true;
    if (edge && beat % 6 === 0) inp.abTap = true;
    else if (edge && beat % 3 === 0) inp.aTap = true;
  } else {
    inp.right = true;
    if (edge && beat % 5 === 0) inp.bTap = true;
    if (edge && beat % 2 === 1) inp.aTap = true;
  }
  return inp;
}

function attractStageIndex() {
  return ATTRACT_STAGES[g.attract.stageCursor % ATTRACT_STAGES.length];
}

function enterAttract() {
  g.state = S.ATTRACT;
  g.attract.stageCursor = 0;
  g.attract.phase = 'card';
  g.attract.phaseT = ATTRACT_CARD_SEC;
  g.attract.clipT = 0;
  g.titleIdleT = 0;
  playBgm('stage');
}

function exitAttract() {
  g.state = S.TITLE;
  g.titleIdleT = 0;
  g.attract.phase = 'card';
  g.attract.clipT = 0;
  playBgm('title');
}

function startAttractClip() {
  const si = attractStageIndex();
  const st = STAGES[si];
  play.reset(3, ATTRACT_HERO, emptyFlags(), {
    playerCount: 1,
    stageId: st.id,
    demo: true,
  });
  g.attract.phase = 'play';
  g.attract.clipT = 0;
  playBgm('stage');
}

function advanceAttractAfterClip() {
  g.attract.stageCursor += 1;
  if (g.attract.stageCursor % ATTRACT_STAGES.length === 0) {
    g.attract.phase = 'title_flash';
    g.attract.phaseT = ATTRACT_TITLE_FLASH_SEC;
    playBgm('title');
    return;
  }
  g.attract.phase = 'card';
  g.attract.phaseT = ATTRACT_CARD_SEC;
}

function startRun(players = 1) {
  unlockAudio();
  const need = players >= 2 ? 2 : 1;
  if (g.credit < need) return;
  g.titleIdleT = 0;
  playSfx('menu');
  g.credit -= need;
  g.playerCount = players >= 2 ? 2 : 1;
  g.pickSlot = 1;
  g.charId2 = null;
  g.charName2 = '';
  g.cursor = 0;
  g.stageIndex = 0;
  g.deaths = 0;
  g.clears = 0;
  g.runFlags = emptyFlags();
  g.state = S.CHAR;
}

function confirmChar() {
  const c = ROSTER[g.cursor];
  if (g.pickSlot === 1) {
    g.charId = c.id;
    g.charName = c.name;
    if (g.playerCount >= 2) {
      g.pickSlot = 2;
      g.cursor = Math.min(1, ROSTER.length - 1);
      return;
    }
    enterIntro();
    return;
  }
  g.charId2 = c.id;
  g.charName2 = c.name;
  enterIntro();
}

function enterIntro() {
  g.state = S.INTRO;
  g.introT = INTRO_SEC;
  playBgm('stage');
}

function enterPlay() {
  g.state = S.PLAY;
  play.reset(Math.max(1, 3 - g.deaths), g.charId, g.runFlags, {
    playerCount: g.playerCount,
    charId2: g.charId2 || 'zhangfei',
    stageId: g.stageIndex + 1,
  });
}

function clearStage() {
  g.clears += 1;
  playSfx('stage_clear');
  // Stage clear demo pickups (SAN-9) — relaxed gates always allow
  const st = g.stageIndex + 1;
  if (st === 1) {
    // Prefer in-stage grants; ENTER skip still fills gaps
    if (!g.runFlags.has_fire_book) {
      g.runFlags.has_fire_book = true;
      Gates.enterFireBookVault();
    }
    if (!g.runFlags.has_puppet) g.runFlags.has_puppet = true;
  }
  if (st === 2) {
    if (!g.runFlags.has_fire) g.runFlags.has_fire = true;
    if (!g.runFlags.has_nameless_fire) g.runFlags.has_nameless_fire = true;
    if (!g.runFlags.has_general_seal) g.runFlags.has_general_seal = true;
    Gates.enterFireSwordVault();
  }
  if (st === 3) {
    if (!g.runFlags.has_ice) g.runFlags.has_ice = true;
    Gates.canHoldIceAndBoom();
  }
  if (st === 4) {
    if (!g.runFlags.has_leishenchui) g.runFlags.has_leishenchui = true;
    if (!g.runFlags.has_jiujiezhang) g.runFlags.has_jiujiezhang = true;
  }
  if (st === 5) {
    if (!g.runFlags.has_thunder) g.runFlags.has_thunder = true;
    if (!g.runFlags.has_heshi) g.runFlags.has_heshi = true;
  }
  if (st === 6) {
    const g6 = Gates.enterBoomVault(g.runFlags);
    if (!g.runFlags.has_boom) g.runFlags.has_boom = true;
    g._lastGateNote = g6.reason;
  }
  if (st === 7) {
    // Prefer in-stage door; ENTER skip: if hammer, mark thunder route note only
    const th = Gates.enterThunderRoute(g.runFlags);
    g._lastGateNote = th.ok
      ? (g.runFlags.route_s7 === 'thunder' ? th.reason : '有锤可走电道（本局若未进门则主路）')
      : '主路越吉→魏延（无锤）';
  }
  g.state = S.CLEAR;
  g.clearT = 2.2;
}

function nextAfterClear() {
  if (g.stageIndex >= STAGES.length - 1) {
    g.state = S.ENDING;
    g.endingT = 4.5;
    playBgm('ending');
    playSfx('stage_clear');
    return;
  }
  g.stageIndex += 1;
  enterIntro();
}

function die() {
  g.deaths += 1;
  g.state = S.CONTINUE;
  g.continueT = CONTINUE_SEC;
  resetContinueTick();
  playBgm('silence');
}

function doContinue() {
  if (g.credit < 1) return false;
  g.credit -= 1;
  enterPlay();
  return true;
}

function gameOver() {
  g.state = S.GAMEOVER;
  g.gameOverT = 2.5;
}

function backToTitle() {
  g.state = S.TITLE;
  g.titleIdleT = 0;
  playBgm('title');
  g.charId = null;
  g.charName = '';
  g.charId2 = null;
  g.charName2 = '';
  g.playerCount = 1;
  g.pickSlot = 1;
  g.stageIndex = 0;
  g.runFlags = emptyFlags();
}

function fill(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function text(str, x, y, opts = {}) {
  drawUiText(ctx, str, x, y, {
    size: opts.size != null ? opts.size : UI.body,
    align: opts.align || 'left',
    color: opts.color || '#e8dcc8',
    stroke: opts.stroke != null ? opts.stroke : UI.stroke,
  });
}

/** Ending / clear rating chips (神兵四绝 + cheap easter eggs). */
function endingRatings() {
  const flags = g.runFlags || emptyFlags();
  /** @type {{ id: string, label: string, color: string }[]} */
  const out = [];
  if (fourSwords(flags)) out.push({ id: 'four_swords', label: '神兵四绝', color: '#f0c060' });
  else if (swordCount(flags) >= 2) {
    out.push({ id: 'swords', label: `神兵${swordCount(flags)}/4`, color: '#c0a878' });
  }
  if (flags.formation_cleared) out.push({ id: 'formation', label: '破阵完胜', color: '#80e0a0' });
  if (flags.route_s7 === 'thunder') out.push({ id: 'thunder', label: '电道捷径', color: '#a0c0e0' });
  if (flags.has_puppet) out.push({ id: 'puppet', label: '傀儡在握', color: '#c0a0e0' });
  if (flags.has_leishenchui) out.push({ id: 'hammer', label: '雷神在手', color: '#80c0e0' });
  if (g.deaths === 0 && g.clears > 0) out.push({ id: 'no_death', label: '无损通关', color: '#ffe0a0' });
  if (g.clears >= STAGES.length) out.push({ id: 'all_clear', label: '七关归一', color: '#e0d0a0' });
  if (!out.length) out.push({ id: 'clear', label: '乱世余烬', color: '#a0b0c0' });
  return out;
}

function drawRatingStrip(ratings, y) {
  const n = ratings.length;
  const gap = 6;
  const chipW = Math.min(72, Math.floor((W - 40 - gap * (n - 1)) / n));
  const total = n * chipW + (n - 1) * gap;
  let x = (W - total) / 2;
  for (const r of ratings) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y - 2, chipW, 16);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = UI.stroke;
    ctx.strokeRect(x + 0.5, y - 1.5, chipW - 1, 15);
    text(r.label, x + chipW / 2, y + 1, { size: UI.hud, align: 'center', color: r.color });
    x += chipW + gap;
  }
}

function drawTitle(dt) {
  g.blink += dt;
  fill('#120e0c');
  // soft scenic wash behind logo
  drawStageBackground(ctx, 7, g.blink * 12, W, H, 960, g.blink);
  ctx.fillStyle = 'rgba(12,10,8,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
  drawLogoPanel(ctx, W, H, g.blink);
  text('烽火三国', W / 2, 48, { size: UI.logo, align: 'center', color: '#f0c060' });
  text('FENGHUO SANGUO', W / 2, 72, { size: UI.hud, align: 'center', color: '#c0a878' });
  text('横版合作街机 · 384×224', W / 2, 102, { size: UI.caption, align: 'center', color: '#a09080' });
  text(`CREDIT  ${String(g.credit).padStart(2, '0')}`, W / 2, 140, {
    size: UI.body,
    align: 'center',
    color: '#ffe8a0',
  });
  if (Math.floor(g.blink * 2) % 2 === 0) {
    text(
      g.credit >= 2 ? '1=1P · 2=2P · ENTER=1P' : g.credit > 0 ? '1 / ENTER = 1P（2P需2币）' : '投币 5 / 6',
      W / 2,
      168,
      {
      size: 9,
      align: 'center',
      color: '#c0a878',
    });
  }
  text('Tab 键位 · SAN-22 可视层', W / 2, 204, { size: UI.hudSm, align: 'center', color: '#5a5048' });
}

function drawAttractBanner() {
  const pulse = Math.floor(g.blink * 2) % 2 === 0;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, 22);
  ctx.fillRect(0, H - 22, W, 22);
  text('演示 DEMO · 投币开始', W / 2, 4, {
    size: UI.hud,
    align: 'center',
    color: pulse ? '#ffe8a0' : '#c0a060',
  });
  const st = STAGES[attractStageIndex()];
  text(`STAGE ${String(st.id).padStart(2, '0')}  ${st.name}`, W / 2, H - 18, {
    size: UI.hudSm,
    align: 'center',
    color: '#8090a0',
  });
}

function drawAttractCard() {
  const st = STAGES[attractStageIndex()];
  fill('#0c1018');
  drawStageThumb(ctx, st.id, 52, 24, 280, 70, g.blink);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, W, 20);
  ctx.fillRect(0, H - 28, W, 28);
  const badge = `STAGE ${String(st.id).padStart(2, '0')}`;
  const bw = 72;
  ctx.fillStyle = '#1a2838';
  ctx.fillRect(W / 2 - bw / 2, 100, bw, 14);
  ctx.strokeStyle = '#80a0c0';
  ctx.lineWidth = UI.stroke;
  ctx.strokeRect(W / 2 - bw / 2 + 0.5, 100.5, bw - 1, 13);
  text(badge, W / 2, 101, { size: UI.hud, align: 'center', color: '#a0c0e0' });
  text(st.name, W / 2, 120, { size: UI.cardName, align: 'center', color: '#f0e0b0' });
  text(st.blurb, W / 2, 138, { size: UI.caption, align: 'center', color: '#90a0b0' });
  text('演示 DEMO', W / 2, 156, { size: UI.charName, align: 'center', color: '#c0a060' });
  text('投币开始 · INSERT COIN', W / 2, 178, {
    size: UI.hud,
    align: 'center',
    color: Math.floor(g.blink * 2) % 2 === 0 ? '#ffe8a0' : '#809060',
  });
}

function drawSettings() {
  fill('#0e1218');
  text('键位设置', W / 2, 8, { size: 12, align: 'center', color: '#f0d090' });
  text(
    `${g.bindPad === 'p1' ? '【1P】' : '【2P】'} Tab切换 · A/Enter改键 · R恢复默认 · Esc返回`,
    W / 2,
    26,
    { size: 6, align: 'center', color: '#8090a0' },
  );
  const pad = g.binds[g.bindPad];
  ACTIONS.forEach((a, i) => {
    const y = 48 + i * 16;
    const sel = i === g.bindCursor;
    const listening = sel && g.bindListening;
    const label = listening ? '…按下新键…' : keyLabel(pad[a.id]);
    text(a.label, 48, y, { size: 8, color: sel ? '#ffe8a0' : '#a0b0c0' });
    text(label, W - 48, y, {
      size: 8,
      align: 'right',
      color: listening ? '#f08060' : sel ? '#fff0c0' : '#c0d0e0',
    });
  });
  text('默认 1P：WASD + J/K/L/I = A/B/C/D（119）', W / 2, 200, {
    size: 6,
    align: 'center',
    color: '#607080',
  });
}

function drawChar() {
  fill('#10141c');
  text('选择武将', W / 2, 8, { size: 12, align: 'center', color: '#f0d090' });
  text(
    g.playerCount >= 2
      ? `2P 模式 · 正在选 ${g.pickSlot === 1 ? '1P' : '2P'}（可同角）`
      : '十人全开 · 可同角',
    W / 2,
    24,
    { size: 7, align: 'center', color: '#708090' },
  );
  const cols = 5;
  const cardW = 64;
  const cardH = 58;
  const gapX = 8;
  const gapY = 8;
  const gridW = cols * cardW + (cols - 1) * gapX;
  const ox = (W - gridW) / 2;
  const oy = 40;
  ROSTER.forEach((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = ox + col * (cardW + gapX);
    const y = oy + row * (cardH + gapY);
    const sel = i === g.cursor;
    ctx.fillStyle = sel ? '#3a2a18' : '#1a2230';
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = sel ? '#f0c060' : '#405060';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cardW - 1, cardH - 1);
    drawHeroMini(ctx, c.id, x + cardW / 2, y + 38, 0.72);
    text(c.name, x + cardW / 2, y + 42, {
      size: UI.charName,
      align: 'center',
      color: sel ? '#fff0c0' : '#c8d0d8',
    });
  });
  const sel = ROSTER[g.cursor];
  const kit = movesFor(sel.id);
  text(sel.name + ' · ' + kit.normals, W / 2, 178, { size: 8, align: 'center', color: '#c0b090' });
  text(kit.specials.filter((m) => !m.burst).map((m) => m.label + m.name).join(' · '), W / 2, 192, {
    size: 6,
    align: 'center',
    color: '#8090a0',
  });
  text(kit.burstNote, W / 2, 204, { size: 6, align: 'center', color: '#c09060' });
}

function drawIntro() {
  const st = STAGES[g.stageIndex];
  fill('#0c1018');
  // stage BG thumbnail
  drawStageThumb(ctx, st.id, 52, 28, 280, 72, (INTRO_SEC - g.introT) * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, W, 22);
  ctx.fillRect(0, H - 28, W, 28);
  const badge = `STAGE ${String(st.id).padStart(2, '0')}`;
  const bw = 72;
  ctx.fillStyle = '#1a2838';
  ctx.fillRect(W / 2 - bw / 2, 104, bw, 14);
  ctx.strokeStyle = '#80a0c0';
  ctx.lineWidth = UI.stroke;
  ctx.strokeRect(W / 2 - bw / 2 + 0.5, 104.5, bw - 1, 13);
  text(badge, W / 2, 105, { size: UI.hud, align: 'center', color: '#a0c0e0' });
  text(st.name, W / 2, 122, { size: UI.cardName, align: 'center', color: '#f0e0b0' });
  text(st.blurb, W / 2, 140, { size: UI.caption, align: 'center', color: '#90a0b0' });
  const duo =
    g.playerCount >= 2 && g.charName2
      ? `${g.charName} + ${g.charName2} 出阵`
      : `${g.charName} 出阵`;
  text(duo, W / 2, 156, { size: UI.charName, align: 'center', color: '#c0a060' });
  if (g.charId) drawHeroMini(ctx, g.charId, W / 2 - (g.charId2 ? 20 : 0), 186, 0.55);
  if (g.charId2) drawHeroMini(ctx, g.charId2, W / 2 + 20, 186, 0.55);
  const remain = Math.max(0, g.introT);
  text(remain > 0.35 ? 'START / ENTER 跳过' : '出阵…', W / 2, 198, {
    size: UI.hudSm,
    align: 'center',
    color: '#607080',
  });
  const t = Math.max(0, Math.min(1, 1 - g.introT / INTRO_SEC));
  ctx.fillStyle = '#304050';
  ctx.fillRect(W / 2 - 40, 210, 80, 3);
  ctx.fillStyle = '#f0c060';
  ctx.fillRect(W / 2 - 40, 210, 80 * t, 3);
}

function drawClear() {
  const st = STAGES[g.stageIndex];
  fill('#101820');
  text('STAGE CLEAR', W / 2, 56, { size: 14, align: 'center', color: '#80e0a0' });
  text(st.name, W / 2, 80, { size: 11, align: 'center', color: '#e8dcc8' });
  text(`通关 ${g.clears} · 死亡 ${g.deaths}`, W / 2, 100, {
    size: 8,
    align: 'center',
    color: '#90a0b0',
  });
  text('RunFlags', W / 2, 122, { size: 7, align: 'center', color: '#8090a0' });
  text(flagStrip(g.runFlags), W / 2, 136, { size: 7, align: 'center', color: '#ffe8a0' });
  if (g._lastGateNote) {
    text(g._lastGateNote, W / 2, 154, { size: 6, align: 'center', color: '#a0c0a0' });
  }
  text('评价', W / 2, 158, { size: UI.hudSm, align: 'center', color: '#8090a0' });
  drawRatingStrip(endingRatings().slice(0, 4), 172);
}

function drawContinue() {
  fill('#180808');
  text('CONTINUE?', W / 2, 64, { size: UI.countdownLg, align: 'center', color: '#f06060' });
  text(String(Math.ceil(g.continueT)), W / 2, 96, {
    size: UI.countdownXl,
    align: 'center',
    color: '#ffe0a0',
  });
  text(`CREDIT ${g.credit}`, W / 2, 148, { size: UI.body, align: 'center', color: '#e0c080' });
  text(flagStrip(g.runFlags), W / 2, 164, { size: UI.micro, align: 'center', color: '#809060' });
  text(g.credit > 0 ? '1 / ENTER 续关（保留旗标）' : '请先投币 5/6', W / 2, 180, {
    size: UI.caption,
    align: 'center',
    color: '#a09080',
  });
}

function drawGameOver() {
  fill('#0c0c10');
  text('GAME OVER', W / 2, 90, { size: 18, align: 'center', color: '#c04040' });
  text('ENTER 回标题', W / 2, 160, { size: 8, align: 'center', color: '#a09080' });
}

function drawEnding() {
  fill('#101828');
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, W, 24);
  ctx.fillRect(0, H - 24, W, 24);
  text('ENDING', W / 2, 28, { size: UI.banner, align: 'center', color: '#f0d080' });
  text('曹操败北 · 三国归一', W / 2, 52, { size: UI.body, align: 'center', color: '#e8dcc8' });
  const duo =
    g.playerCount >= 2 && g.charName2
      ? `${g.charName} · ${g.charName2} 通关`
      : `${g.charName} 通关`;
  text(duo, W / 2, 72, { size: UI.charName, align: 'center', color: '#a0c0e0' });
  text(`通关 ${g.clears} · 死亡 ${g.deaths}`, W / 2, 90, {
    size: UI.hud,
    align: 'center',
    color: '#8090a0',
  });
  text(flagStrip(g.runFlags), W / 2, 108, { size: UI.hudSm, align: 'center', color: '#ffe8a0' });
  text('—— 评价 ——', W / 2, 128, { size: UI.hudSm, align: 'center', color: '#607080' });
  const ratings = endingRatings();
  drawRatingStrip(ratings.slice(0, 4), 144);
  if (ratings.length > 4) drawRatingStrip(ratings.slice(4), 166);
  if (fourSwords(g.runFlags)) {
    text('四剑齐鸣 · 神兵四绝', W / 2, 190, {
      size: UI.charName,
      align: 'center',
      color: '#f0c060',
    });
  } else {
    text('四剑未齐（不挡通关）', W / 2, 190, {
      size: UI.hud,
      align: 'center',
      color: '#8090a0',
    });
  }
}

function padDown(pad, action) {
  const code = g.binds[pad][action];
  return code ? held.has(code) : false;
}
function padPressed(pad, action) {
  const code = g.binds[pad][action];
  return code ? pressed.has(code) : false;
}

/** Build 119-style input for one pad from current binds. */
function buildPadInput(pad) {
  const left = padDown(pad, 'left');
  const right = padDown(pad, 'right');
  const down = padDown(pad, 'down');
  const up = padDown(pad, 'up');
  const aHeld = padDown(pad, 'A');
  const bHeld = padDown(pad, 'B');
  const cHeld = padDown(pad, 'C');
  const a = padPressed(pad, 'A');
  const b = padPressed(pad, 'B');
  const c = padPressed(pad, 'C');
  const d = padPressed(pad, 'D');

  const abcTap = aHeld && bHeld && cHeld && (a || b || c);
  const abTap = aHeld && bHeld && !cHeld && (a || b) && !abcTap;
  const forwardA = a && (right || left) && !abTap && !abcTap;
  const cTap = c && !aHeld && !bHeld;

  return {
    left,
    right,
    down,
    up,
    leftTap: padPressed(pad, 'left'),
    rightTap: padPressed(pad, 'right'),
    upTap: padPressed(pad, 'up'),
    downTap: padPressed(pad, 'down'),
    aTap: a && !forwardA && !abTap && !abcTap,
    bTap: b && !abTap && !abcTap,
    cTap,
    cHeld,
    dTap: d,
    abcTap,
    abTap,
    forwardA,
  };
}

function buildPlayInput() {
  const input = buildPadInput('p1');
  if (g.playerCount >= 2) input.p2 = buildPadInput('p2');
  return input;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  switch (g.state) {
    case S.TITLE:
      if (g.credit <= 0) {
        g.titleIdleT += dt;
        if (g.titleIdleT >= ATTRACT_IDLE_SEC) enterAttract();
      } else {
        g.titleIdleT = 0;
      }
      break;
    case S.ATTRACT: {
      g.blink += dt;
      if (g.attract.phase === 'card') {
        g.attract.phaseT -= dt;
        if (g.attract.phaseT <= 0) startAttractClip();
      } else if (g.attract.phase === 'title_flash') {
        g.attract.phaseT -= dt;
        if (g.attract.phaseT <= 0) {
          g.attract.stageCursor = 0;
          g.attract.phase = 'card';
          g.attract.phaseT = ATTRACT_CARD_SEC;
          playBgm('stage');
        }
      } else {
        // play clip
        const prev = g.attract.clipT;
        g.attract.clipT += dt;
        const input = buildDemoInput(g.attract.clipT, prev);
        const result = play.update(input, dt);
        const done =
          g.attract.clipT >= ATTRACT_CLIP_SEC ||
          (result && result.stageClear) ||
          play.dead;
        if (done) advanceAttractAfterClip();
      }
      break;
    }
    case S.INTRO:
      g.introT -= dt;
      if (g.introT <= 0) enterPlay();
      break;
    case S.CLEAR:
      g.clearT -= dt;
      if (g.clearT <= 0) nextAfterClear();
      break;
    case S.CONTINUE:
      g.continueT -= dt;
      tickContinue(g.continueT);
      if (g.continueT <= 0) gameOver();
      break;
    case S.GAMEOVER:
      g.gameOverT -= dt;
      if (g.gameOverT <= 0) backToTitle();
      break;
    case S.ENDING:
      g.endingT -= dt;
      if (g.endingT <= 0) backToTitle();
      break;
    case S.PLAY: {
      const input = buildPlayInput();
      if (held.has(g.binds.p1.down) && input.bTap) input.bTap = false;
      if (input.p2 && held.has(g.binds.p2.down) && input.p2.bTap) input.p2.bTap = false;
      const result = play.update(input, dt);
      if (result && result.stageClear) {
        clearStage();
        break;
      }
      if (play.dead) die();
      break;
    }
  }

  switch (g.state) {
    case S.TITLE:
      drawTitle(dt);
      break;
    case S.ATTRACT: {
      if (g.attract.phase === 'card') {
        drawAttractCard();
      } else if (g.attract.phase === 'title_flash') {
        drawTitle(dt);
      } else {
        // BG painted inside play.draw via gfx
        const st = STAGES[attractStageIndex()];
        const hero = ROSTER.find((c) => c.id === ATTRACT_HERO);
        play.draw(ctx, {
          stageName: st.name,
          charName: hero ? hero.name : '关羽',
          charName2: '',
          credit: g.credit,
        });
        drawAttractBanner();
      }
      break;
    }
    case S.SETTINGS:
      drawSettings();
      break;
    case S.CHAR:
      drawChar();
      break;
    case S.INTRO:
      drawIntro();
      break;
    case S.PLAY: {
      const st = STAGES[g.stageIndex];
      play.draw(ctx, {
        stageName: st.name,
        charName: g.charName,
        charName2: g.charName2,
        credit: g.credit,
      });
      break;
    }
    case S.CLEAR:
      drawClear();
      break;
    case S.CONTINUE:
      drawContinue();
      break;
    case S.GAMEOVER:
      drawGameOver();
      break;
    case S.ENDING:
      drawEnding();
      break;
  }

  pressed.clear();
  requestAnimationFrame(frame);
}

playBgm('title');
wireSoftPad();
requestAnimationFrame(frame);

function wireSoftPad() {
  const pad = document.getElementById('softpad');
  if (!pad) return;
  const fire = (act) => {
    unlockAudio();
    if (act === 'coin') {
      insertCoin();
      return;
    }
    if (act === 'start' || act === '1p') {
      if (g.state === S.ATTRACT) {
        exitAttract();
        return;
      }
      if (g.state === S.TITLE) {
        startRun(1);
        return;
      }
      if (g.state === S.INTRO) {
        enterPlay();
        return;
      }
      if (g.state === S.CLEAR) {
        nextAfterClear();
        return;
      }
      if (g.state === S.CONTINUE) {
        doContinue();
        return;
      }
      if (g.state === S.GAMEOVER || g.state === S.ENDING) {
        backToTitle();
      }
    }
  };
  pad.querySelectorAll('[data-act]').forEach((btn) => {
    const act = btn.getAttribute('data-act');
    btn.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      fire(act);
    });
  });
}
