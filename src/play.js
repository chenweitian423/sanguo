/** Play-field: 119-style controls + easy qi (SAN-6). */

export const BOOKS = [
  { id: 'rendun', name: '人遁书', elem: '火' },
  { id: 'tiandun', name: '天遁书', elem: '电' },
  { id: 'taiping', name: '太平要术', elem: '风' },
  { id: 'qingling', name: '太平青领', elem: '雨' },
  { id: 'didun', name: '地遁书', elem: '石' },
];

/**
 * @param {object} opts
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
    bloodT: 0,
    bookFlash: 0,
    bookName: '',
    bookBoost: false,
    panelOpen: false,
    bookCursor: 0,
    books: BOOKS.map((b) => ({ ...b, qty: 1 })),
    msg: '',
    msgT: 0,
    lastRightT: -9,
    lastLeftT: -9,
    held: { left: false, right: false, up: false, down: false, a: false, b: false, c: false },
    aEdge: false,
    bEdge: false,
    cEdge: false,
    dEdge: false,
    comboA: false,
    comboB: false,
    comboC: false,
  };

  let enemy = spawnEnemy();
  let t = 0;

  function spawnEnemy() {
    return { x: 260, y: 148, hp: 40, hpMax: 40, hitFlash: 0, alive: true };
  }

  function reset() {
    p.x = 80;
    p.y = 148;
    p.vx = 0;
    p.facing = 1;
    p.hp = p.hpMax;
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
    enemy = spawnEnemy();
    t = 0;
  }

  function setMsg(s, dur = 1.2) {
    p.msg = s;
    p.msgT = dur;
  }

  function gainPipFromHit() {
    if (p.qiPips < p.qiMax) {
      p.qiPips += 1;
      setMsg('命中 +1 气珠', 0.6);
    } else {
      p.qiCharge = Math.min(1, p.qiCharge + 0.15);
    }
  }

  function tryAttack(kind) {
    if (p.atkT > 0 || p.panelOpen) return;
    p.atkKind = kind;
    p.atkT = kind === 'slash' ? 0.28 : kind === 'heavy' ? 0.4 : kind === 'blood' ? 0.35 : 0.3;
    const reach = kind === 'heavy' ? 36 : 28;
    if (enemy.alive) {
      const dx = (enemy.x - p.x) * p.facing;
      if (dx > 0 && dx < reach && Math.abs(enemy.y - p.y) < 20) {
        const dmg = kind === 'heavy' ? 14 : kind === 'blood' ? 18 : p.burstT > 0 ? 12 : 8;
        const mult = p.bookBoost && p.burstT > 0 ? 1.5 : 1;
        enemy.hp -= dmg * mult;
        enemy.hitFlash = 0.15;
        gainPipFromHit();
        if (enemy.hp <= 0) {
          enemy.alive = false;
          enemy.hp = 0;
          setMsg('敌倒 · ENTER 过关', 2);
        }
      }
    }
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
    p.bloodT = 0.2;
    tryAttack('blood');
    setMsg('血杀', 0.5);
  }

  function useBook() {
    const b = p.books[p.bookCursor];
    if (!b || b.qty < 1) {
      setMsg('无天书', 0.8);
      return;
    }
    b.qty -= 1;
    p.bookFlash = 0.8;
    p.bookName = b.name;
    p.bookBoost = p.burstT > 0;
    if (enemy.alive) {
      const base = 20;
      enemy.hp -= p.bookBoost ? base * 1.6 : base;
      enemy.hitFlash = 0.2;
      gainPipFromHit();
      if (enemy.hp <= 0) {
        enemy.alive = false;
        enemy.hp = 0;
      }
    }
    setMsg(
      p.bookBoost ? `${b.name}（爆气加强）` : `${b.name}·${b.elem}`,
      1.2,
    );
    p.panelOpen = false;
  }

  /**
   * @param {object} input edge flags + held
   * @param {number} dt
   */
  function update(input, dt) {
    t += dt;
    if (p.msgT > 0) p.msgT -= dt;
    if (p.atkT > 0) p.atkT -= dt;
    if (p.burstT > 0) p.burstT -= dt;
    else p.bookBoost = false;
    if (p.invulnT > 0) p.invulnT -= dt;
    if (p.bookFlash > 0) p.bookFlash -= dt;
    if (enemy.hitFlash > 0) enemy.hitFlash -= dt;

    // Item panel: tap C with no direction; direction+C = guard
    if (input.cTap && !input.left && !input.right) {
      p.panelOpen = !p.panelOpen;
    }
    if (p.panelOpen) {
      if (input.leftTap) p.bookCursor = (p.bookCursor + p.books.length - 1) % p.books.length;
      if (input.rightTap) p.bookCursor = (p.bookCursor + 1) % p.books.length;
      if (input.dTap || input.aTap) useBook();
      return { cleared: false, dead: p.hp <= 0 };
    }

    // Combos from simultaneous / sequenced keys
    if (input.abcTap) {
      startBurst();
    } else if (input.abTap) {
      bloodKill();
    } else if (input.forwardA) {
      tryAttack('heavy');
    } else if (input.aTap) {
      if (p.guarding) {
        setMsg('防反击', 0.5);
        tryAttack('slash');
      } else {
        tryAttack('slash');
      }
    }

    // Jump B
    if (input.bTap && !p.airborne && !p.squatting) {
      p.airborne = true;
      p.vy = -220;
    }

    // Squat ↓B or hold down
    p.squatting = input.down && !p.airborne;
    // Guard →C (facing dir + C held) — simplify: C held without panel = guard if forward held
    p.guarding = input.cHeld && (input.right || input.left) && !p.panelOpen;

    // Run: double-tap forward
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

    // Dummy enemy mild pressure
    if (enemy.alive && p.invulnT <= 0 && Math.abs(enemy.x - p.x) < 18 && Math.abs(enemy.y - p.y) < 16) {
      if (!p.guarding) {
        p.hp -= 12 * dt;
      }
    }

    return { cleared: false, dead: p.hp <= 0 };
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ stageName: string, charName: string, credit: number }} hud
   */
  function draw(ctx, hud) {
    // ground already by caller optional — draw actors + HUD
    // player
    ctx.fillStyle = p.burstT > 0 ? '#f0c040' : '#c08040';
    if (p.invulnT > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
    const pw = 14;
    const ph = p.squatting ? 18 : 28;
    const py = p.y - ph + 28;
    ctx.fillRect(p.x - pw / 2, py, pw, ph);
    ctx.globalAlpha = 1;
    // facing mark
    ctx.fillStyle = '#201810';
    ctx.fillRect(p.x + p.facing * 4, py + 8, 3, 3);

    if (p.atkT > 0) {
      ctx.fillStyle = 'rgba(255,220,120,0.5)';
      const reach = p.atkKind === 'heavy' ? 36 : 28;
      ctx.fillRect(
        p.facing > 0 ? p.x : p.x - reach,
        p.y - 10,
        reach,
        12,
      );
    }
    if (p.guarding) {
      ctx.strokeStyle = '#80c0ff';
      ctx.strokeRect(p.x - 10, py - 2, 20, ph + 4);
    }
    if (p.bookFlash > 0) {
      ctx.fillStyle = `rgba(180,220,255,${p.bookFlash})`;
      ctx.fillRect(0, 60, W, 80);
    }

    // enemy
    if (enemy.alive) {
      ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : '#805060';
      ctx.fillRect(enemy.x - 10, enemy.y, 20, 28);
      ctx.fillStyle = '#400';
      ctx.fillRect(enemy.x - 12, enemy.y - 8, 24, 4);
      ctx.fillStyle = '#e44';
      ctx.fillRect(enemy.x - 12, enemy.y - 8, 24 * (enemy.hp / enemy.hpMax), 4);
    } else {
      ctx.fillStyle = '#405060';
      ctx.fillRect(enemy.x - 10, enemy.y + 18, 20, 10);
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(4, 4, 150, 52);
    drawText(ctx, hud.charName, 8, 6, 8, '#a0c0e0');
    drawText(ctx, hud.stageName, 8, 16, 7, '#e0d0b0');
    // HP
    drawText(ctx, 'HP', 8, 28, 7, '#80e080');
    ctx.fillStyle = '#203020';
    ctx.fillRect(24, 28, 80, 6);
    ctx.fillStyle = '#40c040';
    ctx.fillRect(24, 28, 80 * Math.max(0, p.hp / p.hpMax), 6);
    // Qi pips + charge
    drawText(ctx, '气', 8, 40, 7, '#f0c040');
    for (let i = 0; i < p.qiMax; i++) {
      ctx.fillStyle = i < p.qiPips ? '#f0c040' : '#403820';
      ctx.beginPath();
      ctx.arc(28 + i * 12, 43, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#302818';
    ctx.fillRect(66, 40, 40, 5);
    ctx.fillStyle = '#d0a030';
    ctx.fillRect(66, 40, 40 * p.qiCharge, 5);

    drawText(ctx, `CREDIT ${hud.credit}`, W - 8, 6, 7, '#c0a878', 'right');
    if (p.burstT > 0) drawText(ctx, `爆气 ${p.burstT.toFixed(1)}s`, W - 8, 18, 7, '#f0c040', 'right');

    if (p.msgT > 0) drawText(ctx, p.msg, W / 2, 88, 9, '#fff0c0', 'center');

    drawText(
      ctx,
      '←→走 ·→→跑 ·A攻 ·→A大斩 ·B跳 ·↓蹲 ·→C防 ·AB血杀 ·ABC爆气 ·C栏 ·D天书 ·ENTER过关',
      W / 2,
      210,
      5.5,
      '#708090',
      'center',
    );

    if (p.panelOpen) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1a1520';
      ctx.fillRect(W - 160, H - 110, 150, 100);
      ctx.strokeStyle = '#c0a060';
      ctx.strokeRect(W - 160.5, H - 110.5, 149, 99);
      drawText(ctx, '天书（GOTVG）', W - 85, H - 104, 8, '#f0d090', 'center');
      p.books.forEach((b, i) => {
        const y = H - 88 + i * 14;
        const sel = i === p.bookCursor;
        drawText(
          ctx,
          `${sel ? '▶' : ' '} ${b.name} ×${b.qty} (${b.elem})`,
          W - 152,
          y,
          7,
          sel ? '#ffe8a0' : '#a09080',
        );
      });
      drawText(ctx, '←→选 · D/A 使用 · C关闭', W - 85, H - 18, 6, '#8090a0', 'center');
    }
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
    get enemyDown() {
      return !enemy.alive;
    },
  };
}
