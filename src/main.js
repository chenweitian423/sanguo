import { ROSTER, STAGES, W, H, CONTINUE_SEC, INTRO_SEC } from './data.js';
import { createPlay } from './play.js';
import { movesFor } from './moves.js';
import { emptyFlags, flagStrip, Gates, fourSwords } from './flags.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');

hintEl.textContent =
  '投币5/6 · 标题1=1P / 2=2P · P2:WASD+U攻/I跳/O防 · 卷轴跟落后';

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
        startRun(1);
        e.preventDefault();
      }
      if (k === '2') {
        startRun(2);
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

function startRun(players = 1) {
  const need = players >= 2 ? 2 : 1;
  if (g.credit < need) return;
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
}

function enterPlay() {
  g.state = S.PLAY;
  play.reset(Math.max(1, 3 - g.deaths), g.charId, g.runFlags, {
    playerCount: g.playerCount,
    charId2: g.charId2 || 'zhangfei',
  });
}

function clearStage() {
  g.clears += 1;
  // Stage clear demo pickups (SAN-9) — relaxed gates always allow
  const st = g.stageIndex + 1;
  if (st === 1) {
    g.runFlags.has_fire_book = true;
    g.runFlags.has_puppet = true;
    Gates.enterFireBookVault();
  }
  if (st === 2) {
    g.runFlags.has_fire = true;
    g.runFlags.has_nameless_fire = true;
    g.runFlags.has_general_seal = true;
    Gates.enterFireSwordVault();
  }
  if (st === 3) {
    g.runFlags.has_ice = true;
    Gates.canHoldIceAndBoom();
  }
  if (st === 4) {
    g.runFlags.has_leishenchui = true;
    g.runFlags.has_jiujiezhang = true;
  }
  if (st === 5) {
    g.runFlags.has_thunder = true;
    g.runFlags.has_heshi = true;
  }
  if (st === 6) {
    const g6 = Gates.enterBoomVault(g.runFlags);
    g.runFlags.has_boom = true;
    g._lastGateNote = g6.reason;
  }
  if (st === 7) {
    const th = Gates.enterThunderRoute(g.runFlags);
    if (th.ok) g.runFlags.route_s7 = 'thunder';
    g._lastGateNote = th.ok ? th.reason : '主路越吉→魏延（无锤）';
  }
  g.state = S.CLEAR;
  g.clearT = 2.2;
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
  text('SAN-12 · 2P 落后锁卷轴', W / 2, 204, { size: 7, align: 'center', color: '#5a5048' });
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
  text(`STAGE ${st.id}`, W / 2, 70, { size: 10, align: 'center', color: '#80a0c0' });
  text(st.name, W / 2, 96, { size: 18, align: 'center', color: '#f0e0b0' });
  text(st.blurb, W / 2, 124, { size: 8, align: 'center', color: '#90a0b0' });
  const duo =
    g.playerCount >= 2 && g.charName2
      ? `${g.charName} + ${g.charName2} 出阵`
      : `${g.charName} 出阵`;
  text(duo, W / 2, 152, { size: 9, align: 'center', color: '#c0a060' });
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
  if (fourSwords(g.runFlags)) {
    text('评价：神兵四绝', W / 2, 172, { size: 9, align: 'center', color: '#f0c060' });
  }
}

function drawContinue() {
  fill('#180808');
  text('CONTINUE?', W / 2, 64, { size: 16, align: 'center', color: '#f06060' });
  text(String(Math.ceil(g.continueT)), W / 2, 100, { size: 28, align: 'center', color: '#ffe0a0' });
  text(`CREDIT ${g.credit}`, W / 2, 148, { size: 10, align: 'center', color: '#e0c080' });
  text(flagStrip(g.runFlags), W / 2, 164, { size: 6, align: 'center', color: '#809060' });
  text(g.credit > 0 ? '1 / ENTER 续关（保留旗标）' : '请先投币 5/6', W / 2, 180, {
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
  text('ENDING', W / 2, 56, { size: 14, align: 'center', color: '#f0d080' });
  text('曹操败北 · 占位', W / 2, 84, { size: 10, align: 'center', color: '#e8dcc8' });
  text(g.charName + ' 通关', W / 2, 108, { size: 9, align: 'center', color: '#a0c0e0' });
  text(flagStrip(g.runFlags), W / 2, 132, { size: 7, align: 'center', color: '#ffe8a0' });
  text(
    fourSwords(g.runFlags) ? '神兵四绝' : '四剑未齐（不挡通关）',
    W / 2,
    152,
    { size: 9, align: 'center', color: fourSwords(g.runFlags) ? '#f0c060' : '#8090a0' },
  );
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
        (pressed.has('z') || pressed.has('j') || (g.playerCount < 2 && pressed.has('a'))) &&
        (held.has('ArrowRight') || held.has('ArrowLeft')) &&
        !input.abTap &&
        !input.abcTap;
      input.aTap =
        (pressed.has('z') || pressed.has('j') || (g.playerCount < 2 && pressed.has('a'))) &&
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

      // P2: WASD move, U attack, I jump, O guard/held, P use (unused stub)
      if (g.playerCount >= 2) {
        input.p2 = {
          left: held.has('a'),
          right: held.has('d'),
          down: held.has('s'),
          leftTap: pressed.has('a'),
          rightTap: pressed.has('d'),
          upTap: pressed.has('w'),
          downTap: pressed.has('s'),
          aTap: pressed.has('u'),
          bTap: pressed.has('i'),
          cTap: pressed.has('o'),
          cHeld: held.has('o'),
          dTap: pressed.has('p'),
          abcTap: held.has('u') && held.has('i') && pressed.has('o'),
          abTap: false,
          forwardA: false,
        };
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

requestAnimationFrame(frame);
