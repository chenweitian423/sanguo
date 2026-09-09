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
import { stageScript } from './stages/index.js';
import {
  resolveBossDef,
  createBossAi,
  tickBossAi,
  airborneHitMult,
} from './bosses.js';

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
  let worldW = COOP.worldW;
  let stageId = 0;
  let script = null;
  let waveIdx = 0;
  let vaultHold = {};
  let vaultDone = {};
  let insideZone = null;
  let props = [];
  let bumpCount = 0;
  let bumpCd = 0;
  let bossIdx = 0;
  /** @type {any|null} */
  let bossAi = null;
  /** @type {any|null} */
  let sideBossAi = null;
  let lampSeq = 0;
  let sideEnemy = null;
  let stageClearReady = false;
  let teachMsg = '';
  /** Stage5 破阵 */
  let formPhase = false;
  let formWaveIdx = 0;
  let formTimer = 0;
  let formFailed = false;
  let formDone = false;
  let formAdvanceAt = null;
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
    enemy = { x: 0, y: 148, hp: 0, hpMax: 1, alive: false, hitFlash: 0, stunT: 0, isBoss: false, name: '', weak: [] };
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
    stageId = opts.stageId || 1;
    script = stageScript(stageId);
    worldW = script ? script.worldW : COOP.worldW;
    waveIdx = 0;
    vaultHold = {};
    vaultDone = {};
    insideZone = null;
    bumpCount = 0;
    bumpCd = 0;
    bossIdx = 0;
    bossAi = null;
    sideBossAi = null;
    lampSeq = 0;
    sideEnemy = null;
    stageClearReady = false;
    teachMsg = '';
    formPhase = false;
    formWaveIdx = 0;
    formTimer = 0;
    formFailed = false;
    formDone = false;
    formAdvanceAt = null;
    groundHeals = [];
    moneys = [];
    props = [];
    chests = [];
    grunts = [];

    p.score = p.score || 0;
    syncLevel(false);
    scrollX = 0;

    if (script && (script.waves || script.bosses || script.boss)) {
      loadStageScript();
    } else {
      enemy = spawnEnemy(true);
      const gHp = scaleEnemyHp(18, playerCount);
      grunts = [
        { x: 280, y: 148, hp: gHp, hpMax: gHp, alive: true, stunT: 0 },
        { x: 340, y: 148, hp: gHp, hpMax: gHp, alive: true, stunT: 0 },
      ];
      chests = [{ x: 200, y: 156, open: false }];
      if (enemy) {
        const bhp = scaleEnemyHp(enemy.hpMax, playerCount, { boss: true });
        enemy.hpMax = bhp;
        enemy.hp = bhp;
        enemy.x = 560;
      }
    }

    if (isTwoPlayer(playerCount)) {
      p2 = makeFighter(charId2, lives, 56);
      p2.runFlags = p.runFlags;
      p2.score = p2.score || 0;
      p2.level = 0;
      p2.itemTier = 1;
    } else {
      p2 = null;
    }
    t = 0;
  }

  function bossesList() {
    if (!script) return [];
    if (script.id === 7) {
      const thunder =
        (p.runFlags && p.runFlags.route_s7 === 'thunder') ||
        insideZone === 'thunder' ||
        (p.runFlags && p.runFlags.has_leishenchui && script._forceThunder);
      if (thunder && script.bossesThunder) return script.bossesThunder;
      if (script.bossesMain) return script.bossesMain;
    }
    if (script.bosses) return script.bosses;
    if (script.bossesMain) return script.bossesMain;
    if (script.boss) return [script.boss];
    return [];
  }

  function loadStageScript() {
    const s = script;
    props = (s.props || []).map((pr) => ({
      ...pr,
      alive: true,
      hpMax: pr.hp,
    }));
    // seed vault chests
    for (const v of s.vaults || []) {
      if (v.type === 'chest_flag') {
        chests.push({
          x: v.x,
          y: v.y || 156,
          open: false,
          vaultId: v.id,
          requireInside: v.requireInside || null,
          requireFlag: v.requireFlag || null,
          flag: v.flag,
          swordId: v.swordId || null,
        });
      }
    }
    const bl = bossesList();
    const placeholder = bl[0] || { x: 800, y: 148, name: 'Boss', id: 'boss', hp: 100, weak: [] };
    enemy = {
      x: placeholder.x,
      y: placeholder.y || 148,
      hp: 1,
      hpMax: 1,
      hitFlash: 0,
      stunT: 0,
      alive: false,
      isBoss: true,
      name: placeholder.name,
      armorElem: placeholder.armorElem || null,
      weak: placeholder.weak || [],
      id: placeholder.id,
      waiting: true,
    };
    bossIdx = 0;
    if (s.waves && s.waves.length) spawnWave(0);
    else beginBossAt(0);
  }

  function spawnWave(idx) {
    waveIdx = idx;
    if (!script || !script.waves || idx >= script.waves.length) {
      beginBossAt(0);
      return;
    }
    const w = script.waves[idx];
    teachMsg = w.teach || '';
    setMsg(teachMsg, 2.2);
    grunts = (w.grunts || []).map((g) => {
      const hp = scaleEnemyHp(g.hp || 16, playerCount);
      return { x: g.x, y: 148, hp, hpMax: hp, alive: true, stunT: 0 };
    });
    if (w.chest) {
      chests.push({ x: w.chest.x, y: 156, open: false });
    }
  }

  function beginBossAt(idx) {
    const bl = bossesList();
    if (!bl.length || idx >= bl.length) {
      stageClearReady = true;
      return;
    }
    bossIdx = idx;
    const raw = bl[idx];
    const b = resolveBossDef(raw);
    const hp = scaleEnemyHp(b.hp, playerCount, { boss: true });
    const groundY = b.y || 148;
    enemy = {
      x: b.x,
      y: b.airborne ? groundY - 36 : groundY,
      groundY,
      hp,
      hpMax: hp,
      hitFlash: 0,
      stunT: 0,
      alive: true,
      isBoss: true,
      name: b.name,
      armorElem: b.armorElem || null,
      weak: b.weak || [],
      id: b.id,
      waiting: false,
      bumps: b.bumps || null,
      packScore: b.packScore || 900,
      onClear: b.onClear || null,
      airborne: !!b.airborne,
      relAtk: b.relAtk,
    };
    // compat stage1 bumpsForPuppet
    if (!enemy.bumps && raw.bumpsForPuppet) {
      enemy.bumps = { count: raw.bumpsForPuppet, flag: 'has_puppet', item: 'puppet', msg: '撞×2 · 傀儡' };
    }
    bossAi = createBossAi(b.id);
    const weakTag = (b.weak && b.weak.length) ? `弱${b.weak.join('/')}` : '无弱点';
    const need = enemy.bumps ? enemy.bumps.count : 0;
    teachMsg = need
      ? `${b.name} · 撞×${need} · ${weakTag}`
      : b.airborne
        ? `${b.name}（飞行）· ${weakTag}`
        : b.onClear
          ? `${b.name} · 败可得神兵 · ${weakTag}`
          : `${b.name} · ${weakTag}`;
    setMsg(raw.note || teachMsg, 2.2);
    bumpCount = 0;
  }

  function waveCleared() {
    return grunts.length === 0 || grunts.every((g) => !g.alive);
  }

  function formEyeAlive() {
    return grunts.some((g) => g.alive && g.isEye);
  }

  function startFormation() {
    if (!script || !script.formation) {
      formDone = true;
      beginBossAt(bossIdx + 1);
      return;
    }
    formPhase = true;
    formDone = false;
    formFailed = false;
    formWaveIdx = 0;
    formAdvanceAt = null;
    if (p.runFlags) p.runFlags.formation_cleared = false;
    enemy.waiting = true;
    enemy._nextBossAt = null;
    setMsg('破阵开始 · 时限内击破阵眼', 2);
    spawnFormWave(0);
  }

  function spawnFormWave(idx) {
    const fm = script && script.formation;
    if (!fm || !fm.waves || idx >= fm.waves.length) {
      endFormation();
      return;
    }
    formWaveIdx = idx;
    formAdvanceAt = null;
    const w = fm.waves[idx];
    const limit = w.timeLimit != null ? w.timeLimit : fm.timeLimit != null ? fm.timeLimit : 18;
    formTimer = limit;
    teachMsg = w.teach || `破阵 ${idx + 1}/${fm.waves.length}`;
    setMsg(teachMsg, 1.8);
    const eyeIndex = w.eyeIndex != null ? w.eyeIndex : 0;
    const spawnKind = w.spawn || 'jump';
    grunts = (w.grunts || []).map((g, i) => {
      const hp = scaleEnemyHp(g.hp || 16, playerCount);
      const isEye = i === eyeIndex || !!g.isEye;
      const unit = {
        x: g.x,
        y: 148,
        hp,
        hpMax: hp,
        alive: true,
        stunT: 0,
        isEye,
        spawn: spawnKind,
        settled: true,
        vx: 0,
      };
      if (spawnKind === 'jump') {
        unit.y = 148 - (70 + (i % 3) * 12);
        unit.vy = 0;
        unit.settled = false;
      } else if (spawnKind === 'charge') {
        // 蹿出：从右侧冲向玩家
        unit.x = Math.max(g.x, 520 + i * 36);
        unit.vx = -110 - (isEye ? 20 : 0);
        unit.settled = true;
      }
      return unit;
    });
  }

  function clearFormWaveGrunts() {
    for (const g of grunts) g.alive = false;
  }

  function scheduleFormAdvance(delay = 0.55) {
    if (formAdvanceAt != null) return;
    formAdvanceAt = t + delay;
  }

  function advanceFormWave() {
    formAdvanceAt = null;
    const fm = script.formation;
    const next = formWaveIdx + 1;
    if (!fm || next >= fm.waves.length) {
      endFormation();
      return;
    }
    spawnFormWave(next);
  }

  function endFormation() {
    formPhase = false;
    formDone = true;
    formAdvanceAt = null;
    formTimer = 0;
    clearFormWaveGrunts();
    if (p.runFlags) p.runFlags.formation_cleared = !formFailed;
    const tag = formFailed ? '破阵失败（宽松仍出吕布）' : '破阵成功';
    setMsg(`${tag} · 吕布来袭`, 2.2);
    teachMsg = tag;
    beginBossAt(bossIdx + 1);
  }

  function grantVault(v) {
    if (!v || vaultDone[v.id]) return;
    vaultDone[v.id] = true;
    if (v.flag && p.runFlags) {
      p.runFlags[v.flag] = true;
      if (v.flag === 'has_fire_book') Gates.enterFireBookVault();
      if (v.flag === 'has_fire') Gates.enterFireSwordVault();
      if (v.flag === 'has_ice') {
        const note = Gates.canHoldIceAndBoom();
        setMsg(`青缸 · ${note.reason}`, 1.8);
      }
      if (v.flag === 'has_boom') {
        const note = Gates.enterBoomVault(p.runFlags);
        const ice = Gates.canHoldIceAndBoom();
        setMsg(`太阿 · ${note.reason} · ${ice.reason}`, 2);
      }
    }
    if (v.swordId) {
      for (const f of livingFighters()) {
        addBagItemTo(f, v.swordId, 1);
        if (f.runFlags) applySwordFlag(f.runFlags, v.swordId);
      }
    }
    if (v.bagItem) {
      for (const f of livingFighters()) addBagItemTo(f, v.bagItem, 1);
    }
    if (v.grantBag) {
      for (const f of livingFighters()) addBagItemTo(f, v.grantBag, 1);
    }
    setMsg(v.label ? `获得 · ${v.label}` : '密室收获', 1.6);
  }

  function ensureSideBoss() {
    if (!script || !script.sideBoss) return;
    const raw = script.sideBoss;
    if (sideEnemy && (sideEnemy.alive || sideEnemy.cleared)) return;
    if (raw.requireInside && insideZone !== raw.requireInside) return;
    const sb = resolveBossDef(raw);
    const hp = scaleEnemyHp(sb.hp, playerCount, { boss: true });
    sideEnemy = {
      x: sb.x,
      y: sb.y || 148,
      groundY: sb.y || 148,
      hp,
      hpMax: hp,
      hitFlash: 0,
      stunT: 0,
      alive: true,
      cleared: false,
      isBoss: true,
      name: sb.name,
      id: sb.id,
      weak: sb.weak || [],
      armorElem: null,
      packScore: sb.packScore || 900,
      onClearFlag: raw.onClearFlag,
      relAtk: sb.relAtk,
      airborne: !!sb.airborne,
    };
    sideBossAi = createBossAi(sb.id);
    setMsg(`${sb.name} 出现`, 1.2);
  }

  function grantBumpReward(bumps) {
    if (!bumps) return;
    if (bumps.flag && p.runFlags) {
      if (p.runFlags[bumps.flag]) return;
      p.runFlags[bumps.flag] = true;
    }
    if (bumps.item) {
      for (const f of livingFighters()) addBagItemTo(f, bumps.item, 1);
    }
    setMsg(bumps.msg || '撞技奖励', 1.8);
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
      const yOk = enemy.airborne
        ? Math.abs(enemy.y - attacker.y) < 48
        : Math.abs(enemy.y - attacker.y) < 24;
      if (ok && yOk) {
        let d = dealt * airborneHitMult(enemy, attacker);
        if (bossAi && bossAi.invulnT > 0) d *= 0.15;
        enemy.hp -= d;
        enemy.hitFlash = 0.15;
        hit = true;
        if (enemy.hp <= 0) onEnemyDead(attacker);
      }
    }
    if (sideEnemy && sideEnemy.alive) {
      const dx = (sideEnemy.x - attacker.x) * attacker.facing;
      const ok = reach > 70 ? Math.abs(sideEnemy.x - attacker.x) < reach : dx > 0 && dx < reach;
      if (ok && Math.abs(sideEnemy.y - attacker.y) < 24) {
        sideEnemy.hp -= dealt;
        sideEnemy.hitFlash = 0.15;
        hit = true;
        if (sideEnemy.hp <= 0) onSideEnemyDead(attacker);
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
      if (c.requireInside && insideZone !== c.requireInside) continue;
      if (c.requireFlag && !(p.runFlags && p.runFlags[c.requireFlag])) continue;
      if (Math.abs(c.x - attacker.x) < reach && Math.abs(c.y - attacker.y) < 30) {
        c.open = true;
        if (c.swordId || c.flag) {
          if (c.flag && p.runFlags) p.runFlags[c.flag] = true;
          if (c.swordId) {
            addBagItemTo(attacker, c.swordId, 1);
            if (p.runFlags) applySwordFlag(p.runFlags, c.swordId);
          }
          if (c.vaultId) vaultDone[c.vaultId] = true;
          if (c.flag === 'has_ice' && p.runFlags) {
            const note = Gates.canHoldIceAndBoom();
            setMsg(`青缸 · ${note.reason}`, 1.8);
          } else if (c.flag === 'has_boom' && p.runFlags) {
            const note = Gates.enterBoomVault(p.runFlags);
            setMsg(`太阿 · ${note.reason}`, 1.8);
          } else {
            setMsg('开箱 · 神兵', 1);
          }
        } else {
          applyDrop(dropFromChest(), c.x);
          setMsg('开箱', 0.5);
        }
        hit = true;
      }
    }
    for (const pr of props) {
      if (!pr.alive) continue;
      if (pr.requireInside && insideZone !== pr.requireInside) continue;
      if (Math.abs(pr.x - attacker.x) < reach + 8 && Math.abs(pr.y - attacker.y) < 30) {
        pr.hp -= dealt;
        hit = true;
        if (pr.lamp) {
          // lamps: extinguish in order, don't need full HP kill semantics beyond first hit kill
          pr.alive = false;
          if (pr.lamp === lampSeq + 1) {
            lampSeq = pr.lamp;
            setMsg(`灯 ${lampSeq}/2`, 0.8);
            if (lampSeq >= 2 && p.runFlags) {
              p.runFlags.lamp_ok = true;
              setMsg('灯序完成 · 暗室门开', 1.5);
            }
          } else {
            lampSeq = 0;
            // respawn both lamps
            for (const q of props) {
              if (q.lamp) {
                q.alive = true;
                q.hp = q.hpMax || 10;
              }
            }
            setMsg('灯序错误 · 需先左后右', 1.2);
          }
        } else if (pr.hp <= 0) {
          pr.alive = false;
          if (pr.drop) addBagItemTo(attacker, pr.drop, 1);
          if (pr.lion === 'correct') {
            if (p.runFlags) p.runFlags.ice_lion_ok = true;
            setMsg('石狮正确 · 可开青缸箱', 1.5);
          } else if (pr.lion === 'wrong') {
            setMsg('石狮不对 · 再找', 0.9);
          } else if (pr.brick) {
            if (p.runFlags) {
              p.runFlags.boom_brick_ok = true;
              const g6 = Gates.enterBoomVault(p.runFlags);
              setMsg(`凸砖开密 · ${g6.reason}`, 2);
            } else {
              setMsg('凸砖开密', 1.2);
            }
          } else {
            setMsg(`破${pr.label}`, 0.6);
          }
        }
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

  function onSideEnemyDead(killer = p) {
    if (!sideEnemy) return;
    sideEnemy.alive = false;
    sideEnemy.cleared = true;
    sideBossAi = null;
    const pack = sideEnemy.packScore || 900;
    addScoreTo(killer, pack);
    if (isTwoPlayer(playerCount) && p2 && p2.hp > 0 && killer !== p2) addScoreTo(p2, pack);
    if (sideEnemy.onClearFlag && p.runFlags) p.runFlags[sideEnemy.onClearFlag] = true;
    for (const d of dropFromBoss()) applyDrop(d, sideEnemy.x);
    setMsg(`${sideEnemy.name}败 · 可打几案进老鹰密`, 2);
  }

  function onEnemyDead(killer = p) {
    enemy.alive = false;
    enemy.hp = 0;
    bossAi = null;
    const pack = enemy.packScore || (script && script.boss && script.boss.packScore) || 900;
    if (isTwoPlayer(playerCount)) {
      if (p.hp > 0) addScoreTo(p, pack);
      if (p2 && p2.hp > 0) addScoreTo(p2, pack);
    } else {
      addScoreTo(killer, pack);
    }
    for (const d of dropFromBoss()) applyDrop(d, enemy.x + (Math.random() * 20 - 10));
    if (enemy.onClear) applyBossClear(enemy.onClear);
    const bl = bossesList();
    if (
      script &&
      script.formation &&
      enemy.id === script.formation.afterBossId &&
      !formDone
    ) {
      setMsg(`${enemy.name}败 · 进入破阵`, 1.5);
      enemy.waiting = true;
      enemy._nextBossAt = null;
      // brief beat then start formation
      enemy._startFormAt = t + 0.85;
      return;
    }
    if (bossIdx + 1 < bl.length) {
      setMsg(`${enemy.name}败 · 下一Boss`, 1.5);
      enemy.waiting = true;
      enemy._nextBossAt = t + 1.0;
      enemy._nextBossIdx = bossIdx + 1;
    } else {
      stageClearReady = true;
      setMsg(`${enemy.name}败 · 过关`, 2);
    }
  }

  function applyBossClear(oc) {
    if (!oc) return;
    if (oc.flags && p.runFlags) {
      for (const f of oc.flags) p.runFlags[f] = true;
    }
    if (oc.swordId) {
      for (const f of livingFighters()) {
        addBagItemTo(f, oc.swordId, 1);
        if (f.runFlags) applySwordFlag(f.runFlags, oc.swordId);
      }
    }
    if (oc.msg) setMsg(oc.msg, 2.2);
  }

  function onGruntDead(g, killer = p) {
    g.alive = false;
    addScoreTo(killer, g.isEye ? 800 : 300);
    applyDrop(dropFromGrunt(), g.x);
    if (Math.random() < 0.35) applyDrop(spawnMoney(), g.x + 8);
    if (formPhase && g.isEye) {
      setMsg('阵眼破', 1.2);
      clearFormWaveGrunts();
      scheduleFormAdvance(0.65);
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
    if (sideEnemy && sideEnemy.hitFlash > 0) sideEnemy.hitFlash -= dt;
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
      return { dead: p.hp <= 0 && (!p2 || p2.hp <= 0), stageClear: stageClearReady };
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
    scrollX = trailingScrollX(xs.length ? xs : [p.x], W, worldW);
    p.x = clampPlayerX(p.x, scrollX, W, worldW);
    if (p2 && p2.hp > 0) p2.x = clampPlayerX(p2.x, scrollX, W, worldW);

    pickupWorld(p);
    if (p2 && p2.hp > 0) pickupWorld(p2);

    for (const c of chests) {
      if (c.open) continue;
      if (c.requireInside && insideZone !== c.requireInside) continue;
      if (c.requireFlag && !(p.runFlags && p.runFlags[c.requireFlag])) continue;
      for (const f of livingFighters()) {
        if (Math.abs(c.x - f.x) < 12) {
          c.open = true;
          if (c.swordId || c.flag) {
            if (c.flag && p.runFlags) p.runFlags[c.flag] = true;
            if (c.swordId) {
              addBagItemTo(f, c.swordId, 1);
              if (p.runFlags) applySwordFlag(p.runFlags, c.swordId);
            }
            if (c.vaultId) vaultDone[c.vaultId] = true;
            setMsg('开箱 · 神兵', 1);
          } else {
            applyDrop(dropFromChest(), c.x);
          }
          break;
        }
      }
    }

    // light residual contact (patterned AI does most damage)
    for (const f of livingFighters()) {
      if (
        enemy.alive &&
        (enemy.stunT || 0) <= 0 &&
        f.invulnT <= 0 &&
        Math.abs(enemy.x - f.x) < 16 &&
        Math.abs(enemy.y - f.y) < 18
      ) {
        if (!f.guarding) f.hp -= 3 * dt;
      }
      if (
        sideEnemy &&
        sideEnemy.alive &&
        f.invulnT <= 0 &&
        Math.abs(sideEnemy.x - f.x) < 16 &&
        Math.abs(sideEnemy.y - f.y) < 18
      ) {
        if (!f.guarding) f.hp -= 3.5 * dt;
      }
    }

    applyBossBrain(enemy, bossAi, dt);
    if (sideEnemy && sideEnemy.alive) applyBossBrain(sideEnemy, sideBossAi, dt);

    tickStage(dt);

    return {
      dead: p.hp <= 0 && (!p2 || p2.hp <= 0),
      stageClear: stageClearReady,
    };
  }

  function applyBossBrain(ent, ai, dt) {
    if (!ent || !ent.alive || !ai || ent.waiting) return;
    const targets = livingFighters();
    const ev = tickBossAi(ai, ent, targets, dt, { scrollX, viewW: W });
    if (ev.label && ai.moveHudT > 0.01) {
      // brief HUD via msg only on telegraph start (flash)
      if (ev.flash && ev.label) setMsg(ev.label, 0.7);
    }
    if (ev.flash) ent.hitFlash = Math.max(ent.hitFlash || 0, 0.12);
    for (const e of ev.dmgEvents || []) {
      const f = e.target;
      if (!f || f.hp <= 0 || (f.invulnT || 0) > 0) continue;
      let dmg = e.dmg;
      if (f.guarding) dmg *= 0.35;
      f.hp -= dmg;
      f.invulnT = Math.max(f.invulnT || 0, 0.28);
      f.fxFlash = 0.15;
    }
  }

  function tickStage(dt) {
    if (!script) return;
    if (bumpCd > 0) bumpCd -= dt;

    // delayed start formation (after shamoke)
    if (enemy && enemy._startFormAt != null && t >= enemy._startFormAt) {
      enemy._startFormAt = null;
      startFormation();
    }

    // delayed next boss
    if (enemy && enemy._nextBossAt != null && t >= enemy._nextBossAt) {
      const ni = enemy._nextBossIdx;
      enemy._nextBossAt = null;
      beginBossAt(ni);
    }

    // formation phase: timer, jump settle, charge vx
    if (formPhase) {
      for (const g of grunts) {
        if (!g.alive) continue;
        if (g.spawn === 'jump' && !g.settled) {
          g.vy = (g.vy || 0) + 520 * dt;
          g.y += g.vy * dt;
          if (g.y >= 148) {
            g.y = 148;
            g.vy = 0;
            g.settled = true;
          }
        }
        if (g.spawn === 'charge' && g.settled) {
          g.x += (g.vx || 0) * dt;
          if (g.x < scrollX + 40) {
            g.x = scrollX + 40;
            g.vx = Math.abs(g.vx || 110);
          } else if (g.x > scrollX + W - 40) {
            g.x = scrollX + W - 40;
            g.vx = -Math.abs(g.vx || 110);
          }
        }
      }
      if (formAdvanceAt != null) {
        if (t >= formAdvanceAt) advanceFormWave();
      } else if (formEyeAlive()) {
        formTimer -= dt;
        if (formTimer <= 0) {
          formTimer = 0;
          formFailed = true;
          setMsg('时限到 · 阵眼未破（继续）', 1.4);
          clearFormWaveGrunts();
          scheduleFormAdvance(0.5);
        }
      }
    }

    // wave advance (skip while in/after formation gate)
    if (
      !formPhase &&
      !formDone &&
      enemy.waiting &&
      enemy._nextBossAt == null &&
      enemy._startFormAt == null &&
      waveCleared() &&
      script.waves &&
      waveIdx < script.waves.length
    ) {
      if (!tickStage._wait) tickStage._wait = 0.55;
      tickStage._wait -= dt;
      if (tickStage._wait <= 0) {
        tickStage._wait = 0;
        if (waveIdx + 1 >= script.waves.length) beginBossAt(0);
        else spawnWave(waveIdx + 1);
      }
    } else if (!(enemy && enemy._nextBossAt != null) && !formPhase) {
      tickStage._wait = 0;
    }

    // vaults
    for (const v of script.vaults || []) {
      if (vaultDone[v.id]) continue;
      if (v.requireInside && insideZone !== v.requireInside) continue;

      if (v.type === 'stand' || v.type === 'pillar') {
        let standing = false;
        for (const f of livingFighters()) {
          const fy = v.type === 'stand' ? f.y + 20 : f.y;
          if (Math.hypot(f.x - v.x, fy - (v.y || 156)) < (v.r || 22)) {
            standing = true;
            if (v.hurt && v.type === 'pillar') {
              f.hp = Math.max(1, f.hp - v.hurt * dt);
            }
            break;
          }
        }
        if (standing) {
          vaultHold[v.id] = (vaultHold[v.id] || 0) + dt;
          if (vaultHold[v.id] >= (v.holdSec || 0.8)) grantVault(v);
        } else {
          vaultHold[v.id] = Math.max(0, (vaultHold[v.id] || 0) - dt * 1.5);
        }
      }

      if (v.type === 'door') {
        if (v.requireFlag && !(p.runFlags && p.runFlags[v.requireFlag])) continue;
        if (v.requireInside && insideZone !== v.requireInside) continue;
        for (const f of livingFighters()) {
          if (Math.abs(f.x - v.x) < (v.r || 24) && Math.abs(f.y - (v.y || 148)) < 30) {
            if (v.setInside) {
              insideZone = v.setInside;
              if (v.flag === 'has_fire' || v.setInside === 'fire_sword') {
                Gates.enterFireSwordVault();
              }
              if (v.setRoute && p.runFlags) {
                p.runFlags.route_s7 = v.setRoute;
                const gate = Gates.enterThunderRoute(p.runFlags);
                setMsg(gate.ok ? gate.reason : (v.note || '电道'), 2);
              } else {
                setMsg(v.note || `进入 ${v.label || '密室'}`, 1.2);
              }
              ensureSideBoss();
            }
            if (v.grantBag || v.bagItem || v.flag) {
              grantVault(v);
            } else if (v.setInside && !vaultDone[v.id]) {
              vaultDone[v.id] = true;
            }
            break;
          }
        }
      }
    }

    // bumps on current boss
    if (enemy.alive && enemy.bumps && bumpCd <= 0) {
      const need = enemy.bumps.count || 2;
      for (const f of livingFighters()) {
        const near = Math.abs(enemy.x - f.x) < 22 && Math.abs(enemy.y - f.y) < 20;
        const attacking = f.atkT > 0;
        const pressing = (f.facing > 0 && f.vx > 0) || (f.facing < 0 && f.vx < 0);
        if (near && (attacking || pressing)) {
          bumpCount += 1;
          bumpCd = 0.55;
          enemy.hitFlash = 0.2;
          setMsg(`撞 ${bumpCount}/${need}`, 0.7);
          if (bumpCount >= need) grantBumpReward(enemy.bumps);
          break;
        }
      }
    }
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
    // vault markers
    if (script && script.vaults) {
      for (const v of script.vaults) {
        if (vaultDone[v.id] && v.type !== 'door') continue;
        if (v.requireInside && insideZone !== v.requireInside) continue;
        if (v.type === 'chest_flag') continue; // drawn as chest
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        const col = v.type === 'pillar' ? '240,80,60' : v.type === 'door' ? '120,180,220' : '240,160,80';
        ctx.strokeStyle = `rgba(${col},${0.35 + pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(v.x, (v.y || 156) - 8, v.r || 22, 0, Math.PI * 2);
        ctx.stroke();
        drawText(ctx, (v.label || v.id).slice(0, 6), v.x, (v.y || 156) - 28, 6, '#f0c080', 'center');
        const hold = vaultHold[v.id] || 0;
        if (hold > 0 && v.holdSec) {
          drawText(ctx, `${Math.min(1, hold / v.holdSec) * 100 | 0}%`, v.x, (v.y || 156) - 18, 6, '#ffe0a0', 'center');
        }
      }
    } else if (script && script.vault && !vaultDone.fire_book) {
      // legacy single vault
      const v = script.vault;
      ctx.strokeStyle = '#f0a050';
      ctx.beginPath();
      ctx.arc(v.x, v.y - 8, v.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // props
    for (const pr of props) {
      if (!pr.alive) continue;
      if (pr.requireInside && insideZone !== pr.requireInside) continue;
      ctx.fillStyle = pr.lamp
        ? '#c0a040'
        : pr.brick
          ? '#a08060'
          : pr.lion === 'correct'
            ? '#6080a0'
            : '#406080';
      ctx.fillRect(pr.x - 10, pr.y, 20, 14);
      drawText(ctx, pr.label || '物', pr.x, pr.y - 10, 6, '#80a0c0', 'center');
    }
    // chests
    for (const c of chests) {
      ctx.fillStyle = c.open ? '#403020' : '#8a5a20';
      ctx.fillRect(c.x - 10, c.y, 20, 14);
      if (!c.open) drawText(ctx, '箱', c.x, c.y - 10, 6, '#c0a060', 'center');
    }
    // grunts
    for (const g of grunts) {
      if (!g.alive) continue;
      ctx.fillStyle = g.isEye ? '#d4a017' : '#606878';
      ctx.fillRect(g.x - 8, g.y + 4, 16, 24);
      if (g.isEye) drawText(ctx, '阵眼', g.x, g.y - 10, 6, '#ffe080', 'center');
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

    // side boss
    if (sideEnemy && sideEnemy.alive) {
      ctx.fillStyle = sideEnemy.hitFlash > 0 ? '#fff' : '#c060a0';
      ctx.fillRect(sideEnemy.x - 10, sideEnemy.y, 20, 28);
      drawText(ctx, sideEnemy.name, sideEnemy.x, sideEnemy.y - 12, 6, '#e0a0c0', 'center');
      const bw = 80;
      ctx.fillStyle = '#301828';
      ctx.fillRect(sideEnemy.x - bw / 2, sideEnemy.y - 20, bw, 4);
      ctx.fillStyle = '#d060a0';
      ctx.fillRect(sideEnemy.x - bw / 2, sideEnemy.y - 20, bw * (sideEnemy.hp / sideEnemy.hpMax), 4);
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

    // boss projectiles (main + side)
    const drawProjs = (ai, col) => {
      if (!ai) return;
      for (const pr of ai.projectiles || []) {
        ctx.fillStyle = col;
        ctx.fillRect(pr.x - 4, (pr.y || 148) + 6, 8, 6);
      }
    };
    drawProjs(bossAi, '#e0c060');
    drawProjs(sideBossAi, '#e080c0');

    // enemy + boss body
    if (enemy.alive) {
      const tele = bossAi && bossAi.state === 'telegraph';
      ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : tele ? '#c08040' : '#805060';
      const bh = enemy.airborne ? 24 : 28;
      ctx.fillRect(enemy.x - 10, enemy.y, 20, bh);
      if (tele) {
        ctx.strokeStyle = '#ffe080';
        ctx.strokeRect(enemy.x - 14, enemy.y - 4, 28, bh + 8);
      }
      if (bossAi && bossAi.state === 'attack') {
        ctx.fillStyle = 'rgba(255,120,80,0.35)';
        const reach = (bossAi.move && bossAi.move.reach) || 36;
        const fac = bossAi.facing || 1;
        if (bossAi.move && (bossAi.move.kind === 'slash' || bossAi.move.kind === 'dash')) {
          ctx.fillRect(fac > 0 ? enemy.x : enemy.x - reach, enemy.y + 4, reach, 14);
        } else if (bossAi.move && (bossAi.move.kind === 'aoe' || bossAi.move.kind === 'slam')) {
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y + 14, reach * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
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
      'SAN-20 Boss轴 · 预警闪/招式名 · 2P Boss×1.4',
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
      drawText(
        ctx,
        enemy.airborne ? `${enemy.name} ✈` : enemy.name,
        W / 2,
        4,
        7,
        '#e0b0b0',
        'center',
      );
      ctx.fillStyle = '#301818';
      ctx.fillRect(bx, 14, bw, 8);
      ctx.fillStyle = '#d04040';
      ctx.fillRect(bx, 14, bw * (enemy.hp / enemy.hpMax), 8);
      ctx.strokeStyle = '#a06060';
      ctx.strokeRect(bx + 0.5, 14.5, bw - 1, 7);
    }

    drawText(ctx, hud.stageName, 8, H - 12, 6, '#8090a0');
    if (teachMsg) drawText(ctx, teachMsg, W / 2, H - 12, 6, '#c0a878', 'center');
    if (enemy.alive && enemy.bumps) {
      drawText(ctx, `撞 ${bumpCount}/${enemy.bumps.count}`, W / 2, 26, 7, '#e0b090', 'center');
    }
    if (enemy.alive && bossAi && bossAi.moveHudT > 0 && bossAi.teleLabel) {
      const st = bossAi.state === 'telegraph' ? '预警' : bossAi.state === 'attack' ? '出手' : '';
      drawText(
        ctx,
        `${st ? st + ' · ' : ''}${bossAi.teleLabel}`,
        W / 2,
        enemy.bumps ? 36 : 26,
        7,
        bossAi.state === 'telegraph' ? '#ffe080' : '#f0a070',
        'center',
      );
    }
    if (enemy.alive && enemy.weak && enemy.weak.length) {
      drawText(ctx, `弱:${enemy.weak.join('')}`, W / 2, 46, 6, '#a0c0e0', 'center');
    }
    if (insideZone) drawText(ctx, `密室:${insideZone}`, 8, 72, 6, '#80a0c0');
    if (script && script.id === 4) drawText(ctx, `灯序 ${lampSeq}/2`, 8, 82, 6, '#e0c060');
    if (script && script.id === 7 && p.runFlags) {
      drawText(ctx, p.runFlags.route_s7 === 'thunder' ? '路线:电道' : '路线:主路', 8, 82, 6, '#a0c0e0');
    }
    if (formPhase && script && script.formation) {
      const n = script.formation.waves.length;
      const st = formFailed ? '失败' : '进行';
      drawText(ctx, `破阵 ${formWaveIdx + 1}/${n} · ${st}`, W / 2, 26, 7, '#e0c080', 'center');
      drawText(ctx, `时限 ${Math.max(0, formTimer).toFixed(1)}s`, W / 2, 36, 7, formTimer < 5 ? '#f08060' : '#c0e080', 'center');
    } else if (formDone && script && script.id === 5) {
      drawText(
        ctx,
        formFailed ? '破阵 失败' : '破阵 成功',
        W / 2,
        26,
        7,
        formFailed ? '#e08060' : '#80e0a0',
        'center',
      );
    }
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
    get stageClear() {
      return stageClearReady;
    },
    consumeStageClear() {
      const v = stageClearReady;
      stageClearReady = false;
      return v;
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
