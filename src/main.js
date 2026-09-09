import { ROSTER, STAGES, W, H, CONTINUE_SEC, INTRO_SEC } from './data.js';
import { createPlay } from './play.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');

hintEl.textContent =
  '投币5/6 · Play：操作同前 · C道具栏 B翻页 D使用 · 地上鸡腿瞬回 · ENTER过关';

const S = {
  TITLE: 'TitleCoin',
  CHAR: 'CharSelect',
  INTRO: 'StageIntro',
  PLAY: 'Play',
  CLEAR: 'StageClear',
  CONTINUE: 'Continue',
  GAMEOVER: 'GameOver',
  ENDING: 'Ending',
};

function emptyFlags() {
  return {
    has_fire_book: false,
    has_puppet: false,
    has_fire: false,
    has_ice: false,
    has_thunder: false,
    has_boom: false,
    has_heshi: false,
    has_leishenchui: false,
  };
}

const g = {
  state: S.TITLE,
  credit: 0,
  blink: 0,
  cursor: 0,
  charId: null,
  charName: '',
  stageIndex: 0,
  introT: 0,
  clearT: 0,
  continueT: 0,
  endingT: 0,
  gameOverT: 0,
  runFlags: emptyFlags(),
  deaths: 0,
  clears: 0,
};

const play = createPlay({ W, H });

/** @type {Set<string>} */
const held = new Set();
/** @type {Set<string>} */
const pressed = new Set();

function keyNorm(e) {
  if (e.code === 'Space') return 'Space';
  if (e.key.length === 1) return e.key.toLowerCase();
  return e.key;
}

