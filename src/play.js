/** Play-field: controls, qi, HUD, ItemPanel (SAN-5/6/7). */
import { PAGE_NAMES, PAGE_THROW, cloneBag } from './items.js';
import { movesFor } from './moves.js';
import { applySwordFlag, flagStrip, Gates } from './flags.js';
import { dropFromGrunt, dropFromChest, dropFromBoss, spawnMoney } from './drops.js';
import {
  levelFromScore,
  atkSpeedMult,
  itemPowerTier,
  finalDamage,
  swordElem,
  nextThreshold,
  BOSS_WEAK,
} from './leveling.js';
import { COOP, isTwoPlayer, scaleEnemyHp, scaleDropQty, trailingScrollX, clampPlayerX } from './coop.js';

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
    score: 0,
    level: 0,
    itemTier: 1,
    msg: '',
    msgT: 0,
    lastRightT: -9,
    lastLeftT: -9,
  };

  let enemy = spawnEnemy(true);
  /** @type {{ x: number, y: number, heal: number, label: string }[]} */
  let groundHeals = [];
  /** @type {any[]} */
  let grunts = [];
  /** @type {any[]} */
  let chests = [];
  /** @type {any[]} */
  let moneys = [];
  let scrollX = 0;
  let playerCount = 1;
  /** @type {any|null} */
  let p2 = null;
  let t = 0;

  function spawnEnemy(bossLike) {
    return {
      x: 280,
      y: 148,
      hp: bossLike ? 80 : 40,
      hpMax: bossLike ? 80 : 40,
      hitFlash: 0,
      stunT: 0,
      alive: true,
      isBoss: !!bossLike,
      name: bossLike ? '木桩校尉' : '杂兵',
      armorElem: null,
      weak: bossLike ? ['火'] : [], // stub: fire weak to demo 相克
    };
  }

  function reset(lives = 3, charId = 'guanyu', runFlags = null, opts = {}) {
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

    playerCount = opts.playerCount || 1;
    const charId2 = opts.charId2 || 'zhangfei';

    groundHeals = [];
    const gHp = scaleEnemyHp(18, playerCount);
    grunts = [
      { x: 280, y: 148, hp: gHp, hpMax: gHp, alive: true, stunT: 0 },
      { x: 340, y: 148, hp: gHp, hpMax: gHp, alive: true, stunT: 0 },
      { x: 400, y: 148, hp: gHp, hpMax: gHp, alive: true, stunT: 0 },
      { x: 460, y: 148, hp: gHp, hpMax: gHp, alive: true, stunT: 0 },
    ];
    chests = [{ x: 200, y: 156, open: false }, { x: 520, y: 156, open: false }];
    moneys = [];
    p.score = p.score || 0;
    syncLevel(false);
    scrollX = 0;
    // rescale boss for 2P
    if (enemy) {
      const bhp = scaleEnemyHp(enemy.hpMax, playerCount, { boss: true });
      enemy.hpMax = bhp;
      enemy.hp = bhp;
      enemy.x = 560;
    }
    if (isTwoPlayer(playerCount)) {
      p2 = makeFighter(charId2, lives, 56);
      p2.runFlags = p.runFlags; // shared
      p2.score = 0;
      p2.level = 0;
      p2.itemTier = 1;
    } else {
      p2 = null;
    }
    t = 0;
  }

  function makeFighter(charId, lives, startX) {
    return {
      x: startX,
      y: 148,
      vx: 0,
      facing: 1,
      hp: 100,
      hpMax: 100,
      lives,
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
      charId,
      motionBuf: [],
      specialName: '',
      specialT: 0,
      score: 0,
      level: 0,
      itemTier: 1,
      msg: '',
      msgT: 0,
      lastRightT: -9,
      lastLeftT: -9,
      runFlags: null,
      pad: 0,
    };
  }

  function addBagItem(itemId, qty = 1) {
    addBagItemTo(p, itemId, qty);
  }

  function addBagItemTo(fighter, itemId, qty = 1) {
    const it = fighter.bag.find((x) => x.id === itemId);
    if (!it) return;
    if (it.kind === 'sword') {
      it.held = true;
      fighter.equippedSword = itemId;
      if (fighter.runFlags) applySwordFlag(fighter.runFlags, itemId);
      return;
    }
    it.qty = (it.qty || 0) + qty;
  }

  function livingFighters() {
    const out = [];
    if (p.hp > 0) out.push(p);
    if (p2 && p2.hp > 0) out.push(p2);
    return out;
  }

  function nearestFighter(atX) {
    const live = livingFighters();
    if (!live.length) return null;
    live.sort((a, b) => Math.abs(a.x - atX) - Math.abs(b.x - atX));
    return live[0];
  }

  function applyDrop(d, atX) {
    if (!d) return;
    if (d.type === 'heal') {
      groundHeals.push({ x: atX, y: 168, heal: d.heal, label: d.label });
    } else if (d.type === 'bag') {
      const q = scaleDropQty(d.qty || 1, playerCount);
      // nearest living fighter gets bag drop
      const taker = nearestFighter(atX) || p;
      addBagItemTo(taker, d.itemId, q);
      const it = taker.bag.find((x) => x.id === d.itemId);
      setMsg(`获得 ${it ? it.name : d.itemId}`, 0.7);
    } else if (d.type === 'money') {
      moneys.push({ x: atX, y: 168, ...d });
    }
  }

  function syncLevelFor(fighter, announce = true) {
    const prev = fighter.level;
    fighter.level = levelFromScore(fighter.score);
    fighter.itemTier = itemPowerTier(fighter.level);
    if (announce && fighter.level > prev) {
      setMsg(`升级 LV${fighter.level} · 道具威力T${fighter.itemTier}`, 1.2);
    }
  }

  function syncLevel(announce = true) {
    syncLevelFor(p, announce);
    if (p2) syncLevelFor(p2, false);
  }

  function addScore(n) {
    addScoreTo(p, n);
  }

  function addScoreTo(fighter, n) {
    fighter.score += n;
    syncLevelFor(fighter, true);
  }

  function setMsg(s, dur = 1.2) {
    p.msg = s;
    p.msgT = dur;
  }

  function pageItems() {
    return p.bag.filter((i) => i.page === p.panelPage);
  }

  function gainPipFromHit() {
    gainPipFromHitFor(p);
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
    hitWorld(dmg, mv.reach);
    setMsg(`${mv.label} ${mv.name}`, 0.9);
  }

  function tryAttack(kind) {
    if (p.atkT > 0 || p.panelOpen) return;
    p.atkKind = kind;
    const spd = atkSpeedMult(p.level);
    p.atkT = (kind === 'slash' ? 0.28 : kind === 'heavy' ? 0.4 : kind === 'blood' ? 0.35 : 0.3) / spd;
    const reach = kind === 'heavy' ? 36 : 28;
    let dmg = kind === 'heavy' ? 14 : kind === 'blood' ? 18 : p.burstT > 0 ? 12 : 8;
    if (p.equippedSword) dmg *= 1.25;
    if (p.bookBoost && p.burstT > 0) dmg *= 1.5;
    hitWorld(dmg, reach);
  }

  function scaledDmg(base, atkElem = null) {
    return scaledDmgFor(p, base, atkElem);
  }

  function hitWorld(dmg, reach, atkElem = null, attacker = p) {
    const dealt = scaledDmgFor(attacker, dmg, atkElem);
    let hit = false;
    if (enemy.alive) {
      const dx = (enemy.x - attacker.x) * attacker.facing;
      const ok = reach > 70 ? Math.abs(enemy.x - attacker.x) < reach : dx > 0 && dx < reach;
      if (ok && Math.abs(enemy.y - attacker.y) < 24) {
        enemy.hp -= dealt;
        enemy.hitFlash = 0.15;
        hit = true;
        if (enemy.hp <= 0) onEnemyDead(attacker);
      }
    }
    for (const g of grunts) {
      if (!g.alive) continue;
      const dx = (g.x - attacker.x) * attacker.facing;
      const ok = reach > 70 ? Math.abs(g.x - attacker.x) < reach : dx > 0 && dx < reach;
      if (ok && Math.abs(g.y - attacker.y) < 24) {
        g.hp -= dealt;
        hit = true;
        if (g.hp <= 0) onGruntDead(g, attacker);
      }
    }
    for (const c of chests) {
      if (c.open) continue;
      if (Math.abs(c.x - attacker.x) < reach && Math.abs(c.y - attacker.y) < 30) {
        c.open = true;
        applyDrop(dropFromChest(), c.x);
        hit = true;
        setMsg('开箱', 0.5);
      }
    }
    if (hit) gainPipFromHitFor(attacker);
  }

  function scaledDmgFor(fighter, base, atkElem = null) {
    const se = swordElem(fighter.equippedSword);
    const elem = atkElem || se;
    const weakList = enemy.weak || BOSS_WEAK.wood || [];
    return finalDamage({
      base,
      charId: fighter.charId,
      level: fighter.level,
      atkElem: elem,
      defElem: enemy.armorElem || null,
      weakList,
      swordBonus: fighter.equippedSword ? 0.15 : 0,
    });
  }

  function gainPipFromHitFor(fighter) {
    if (fighter.qiPips < fighter.qiMax) fighter.qiPips += 1;
    else fighter.qiCharge = Math.min(1, fighter.qiCharge + 0.15);
  }

  function onEnemyDead(killer = p) {
    enemy.alive = false;
    enemy.hp = 0;
    const pack = 900;
    if (isTwoPlayer(playerCount)) {
      if (p.hp > 0) addScoreTo(p, pack);
      if (p2 && p2.hp > 0) addScoreTo(p2, pack);
    } else {
      addScoreTo(killer, pack);
    }
    for (const d of dropFromBoss()) applyDrop(d, enemy.x + (Math.random() * 20 - 10));
    setMsg(isTwoPlayer(playerCount) ? 'Boss倒 · 双人各拿包 · ENTER过关' : 'Boss倒 · 必掉加血 · ENTER过关', 2);
  }

  function onGruntDead(g, killer = p) {
    g.alive = false;
    addScoreTo(killer, 300);
    applyDrop(dropFromGrunt(), g.x);
    if (Math.random() < 0.35) applyDrop(spawnMoney(), g.x + 8);
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
      // 傀儡 = 定身，非助战（SAN-10）
      let any = false;
      if (enemy.alive) {
        enemy.hitFlash = 1.5;
        enemy.stunT = 2.5;
        any = true;
      }
      for (const g of grunts) {
        if (!g.alive) continue;
        g.stunT = 2.5;
        any = true;
      }
      setMsg(any ? '傀儡定身（非助战）' : '附近无敌人', 1);
    } else if (enemy.alive) {
      let base = it.kind === 'book' ? 22 : it.kind === 'treasure' ? 18 : 10;
      base *= [1, 1, 1.35, 1.7][p.itemTier] || 1;
      if (p.bookBoost) base *= 1.6;
      const dealt = scaledDmg(base, it.elem || null);
      enemy.hp -= dealt;
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
    if (enemy.stunT > 0) enemy.stunT -= dt;
    for (const g of grunts) {
      if (g.stunT > 0) g.stunT -= dt;
    }

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

    if (p2 && p2.hp > 0 && input.p2) {
      stepFighter(p2, input.p2, dt);
    }

    const xs = livingFighters().map((f) => f.x);
    scrollX = trailingScrollX(xs.length ? xs : [p.x], W, COOP.worldW);
    p.x = clampPlayerX(p.x, scrollX, W, COOP.worldW);
    if (p2 && p2.hp > 0) p2.x = clampPlayerX(p2.x, scrollX, W, COOP.worldW);

    pickupWorld(p);
    if (p2 && p2.hp > 0) pickupWorld(p2);

    for (const c of chests) {
      if (c.open) continue;
      for (const f of livingFighters()) {
        if (Math.abs(c.x - f.x) < 12) {
          c.open = true;
          applyDrop(dropFromChest(), c.x);
          break;
        }
      }
    }

    for (const f of livingFighters()) {
      if (
        enemy.alive &&
        (enemy.stunT || 0) <= 0 &&
        f.invulnT <= 0 &&
        Math.abs(enemy.x - f.x) < 18 &&
        Math.abs(enemy.y - f.y) < 16
      ) {
        if (!f.guarding) f.hp -= 10 * dt;
      }
    }

    return { dead: p.hp <= 0 && (!p2 || p2.hp <= 0) };
  }

  function pickupWorld(fighter) {
    for (let i = groundHeals.length - 1; i >= 0; i--) {
      const h = groundHeals[i];
      if (Math.abs(h.x - fighter.x) < 14 && Math.abs(h.y - (fighter.y + 20)) < 24) {
        fighter.hp = Math.min(fighter.hpMax, fighter.hp + h.heal);
        setMsg(`${h.label} +${h.heal}HP`, 0.8);
        groundHeals.splice(i, 1);
      }
    }
    for (let i = moneys.length - 1; i >= 0; i--) {
      const m = moneys[i];
      if (Math.abs(m.x - fighter.x) < 14 && Math.abs(m.y - (fighter.y + 20)) < 24) {
        addScoreTo(fighter, m.score);
        setMsg(`${m.kind} +${m.score}`, 0.6);
        moneys.splice(i, 1);
      }
    }
  }

  function stepFighter(f, inp, dt) {
    if (f.atkT > 0) f.atkT -= dt;
    if (f.burstT > 0) f.burstT -= dt;
    if (f.invulnT > 0) f.invulnT -= dt;
    if (f.specialT > 0) f.specialT -= dt;

    if (inp.abcTap && f.qiPips >= 1) {
      f.qiPips -= 1;
      f.burstT = 3.5;
      f.invulnT = 0.35;
      setMsg('2P 爆气', 0.6);
    } else if (inp.aTap && f.atkT <= 0) {
      const spd = atkSpeedMult(f.level);
      f.atkT = 0.28 / spd;
      f.atkKind = 'slash';
      hitWorld(f.burstT > 0 ? 12 : 8, 28, null, f);
    }

    if (inp.bTap && !f.airborne && !inp.down) {
      f.airborne = true;
      f.vy = -220;
    }
    f.squatting = inp.down && !f.airborne;
    f.guarding = inp.cHeld && (inp.right || inp.left);

    if (inp.rightTap) {
      if (t - f.lastRightT < 0.28) f.running = true;
      f.lastRightT = t;
      f.facing = 1;
    }
    if (inp.leftTap) {
      if (t - f.lastLeftT < 0.28) f.running = true;
      f.lastLeftT = t;
      f.facing = -1;
    }
    if (!inp.right && !inp.left) f.running = false;

    const speed = f.squatting ? 0 : f.running ? 140 : 70;
    f.vx = 0;
    if (inp.right && !f.guarding) {
      f.vx = speed;
      f.facing = 1;
    } else if (inp.left && !f.guarding) {
      f.vx = -speed;
      f.facing = -1;
    }
    if (f.airborne) {
      f.vy += 700 * dt;
      f.y += f.vy * dt;
      if (f.y >= 148) {
        f.y = 148;
        f.vy = 0;
        f.airborne = false;
      }
    }
    f.x += f.vx * dt;
  }

  function draw(ctx, hud) {
    ctx.save();
    ctx.translate(-scrollX, 0);
    // chests
    for (const c of chests) {
      ctx.fillStyle = c.open ? '#403020' : '#8a5a20';
      ctx.fillRect(c.x - 10, c.y, 20, 14);
      if (!c.open) drawText(ctx, '箱', c.x, c.y - 10, 6, '#c0a060', 'center');
    }
    // grunts
    for (const g of grunts) {
      if (!g.alive) continue;
      ctx.fillStyle = '#606878';
      ctx.fillRect(g.x - 8, g.y + 4, 16, 24);
    }
    // ground heals
    for (const h of groundHeals) {
      ctx.fillStyle = '#e8a050';
      ctx.beginPath();
      ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, h.label, h.x, h.y - 12, 6, '#f0c080', 'center');
    }
    // money
    for (const m of moneys) {
      ctx.fillStyle = m.color;
      ctx.fillRect(m.x - 4, m.y - 4, 8, 8);
      drawText(ctx, m.kind, m.x, m.y - 14, 6, m.color, 'center');
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

    // P2 body
    if (p2 && p2.hp > 0) {
      ctx.fillStyle = p2.invulnT > 0 ? '#fff' : '#5080c0';
      ctx.fillRect(p2.x - 10, p2.y, 20, 28);
      drawText(ctx, '2P', p2.x, p2.y - 10, 6, '#a0c0e0', 'center');
    }
    ctx.restore();
    drawHud(ctx, hud);

    if (p.specialT > 0) drawText(ctx, p.specialName, W / 2, 78, 11, '#ffe080', 'center');
    if (p.msgT > 0) drawText(ctx, p.msg, W / 2, 92, 9, '#fff0c0', 'center');
    drawText(ctx, kit.normals + ' · ' + kit.burstNote, W / 2, 200, 5.5, '#607080', 'center');

    drawText(
      ctx,
      '2P：卷轴跟落后 · WASD+U攻击 · 分分各算',
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

    if (p2) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(W - 172, 4, 168, 40);
      const nm = hud.charName2 || '2P';
      drawText(ctx, nm, W - 148, 6, 8, '#c8d8e8');
      drawText(ctx, `命×${p2.lives} LV${p2.level}`, W - 148, 16, 7, '#a0b0c0');
      ctx.fillStyle = '#203020';
      ctx.fillRect(W - 148, 28, 100, 7);
      ctx.fillStyle = '#40a0c0';
      ctx.fillRect(W - 148, 28, 100 * Math.max(0, p2.hp / p2.hpMax), 7);
      drawText(ctx, `S${p2.score}`, W - 8, 28, 6, '#a0c0e0', 'right');
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(W - 100, 4, 96, 28);
      drawText(ctx, '2P —', W - 52, 12, 7, '#506070', 'center');
    }

    drawText(ctx, `1P LV${p.level}  ${p.score}`, W - 8, 48, 7, '#e0d0a0', 'right');
    drawText(ctx, `CREDIT ${hud.credit}`, W - 8, 58, 7, '#c0a878', 'right');
    if (p.burstT > 0) drawText(ctx, `爆气 ${p.burstT.toFixed(1)}`, W - 8, 68, 7, '#f0c040', 'right');
    drawText(ctx, isTwoPlayer(playerCount) ? '卷轴跟落后 · 无友伤' : '', 8, 72, 6, '#607080');
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
      return p.hp <= 0 && (!p2 || p2.hp <= 0);
    },
    get playerCount() {
      return playerCount;
    },
    get lives() {
      return p.lives;
    },
    get score() {
      return p.score;
    },
    get level() {
      return p.level;
    },
  };
}
