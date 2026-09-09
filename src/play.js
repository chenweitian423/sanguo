/** Play-field: controls, qi, HUD, ItemPanel (SAN-5/6/7). */
import { PAGE_NAMES, PAGE_THROW, cloneBag } from './items.js';
import { movesFor } from './moves.js';
import { applySwordFlag, flagStrip, Gates } from './flags.js';

/**
 * @param {{ W: number, H: number }} opts
 */
export function createPlay(opts) {
  const { W, H } = opts;
  const p = {
    x: 80,
    y: 148,
    vx: 0,
    facing: 1,
    hp: 100,
    hpMax: 100,
    lives: 3,
    qiPips: 0,
    qiMax: 3,
    qiCharge: 0,
    running: false,
    squatting: false,
    guarding: false,
    airborne: false,
    vy: 0,
    atkT: 0,
    atkKind: '',
    burstT: 0,
    invulnT: 0,
    fxFlash: 0,
    bookBoost: false,
    panelOpen: false,
    panelPage: PAGE_THROW,
    cursor: 0,
    bag: cloneBag(),
    equippedSword: null,
    charId: 'guanyu',
    motionBuf: [],
    specialName: '',
    specialT: 0,
    msg: '',
    msgT: 0,
    lastRightT: -9,
    lastLeftT: -9,
  };

  let enemy = spawnEnemy(true);
  /** @type {{ x: number, y: number, heal: number, label: string }[]} */
  let groundHeals = [];
  let t = 0;

  function spawnEnemy(bossLike) {
    return {
      x: 280,
      y: 148,
      hp: bossLike ? 80 : 40,
      hpMax: bossLike ? 80 : 40,
      hitFlash: 0,
      alive: true,
      isBoss: !!bossLike,
      name: bossLike ? '木桩校尉' : '杂兵',
    };
  }

  function reset(lives = 3, charId = 'guanyu', runFlags = null) {
    p.x = 80;
    p.y = 148;
    p.vx = 0;
    p.facing = 1;
    p.hp = p.hpMax;
    p.lives = lives;
    p.qiPips = 0;
    p.qiCharge = 0;
    p.running = false;
    p.squatting = false;
    p.guarding = false;
    p.airborne = false;
    p.vy = 0;
    p.atkT = 0;
    p.burstT = 0;
    p.invulnT = 0;
    p.panelOpen = false;
    p.panelPage = PAGE_THROW;
    p.cursor = 0;
    p.bag = cloneBag();
    p.equippedSword = null;
    p.charId = charId || 'guanyu';
    p.runFlags = runFlags;
    p.motionBuf = [];
    p.specialName = '';
    p.specialT = 0;
    enemy = spawnEnemy(true);
    if (p.runFlags) {
      const map = [
        ['has_fire', 'sword_fire'],
        ['has_ice', 'sword_ice'],
        ['has_thunder', 'sword_thunder'],
        ['has_boom', 'sword_boom'],
      ];
      for (const [fk, sid] of map) {
        if (p.runFlags[fk]) {
          const it = p.bag.find((x) => x.id === sid);
          if (it) it.held = true;
        }
      }
      if (p.runFlags.has_fire) p.equippedSword = p.equippedSword || 'sword_fire';
    }

    groundHeals = [
      { x: 160, y: 168, heal: 25, label: '鸡腿' },
      { x: 200, y: 168, heal: 15, label: '包子' },
    ];
    t = 0;
  }

  function setMsg(s, dur = 1.2) {
    p.msg = s;
    p.msgT = dur;
  }

  function pageItems() {
    return p.bag.filter((i) => i.page === p.panelPage);
  }

  function gainPipFromHit() {
    if (p.qiPips < p.qiMax) {
      p.qiPips += 1;
      setMsg('命中 +1 气珠', 0.55);
    } else {
      p.qiCharge = Math.min(1, p.qiCharge + 0.15);
    }
  }


  function pushMotion(dir) {
    const now = t;
    p.motionBuf.push({ d: dir, t: now });
    p.motionBuf = p.motionBuf.filter((m) => now - m.t < 0.5);
  }

  function motionStr() {
    return p.motionBuf.map((m) => m.d).join('');
  }

  function matchSpecial() {
    const kit = movesFor(p.charId);
    const s = motionStr();
    const burstOn = p.burstT > 0;
    // prefer burst moves when bursting
    const ordered = [...kit.specials].sort((a, b) => {
      if (burstOn) return (b.burst ? 1 : 0) - (a.burst ? 1 : 0);
      return (a.burst ? 1 : 0) - (b.burst ? 1 : 0);
    });
    for (const mv of ordered) {
      if (mv.burst && !burstOn) continue;
      if (mv.motion === '6A') continue; // handled as forward+A
      if (mv.motion === '236' && (s.endsWith('236') || s.endsWith('26') || s.endsWith('2236') || s.endsWith('266'))) return mv;
      if (mv.motion === '28' && (s.endsWith('28') || s.endsWith('218') || s.endsWith('248'))) return mv;
      if (mv.motion === '46' && (s.endsWith('46') || s.endsWith('456') || s.endsWith('446'))) return mv;
      if (mv.motion === '22' && (s.endsWith('22') || s.endsWith('222'))) return mv;
    }
    return null;
  }

  function trySpecialOrAttack(kindFallback) {
    const mv = matchSpecial();
    if (mv) {
      fireSpecial(mv);
      return;
    }
    if (kindFallback === 'heavy') {
      const kit = movesFor(p.charId);
      const six = kit.specials.find((m) => m.motion === '6A' && (!m.burst || p.burstT > 0));
      if (six) {
        fireSpecial(six);
        return;
      }
    }
    tryAttack(kindFallback);
  }

  function fireSpecial(mv) {
    if (p.atkT > 0 || p.panelOpen) return;
    p.atkKind = 'special';
    p.atkT = 0.45;
    p.specialName = mv.name;
    p.specialT = 0.9;
    p.motionBuf = [];
    let dmg = mv.dmg;
    if (p.equippedSword) dmg *= 1.2;
    if (p.burstT > 0) dmg *= mv.burst ? 1.15 : 1.25;
    const reach = mv.reach;
    if (enemy.alive) {
      const dx = (enemy.x - p.x) * p.facing;
      // ranged specials (reach>70) ignore facing gap somewhat
      const ok = reach > 70 ? Math.abs(enemy.x - p.x) < reach : dx > 0 && dx < reach;
      if (ok && Math.abs(enemy.y - p.y) < 24) {
        enemy.hp -= dmg;
        enemy.hitFlash = 0.2;
        gainPipFromHit();
        if (enemy.hp <= 0) onEnemyDead();
      }
    }
    setMsg(`${mv.label} ${mv.name}`, 0.9);
  }

  function tryAttack(kind) {
    if (p.atkT > 0 || p.panelOpen) return;
    p.atkKind = kind;
    p.atkT = kind === 'slash' ? 0.28 : kind === 'heavy' ? 0.4 : kind === 'blood' ? 0.35 : 0.3;
    const reach = kind === 'heavy' ? 36 : 28;
    if (enemy.alive) {
      const dx = (enemy.x - p.x) * p.facing;
      if (dx > 0 && dx < reach && Math.abs(enemy.y - p.y) < 20) {
        let dmg = kind === 'heavy' ? 14 : kind === 'blood' ? 18 : p.burstT > 0 ? 12 : 8;
        if (p.equippedSword) dmg *= 1.25;
        if (p.bookBoost && p.burstT > 0) dmg *= 1.5;
        enemy.hp -= dmg;
        enemy.hitFlash = 0.15;
        gainPipFromHit();
        if (enemy.hp <= 0) onEnemyDead();
      }
    }
  }

  function onEnemyDead() {
    enemy.alive = false;
    enemy.hp = 0;
    groundHeals.push({ x: enemy.x, y: 168, heal: 35, label: '鸡腿' });
    setMsg('敌倒 · 加血落地 · ENTER 过关', 2);
  }

  function startBurst() {
    if (p.qiPips < 1 || p.panelOpen) return;
    p.qiPips -= 1;
    p.burstT = 3.5;
    p.invulnT = 0.35;
    setMsg('爆气！', 0.8);
  }

  function bloodKill() {
    if (p.hp <= 15 || p.panelOpen) return;
    p.hp -= 12;
    tryAttack('blood');
    setMsg('血杀', 0.5);
  }

  function useSelected() {
    const items = pageItems();
    if (!items.length) {
      setMsg('空栏', 0.6);
      return;
    }
    const it = items[Math.min(p.cursor, items.length - 1)];
    if (it.kind === 'sword') {
      it.held = true;
      p.equippedSword = it.id;
      if (p.runFlags) {
        applySwordFlag(p.runFlags, it.id);
        const both = Gates.canHoldIceAndBoom();
        setMsg(`取得 ${it.name} · ${both.reason}`, 1.0);
      } else {
        setMsg(`取得 ${it.name}`, 0.8);
      }
      p.panelOpen = false;
      return;
    }
    if ((it.qty ?? 0) < 1) {
      setMsg('数量不足', 0.6);
      return;
    }
    it.qty -= 1;
    p.fxFlash = 0.7;
    p.bookBoost = p.burstT > 0 && it.kind === 'book';

    if (it.kind === 'stun') {
      if (enemy.alive) {
        enemy.hitFlash = 1.2;
        setMsg('傀儡定身', 1);
      }
    } else if (enemy.alive) {
      let base = it.kind === 'book' ? 22 : it.kind === 'treasure' ? 18 : 10;
      if (p.bookBoost) base *= 1.6;
      enemy.hp -= base;
      enemy.hitFlash = 0.2;
      gainPipFromHit();
      if (enemy.hp <= 0) onEnemyDead();
      setMsg(
        p.bookBoost ? `${it.name}（爆气加强）` : `${it.name}${it.elem ? '·' + it.elem : ''}`,
        1,
      );
    } else {
      setMsg(`使用 ${it.name}`, 0.8);
    }
    p.panelOpen = false;
  }

  function update(input, dt) {
    t += dt;
    if (p.msgT > 0) p.msgT -= dt;
    if (p.specialT > 0) p.specialT -= dt;
    if (p.atkT > 0) p.atkT -= dt;
    if (p.burstT > 0) p.burstT -= dt;
    else p.bookBoost = false;
    if (p.invulnT > 0) p.invulnT -= dt;
    if (p.fxFlash > 0) p.fxFlash -= dt;
    if (enemy.hitFlash > 0) enemy.hitFlash -= dt;

    if (input.cTap && !input.left && !input.right) {
      p.panelOpen = !p.panelOpen;
      if (p.panelOpen) p.cursor = 0;
    }

    if (p.panelOpen) {
      const items = pageItems();
      if (input.bTap) {
        p.panelPage = (p.panelPage + 1) % 3;
        p.cursor = 0;
      }
      if (input.leftTap) p.cursor = items.length ? (p.cursor + items.length - 1) % items.length : 0;
      if (input.rightTap) p.cursor = items.length ? (p.cursor + 1) % items.length : 0;
      if (input.upTap) p.cursor = items.length ? (p.cursor + items.length - 1) % items.length : 0;
      if (input.downTap) p.cursor = items.length ? (p.cursor + 1) % items.length : 0;
      if (input.dTap || input.aTap) useSelected();
      return { dead: p.hp <= 0 };
    }

    // motion buffer from directions
    if (input.downTap) pushMotion('2');
    if (input.upTap) pushMotion('8');
    if (input.leftTap) pushMotion('4');
    if (input.rightTap) pushMotion('6');

    if (input.abcTap) startBurst();
    else if (input.abTap) bloodKill();
    else if (input.forwardA) trySpecialOrAttack('heavy');
    else if (input.aTap) {
      if (p.guarding) {
        setMsg('防反击', 0.5);
        tryAttack('slash');
      } else trySpecialOrAttack('slash');
    }

    if (input.bTap && !p.airborne && !input.down) {
      p.airborne = true;
      p.vy = -220;
    }

    p.squatting = input.down && !p.airborne;
    p.guarding = input.cHeld && (input.right || input.left);

    if (input.rightTap) {
      if (t - p.lastRightT < 0.28) p.running = true;
      p.lastRightT = t;
      p.facing = 1;
    }
    if (input.leftTap) {
      if (t - p.lastLeftT < 0.28) p.running = true;
      p.lastLeftT = t;
      p.facing = -1;
    }
    if (!input.right && !input.left) p.running = false;

    const speed = p.squatting ? 0 : p.running ? 140 : 70;
    p.vx = 0;
    if (input.right && !p.guarding) {
      p.vx = speed;
      p.facing = 1;
    } else if (input.left && !p.guarding) {
      p.vx = -speed;
      p.facing = -1;
    }

    if (p.airborne) {
      p.vy += 700 * dt;
      p.y += p.vy * dt;
      if (p.y >= 148) {
        p.y = 148;
        p.vy = 0;
        p.airborne = false;
      }
    }

    p.x += p.vx * dt;
    p.x = Math.max(16, Math.min(W - 16, p.x));

    // Ground heals — instant, not bag
    for (let i = groundHeals.length - 1; i >= 0; i--) {
      const h = groundHeals[i];
      if (Math.abs(h.x - p.x) < 14 && Math.abs(h.y - (p.y + 20)) < 24) {
        p.hp = Math.min(p.hpMax, p.hp + h.heal);
        setMsg(`${h.label} +${h.heal}HP`, 0.8);
        groundHeals.splice(i, 1);
      }
    }

    if (enemy.alive && p.invulnT <= 0 && Math.abs(enemy.x - p.x) < 18 && Math.abs(enemy.y - p.y) < 16) {
      if (!p.guarding) p.hp -= 10 * dt;
    }

    return { dead: p.hp <= 0 };
  }

  function draw(ctx, hud) {
    // ground heals
    for (const h of groundHeals) {
      ctx.fillStyle = '#e8a050';
      ctx.beginPath();
      ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, h.label, h.x, h.y - 12, 6, '#f0c080', 'center');
    }

    // player
    const kit = movesFor(p.charId);
    ctx.fillStyle = p.burstT > 0 ? '#f0c040' : kit.color;
    if (p.invulnT > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
    const pw = 14;
    const ph = p.squatting ? 18 : 28;
    const py = p.y - ph + 28;
    ctx.fillRect(p.x - pw / 2, py, pw, ph);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#201810';
    ctx.fillRect(p.x + p.facing * 4, py + 8, 3, 3);
    // avatar chip
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(6, 6, 18, 18);
    ctx.strokeStyle = '#f0c060';
    ctx.strokeRect(6.5, 6.5, 17, 17);
    drawText(ctx, (hud.charName || '?')[0], 15, 9, 10, '#ffe8a0', 'center');

    if (p.atkT > 0) {
      ctx.fillStyle = 'rgba(255,220,120,0.5)';
      const reach = p.atkKind === 'heavy' ? 36 : 28;
      ctx.fillRect(p.facing > 0 ? p.x : p.x - reach, p.y - 10, reach, 12);
    }
    if (p.guarding) {
      ctx.strokeStyle = '#80c0ff';
      ctx.strokeRect(p.x - 10, py - 2, 20, ph + 4);
    }
    if (p.fxFlash > 0) {
      ctx.fillStyle = `rgba(180,220,255,${p.fxFlash})`;
      ctx.fillRect(0, 60, W, 80);
    }

    // enemy + boss HP
    if (enemy.alive) {
      ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#805060';
      ctx.fillRect(enemy.x - 10, enemy.y, 20, 28);
    } else {
      ctx.fillStyle = '#405060';
      ctx.fillRect(enemy.x - 10, enemy.y + 18, 20, 10);
    }

    drawHud(ctx, hud);

    if (p.specialT > 0) drawText(ctx, p.specialName, W / 2, 78, 11, '#ffe080', 'center');
    if (p.msgT > 0) drawText(ctx, p.msg, W / 2, 92, 9, '#fff0c0', 'center');
    drawText(ctx, kit.normals + ' · ' + kit.burstNote, W / 2, 200, 5.5, '#607080', 'center');

    drawText(
      ctx,
      '指令↓↘→A等 · C栏B翻页 · ENTER过关',
      W / 2,
      212,
      6,
      '#708090',
      'center',
    );

    if (p.panelOpen) drawPanel(ctx);
  }

  function drawHud(ctx, hud) {
    // P1 plate
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(4, 4, 168, 56);
    drawText(ctx, hud.charName, 28, 6, 8, '#e8dcc8');
    drawText(ctx, `命×${p.lives}`, 28, 16, 7, '#c0a878');
    // HP
    drawText(ctx, 'HP', 28, 28, 7, '#80e080');
    ctx.fillStyle = '#203020';
    ctx.fillRect(44, 28, 100, 7);
    ctx.fillStyle = '#40c040';
    ctx.fillRect(44, 28, 100 * Math.max(0, p.hp / p.hpMax), 7);
    // Qi
    drawText(ctx, '气', 28, 42, 7, '#f0c040');
    for (let i = 0; i < p.qiMax; i++) {
      ctx.fillStyle = i < p.qiPips ? '#f0c040' : '#403820';
      ctx.beginPath();
      ctx.arc(48 + i * 12, 45, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#302818';
    ctx.fillRect(86, 42, 48, 5);
    ctx.fillStyle = '#d0a030';
    ctx.fillRect(86, 42, 48 * p.qiCharge, 5);

    // P2 stub (empty)
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(W - 100, 4, 96, 28);
    drawText(ctx, '2P —', W - 52, 12, 7, '#506070', 'center');

    drawText(ctx, `CREDIT ${hud.credit}`, W - 8, 36, 7, '#c0a878', 'right');
    if (p.burstT > 0) drawText(ctx, `爆气 ${p.burstT.toFixed(1)}`, W - 8, 46, 7, '#f0c040', 'right');
    if (p.equippedSword) {
      const sw = p.bag.find((i) => i.id === p.equippedSword);
      drawText(ctx, sw ? sw.name : '', 8, 62, 7, '#f0a060');
    }

    // Boss HP bar top center
    if (enemy.alive && enemy.isBoss) {
      const bw = 160;
      const bx = (W - bw) / 2;
      drawText(ctx, enemy.name, W / 2, 4, 7, '#e0b0b0', 'center');
      ctx.fillStyle = '#301818';
      ctx.fillRect(bx, 14, bw, 8);
      ctx.fillStyle = '#d04040';
      ctx.fillRect(bx, 14, bw * (enemy.hp / enemy.hpMax), 8);
      ctx.strokeStyle = '#a06060';
      ctx.strokeRect(bx + 0.5, 14.5, bw - 1, 7);
    }

    drawText(ctx, hud.stageName, 8, H - 12, 6, '#8090a0');
    if (p.runFlags) drawText(ctx, flagStrip(p.runFlags), W - 8, H - 12, 5.5, '#a09070', 'right');
  }

  function drawPanel(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    const pw = 200;
    const ph = 96;
    const px = W - pw - 8;
    const py = H - ph - 16;
    ctx.fillStyle = '#1a1520';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#c0a060';
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

    // tabs
    for (let i = 0; i < 3; i++) {
      const tx = px + 4 + i * 64;
      ctx.fillStyle = i === p.panelPage ? '#3a2a18' : '#121018';
      ctx.fillRect(tx, py + 4, 60, 12);
      drawText(ctx, PAGE_NAMES[i], tx + 30, py + 5, 6, i === p.panelPage ? '#ffe8a0' : '#708090', 'center');
    }
    drawText(ctx, `${p.panelPage + 1}/3`, px + pw - 8, py + 5, 6, '#8090a0', 'right');

    const items = pageItems();
    const cols = 4;
    const cell = 22;
    items.forEach((it, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = px + 10 + col * (cell + 24);
      const cy = py + 24 + row * (cell + 10);
      const sel = i === p.cursor;
      ctx.fillStyle = sel ? '#403020' : '#221c28';
      ctx.fillRect(cx, cy, cell, cell);
      ctx.strokeStyle = sel ? '#f0c060' : '#405060';
      ctx.strokeRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1);
      drawText(ctx, it.name.slice(0, 2), cx + cell / 2, cy + 6, 7, '#e8dcc8', 'center');
      const sub =
        it.kind === 'sword' ? (it.held ? '持' : '未') : `×${it.qty ?? 0}`;
      drawText(ctx, sub, cx + cell + 2, cy + 8, 6, '#a09080');
    });

    drawText(ctx, 'B翻页 · ←→选 · D/A用 · C关', px + pw / 2, py + ph - 12, 6, '#8090a0', 'center');
  }

  function drawText(ctx, str, x, y, size, color, align = 'left') {
    ctx.font = `${size}px "PingFang SC","Microsoft YaHei",monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000';
    ctx.fillText(str, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  return {
    reset,
    update,
    draw,
    get dead() {
      return p.hp <= 0;
    },
    get lives() {
      return p.lives;
    },
  };
}
