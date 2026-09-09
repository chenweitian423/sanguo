import { ROSTER, STAGES, W, H, CONTINUE_SEC, INTRO_SEC } from './data.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');

hintEl.textContent =
  '投币 5/6/C · 开始 1/Enter · 选人 方向+A · 过关 Enter · 假死 D · Esc 回标题';

/** @enum {string} */
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
  stageIndex: 0, // 0..6
  introT: 0,
  clearT: 0,
  continueT: 0,
  endingT: 0,
  gameOverT: 0,
  runFlags: emptyFlags(),
  deaths: 0,
  clears: 0,
};

const keysDown = new Set();

function addCredit() {
  g.credit = Math.min(99, g.credit + 1);
}

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
  // RunFlags kept
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

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keysDown.add(k);

  if (k === 'Escape') {
    backToTitle();
    e.preventDefault();
    return;
  }

  // Coin anywhere
  if (k === '5' || k === '6' || k === 'c') {
    addCredit();
    e.preventDefault();
    return;
  }

  switch (g.state) {
    case S.TITLE: {
      if (k === '1' || k === 'Enter') {
        startRun();
        e.preventDefault();
      }
      break;
    }
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
    case S.INTRO: {
      if (k === '1' || k === 'Enter') {
        enterPlay();
        e.preventDefault();
      }
      break;
    }
    case S.PLAY: {
      if (k === 'Enter' || k === '1') {
        clearStage();
        e.preventDefault();
      }
      if (k === 'd' || k === 'x' || k === 'k') {
        die();
        e.preventDefault();
      }
      break;
    }
    case S.CLEAR: {
      if (k === 'Enter' || k === '1') {
        nextAfterClear();
        e.preventDefault();
      }
      break;
    }
    case S.CONTINUE: {
      if (k === '1' || k === 'Enter') {
        if (!doContinue()) {
          // no credit: stay until timeout or coin then press again
        }
        e.preventDefault();
      }
      break;
    }
    case S.GAMEOVER:
    case S.ENDING: {
      if (k === 'Enter' || k === '1') {
        backToTitle();
        e.preventDefault();
      }
      break;
    }
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keysDown.delete(k);
});

function fill(color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function text(str, x, y, opts = {}) {
  const {
    size = 10,
    align = 'left',
    baseline = 'top',
    color = '#e8dcc8',
    shadow = true,
  } = opts;
  ctx.font = `${size}px "PingFang SC","Microsoft YaHei",monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.fillStyle = '#000';
    ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawTitle(dt) {
  g.blink += dt;
  fill('#120e0c');
  // fake scanlines
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
    const msg = g.credit > 0 ? '按 1 / ENTER 开始' : '投币 5 / 6 / C';
    text(msg, W / 2, 168, { size: 9, align: 'center', color: '#c0a878' });
  }
  text('SAN-5 流程骨架', W / 2, 204, { size: 7, align: 'center', color: '#5a5048' });
}

function drawChar() {
  fill('#10141c');
  text('选择武将', W / 2, 8, { size: 12, align: 'center', color: '#f0d090' });
  text('十人全开 · 可同角（2P后续）', W / 2, 24, { size: 7, align: 'center', color: '#708090' });

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

  text('←→↑↓ 移动 · A/ENTER 确定', W / 2, 210, {
    size: 7,
    align: 'center',
    color: '#708090',
  });
}

function drawIntro() {
  const st = STAGES[g.stageIndex];
  fill('#0c1018');
  text(`STAGE ${st.id}`, W / 2, 70, { size: 10, align: 'center', color: '#80a0c0' });
  text(st.name, W / 2, 96, { size: 18, align: 'center', color: '#f0e0b0' });
  text(st.blurb, W / 2, 124, { size: 8, align: 'center', color: '#90a0b0' });
  text(`${g.charName} 出阵`, W / 2, 152, { size: 9, align: 'center', color: '#c0a060' });
  text('ENTER 跳过', W / 2, 200, { size: 7, align: 'center', color: '#506070' });
}

function drawPlay() {
  const st = STAGES[g.stageIndex];
  fill('#182028');
  // ground
  ctx.fillStyle = '#2a3840';
  ctx.fillRect(0, 160, W, 64);
  ctx.fillStyle = '#3a4850';
  ctx.fillRect(0, 160, W, 2);

  text(`${st.name}`, 8, 6, { size: 9, color: '#e0d0b0' });
  text(`${g.charName}`, 8, 20, { size: 8, color: '#a0c0e0' });
  text('HP ████████░░', 8, 34, { size: 7, color: '#80e080' });
  text('气 ●●○', 8, 46, { size: 7, color: '#f0c040' });

  // stub fighter
  ctx.fillStyle = '#c08040';
  ctx.fillRect(80, 130, 16, 28);
  text(g.charName[0], 88, 136, { size: 10, align: 'center', color: '#201810', shadow: false });

  text('占位战场（SAN-5）', W / 2, 100, { size: 9, align: 'center', color: '#608090' });
  text('ENTER 过关 · D 假死', W / 2, 200, { size: 7, align: 'center', color: '#708090' });
  text(`CREDIT ${g.credit}`, W - 8, 6, { size: 7, align: 'right', color: '#c0a878' });
}

function drawClear() {
  const st = STAGES[g.stageIndex];
  fill('#101820');
  text('STAGE CLEAR', W / 2, 72, { size: 14, align: 'center', color: '#80e0a0' });
  text(st.name, W / 2, 100, { size: 11, align: 'center', color: '#e8dcc8' });
  text(`通关数 ${g.clears} · 死亡 ${g.deaths}`, W / 2, 128, {
    size: 8,
    align: 'center',
    color: '#90a0b0',
  });
  text('ENTER 下一关', W / 2, 180, { size: 8, align: 'center', color: '#c0a878' });
}

function drawContinue() {
  fill('#180808');
  text('CONTINUE?', W / 2, 64, { size: 16, align: 'center', color: '#f06060' });
  text(String(Math.ceil(g.continueT)), W / 2, 100, {
    size: 28,
    align: 'center',
    color: '#ffe0a0',
  });
  text(`CREDIT ${g.credit}`, W / 2, 148, { size: 10, align: 'center', color: '#e0c080' });
  text(
    g.credit > 0 ? '1 / ENTER 续关（保留 RunFlags）' : '请先投币 5/6/C',
    W / 2,
    176,
    { size: 8, align: 'center', color: '#a09080' },
  );
}

function drawGameOver() {
  fill('#0c0c10');
  text('GAME OVER', W / 2, 90, { size: 18, align: 'center', color: '#c04040' });
  text('RunFlags 已清空', W / 2, 120, { size: 8, align: 'center', color: '#808090' });
  text('ENTER 回标题', W / 2, 160, { size: 8, align: 'center', color: '#a09080' });
}

function drawEnding() {
  fill('#101828');
  text('ENDING', W / 2, 70, { size: 14, align: 'center', color: '#f0d080' });
  text('曹操败北 · 三国归一（占位）', W / 2, 100, { size: 10, align: 'center', color: '#e8dcc8' });
  text(g.charName + ' 通关', W / 2, 124, { size: 9, align: 'center', color: '#a0c0e0' });
  text('ENTER 回标题', W / 2, 170, { size: 8, align: 'center', color: '#8090a0' });
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
    case S.PLAY:
      drawPlay();
      break;
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

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