window.addEventListener('keydown', (e) => {
  const k = keyNorm(e);
  if (!held.has(k)) pressed.add(k);
  held.add(k);

  if (k === 'Escape') {
    backToTitle();
    e.preventDefault();
    return;
  }

  if (k === '5' || k === '6') {
    g.credit = Math.min(99, g.credit + 1);
    e.preventDefault();
    return;
  }
  // C is coin on title only; in play C is item/guard — handle coin when not in PLAY/CHAR
  if (k === 'c' && g.state !== S.PLAY && g.state !== S.CHAR) {
    g.credit = Math.min(99, g.credit + 1);
    e.preventDefault();
    return;
  }

  switch (g.state) {
    case S.TITLE:
      if (k === '1' || k === 'Enter') {
        startRun();
        e.preventDefault();
      }
      break;
    case S.CHAR: {
      const cols = 5;
      if (k === 'ArrowLeft') {
        const col = g.cursor % cols;
        g.cursor = col === 0 ? g.cursor + cols - 1 : g.cursor - 1;
      }
      if (k === 'ArrowRight') {
        const col = g.cursor % cols;
        g.cursor = col === cols - 1 ? g.cursor - (cols - 1) : g.cursor + 1;
      }
      if (k === 'ArrowUp') g.cursor = (g.cursor - cols + ROSTER.length) % ROSTER.length;
      if (k === 'ArrowDown') g.cursor = (g.cursor + cols) % ROSTER.length;
      if (k === 'a' || k === 'z' || k === 'j' || k === 'Enter') {
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

function startRun() {
  if (g.credit < 1) return;
  g.credit -= 1;
  g.cursor = 0;
  g.stageIndex = 0;
  g.deaths = 0;
  g.clears = 0;
  g.runFlags = emptyFlags();
  g.state = S.CHAR;
}

function confirmChar() {
  const c = ROSTER[g.cursor];
  g.charId = c.id;
  g.charName = c.name;
  enterIntro();
}

function enterIntro() {
  g.state = S.INTRO;
  g.introT = INTRO_SEC;
}

function enterPlay() {
  g.state = S.PLAY;
  play.reset(Math.max(1, 3 - g.deaths));
}

function clearStage() {
  g.clears += 1;
  g.state = S.CLEAR;
  g.clearT = 1.5;
}

function nextAfterClear() {
  if (g.stageIndex >= STAGES.length - 1) {
    g.state = S.ENDING;
    g.endingT = 3;
    return;
  }
  g.stageIndex += 1;
  enterIntro();
}

function die() {
  g.deaths += 1;
  g.state = S.CONTINUE;
  g.continueT = CONTINUE_SEC;
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
  g.charId = null;
  g.charName = '';
  g.stageIndex = 0;
  g.runFlags = emptyFlags();
}

function fill(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function text(str, x, y, opts = {}) {
  const { size = 10, align = 'left', color = '#e8dcc8' } = opts;
  ctx.font = `${size}px "PingFang SC","Microsoft YaHei",monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawTitle(dt) {
  g.blink += dt;
  fill('#120e0c');
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
  text('烽火三国', W / 2, 48, { size: 22, align: 'center', color: '#f0c060' });
  text('FENGHUO SANGUO', W / 2, 74, { size: 8, align: 'center', color: '#8a7060' });
  text('横版合作街机 · 384×224', W / 2, 96, { size: 8, align: 'center', color: '#a09080' });
  text(`CREDIT  ${String(g.credit).padStart(2, '0')}`, W / 2, 140, {
    size: 10,
    align: 'center',
    color: '#ffe8a0',
  });
  if (Math.floor(g.blink * 2) % 2 === 0) {
    text(g.credit > 0 ? '按 1 / ENTER 开始' : '投币 5 / 6', W / 2, 168, {
      size: 9,
      align: 'center',
      color: '#c0a878',
    });
  }
  text('SAN-5/6/7 流程·操作·HUD', W / 2, 204, { size: 7, align: 'center', color: '#5a5048' });
}

function drawChar() {
  fill('#10141c');
  text('选择武将', W / 2, 8, { size: 12, align: 'center', color: '#f0d090' });
  text('十人全开', W / 2, 24, { size: 7, align: 'center', color: '#708090' });
  const cols = 5;
  const cardW = 64;
  const cardH = 56;
  const gapX = 8;
  const gapY = 10;
  const gridW = cols * cardW + (cols - 1) * gapX;
  const ox = (W - gridW) / 2;
  const oy = 44;
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
    text(c.name, x + cardW / 2, y + 20, {
      size: 10,
      align: 'center',
      color: sel ? '#fff0c0' : '#c8d0d8',
    });
  });
}

function drawIntro() {
  const st = STAGES[g.stageIndex];
  fill('#0c1018');
  text(`STAGE ${st.id}`, W / 2, 70, { size: 10, align: 'center', color: '#80a0c0' });
  text(st.name, W / 2, 96, { size: 18, align: 'center', color: '#f0e0b0' });
  text(st.blurb, W / 2, 124, { size: 8, align: 'center', color: '#90a0b0' });
  text(`${g.charName} 出阵`, W / 2, 152, { size: 9, align: 'center', color: '#c0a060' });
}

function drawClear() {
  const st = STAGES[g.stageIndex];
  fill('#101820');
  text('STAGE CLEAR', W / 2, 72, { size: 14, align: 'center', color: '#80e0a0' });
  text(st.name, W / 2, 100, { size: 11, align: 'center', color: '#e8dcc8' });
  text(`通关 ${g.clears} · 死亡 ${g.deaths}`, W / 2, 128, {
    size: 8,
    align: 'center',
    color: '#90a0b0',
  });
}

function drawContinue() {
  fill('#180808');
  text('CONTINUE?', W / 2, 64, { size: 16, align: 'center', color: '#f06060' });
  text(String(Math.ceil(g.continueT)), W / 2, 100, { size: 28, align: 'center', color: '#ffe0a0' });
  text(`CREDIT ${g.credit}`, W / 2, 148, { size: 10, align: 'center', color: '#e0c080' });
  text(g.credit > 0 ? '1 / ENTER 续关' : '请先投币 5/6', W / 2, 176, {
    size: 8,
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
  text('ENDING', W / 2, 70, { size: 14, align: 'center', color: '#f0d080' });
  text('曹操败北 · 占位', W / 2, 100, { size: 10, align: 'center', color: '#e8dcc8' });
  text(g.charName + ' 通关', W / 2, 124, { size: 9, align: 'center', color: '#a0c0e0' });
}

function buildPlayInput() {
  const a = pressed.has('a') || pressed.has('z') || pressed.has('j');
  const b = pressed.has('b') || pressed.has('x') || pressed.has('k');
  // D use item — not die anymore in SAN-6
  const d = pressed.has('d') || pressed.has('l');
  const c = pressed.has('c');
  const left = held.has('ArrowLeft');
  const right = held.has('ArrowRight');
  const down = held.has('ArrowDown');
  const leftTap = pressed.has('ArrowLeft');
  const rightTap = pressed.has('ArrowRight');
  const aHeld = held.has('a') || held.has('z') || held.has('j');
  const bHeld = held.has('b') || held.has('x') || held.has('k');
  const cHeld = held.has('c');

  const abcTap = aHeld && bHeld && c && (a || b || c);
  const abTap = aHeld && bHeld && !cHeld && (a || b) && !abcTap;
  const forwardA = a && ((right && !left) || (left && !right));

  return {
    left,
    right,
    down,
    leftTap,
    rightTap,
    aTap: a && !abTap && !abcTap && !forwardA,
    bTap: b && !abTap && !abcTap,
    cTap: c && !cHeld === false ? c && !(aHeld && bHeld) : c,
    cHeld,
    dTap: d,
    abcTap: (aHeld && bHeld && cHeld && (a || b || c)),
    abTap: (aHeld && bHeld && !held.has('c') && (a || b)),
    forwardA: a && ((held.has('ArrowRight') && gFaceRight()) || (held.has('ArrowLeft') && !gFaceRight())),
  };
}

function gFaceRight() {
  // approximate: if holding right, forward is right
  return held.has('ArrowRight') || !held.has('ArrowLeft');
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  switch (g.state) {
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
      // Fix cTap: open panel on C press alone
      input.cTap = pressed.has('c') && !(held.has('a') || held.has('z') || held.has('j')) && !(held.has('b') || held.has('x'));
      input.abcTap =
        pressed.has('c') &&
        (held.has('a') || held.has('z') || held.has('j')) &&
        (held.has('b') || held.has('x') || held.has('k'));
      input.abTap =
        !input.abcTap &&
        (pressed.has('a') || pressed.has('z') || pressed.has('j') || pressed.has('b') || pressed.has('x')) &&
        (held.has('a') || held.has('z') || held.has('j')) &&
        (held.has('b') || held.has('x') || held.has('k'));
      input.forwardA =
        (pressed.has('a') || pressed.has('z') || pressed.has('j')) &&
        (held.has('ArrowRight') || held.has('ArrowLeft')) &&
        !input.abTap &&
        !input.abcTap;
      input.aTap =
        (pressed.has('a') || pressed.has('z') || pressed.has('j')) &&
        !input.forwardA &&
        !input.abTap &&
        !input.abcTap;
      input.bTap =
        (pressed.has('b') || pressed.has('x') || pressed.has('k')) && !input.abTap && !input.abcTap;
      input.upTap = pressed.has('ArrowUp');
      input.downTap = pressed.has('ArrowDown');
      if (held.has('ArrowDown') && input.bTap) {
        input.bTap = false;
      }

      play.update(input, dt);
      if (play.dead) die();
      break;
    }
  }

  switch (g.state) {
    case S.TITLE:
      drawTitle(dt);
      break;
    case S.CHAR:
      drawChar();
      break;
    case S.INTRO:
      drawIntro();
      break;
    case S.PLAY: {
      fill('#182028');
      ctx.fillStyle = '#2a3840';
      ctx.fillRect(0, 160, W, 64);
      ctx.fillStyle = '#3a4850';
      ctx.fillRect(0, 160, W, 2);
      const st = STAGES[g.stageIndex];
      play.draw(ctx, { stageName: st.name, charName: g.charName, credit: g.credit });
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

requestAnimationFrame(frame);
