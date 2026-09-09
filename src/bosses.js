/**
 * SAN-20: Boss relative stats (Notion A=10) + short move axes (60fps → seconds).
 * Weaknesses live in leveling.BOSS_WEAK — do not diverge.
 */
import { BOSS_WEAK } from './leveling.js';

/** Map Notion relative HP → current play HP scale (孙姬 450 → 120). */
export const PLAY_HP_PER_REL = 120 / 450;

export function playHpFromRel(relHp) {
  return Math.max(1, Math.round(relHp * PLAY_HP_PER_REL));
}

/** Canonical relative table (Notion Boss相对数值). atk is relative; play uses scaled contact/pattern dmg. */
export const BOSS_STATS = {
  sunji: { name: '孙姬', relHp: 450, relAtk: 18, packScore: 20000 },
  cheliji: { name: '彻里吉', relHp: 500, relAtk: 20, packScore: 25000 },
  xiahouyuan: { name: '夏侯渊', relHp: 700, relAtk: 22, packScore: 30000 },
  mengyou: { name: '孟优', relHp: 550, relAtk: 20, packScore: 22000 },
  xiaohoudun: { name: '夏侯惇', relHp: 700, relAtk: 24, packScore: 28000 },
  zhangliao: { name: '张辽', relHp: 650, relAtk: 22, packScore: 26000 },
  lumeng: { name: '吕蒙', relHp: 750, relAtk: 24, packScore: 32000 },
  enemydiao: { name: '敌貂蝉', relHp: 600, relAtk: 26, packScore: 18000 },
  shamoke: { name: '沙摩柯', relHp: 700, relAtk: 22, packScore: 28000 },
  lubu: { name: '吕布', relHp: 900, relAtk: 28, packScore: 45000 },
  luxun: { name: '陆逊', relHp: 550, relAtk: 20, packScore: 24000 },
  zuoci: { name: '左慈', relHp: 800, relAtk: 26, packScore: 30000, airborne: true },
  xuchu: { name: '许褚', relHp: 850, relAtk: 26, packScore: 45000 },
  menghuo: { name: '孟获', relHp: 700, relAtk: 22, packScore: 30000 },
  huanggai: { name: '黄盖', relHp: 780, relAtk: 24, packScore: 32000 },
  yueji: { name: '越吉', relHp: 650, relAtk: 22, packScore: 28000 },
  weiyan: { name: '魏延', relHp: 750, relAtk: 24, packScore: 30000 },
  simayi: { name: '司马懿', relHp: 900, relAtk: 26, packScore: 40000 },
  caocao: { name: '曹操', relHp: 1200, relAtk: 30, packScore: 80000 },
  /** Optional high-score stub — stats only; spawn not wired (scope). */
  lubu_bonus: { name: '高分吕布', relHp: 1000, relAtk: 30, packScore: 50000, bonus: true },
  wood: { name: '木桩校尉', relHp: 300, relAtk: 12, packScore: 900 },
};

/**
 * Short axes from Notion Boss短轴 / 完整轴.
 * tele/active/recover in frames @60fps. kind: slash|dash|ranged|aoe|slam
 */
function mv(id, name, tele, active, recover, kind, opts = {}) {
  return { id, name, tele, active, recover, kind, reach: 36, dmg: 12, ...opts };
}

export const BOSS_AXES = {
  sunji: {
    idle: [36, 64],
    moves: [
      mv('slash', '快斩', 10, 8, 16, 'slash', { reach: 34, dmg: 11 }),
      mv('double', '二连', 14, 16, 20, 'slash', { reach: 38, dmg: 9, hits: 2 }),
      mv('spin', '回旋', 16, 14, 22, 'aoe', { reach: 48, dmg: 10 }),
      mv('call', '召兵', 28, 6, 40, 'aoe', { reach: 20, dmg: 4, flash: true }),
    ],
  },
  cheliji: {
    idle: [40, 70],
    moves: [
      mv('slash', '横砍', 14, 10, 18, 'slash', { reach: 36, dmg: 12 }),
      mv('charge', '蛮冲', 18, 16, 24, 'dash', { reach: 40, dmg: 14, speed: 160 }),
      mv('stomp', '踏地', 20, 10, 26, 'aoe', { reach: 44, dmg: 11 }),
    ],
  },
  xiahouyuan: {
    idle: [32, 58],
    moves: [
      mv('slash', '横斩', 12, 10, 18, 'slash', { reach: 40, dmg: 13 }),
      mv('sleeve', '袖箭', 16, 8, 22, 'ranged', { reach: 110, dmg: 10, speed: 220 }),
      mv('charge', '冲锋', 18, 18, 24, 'dash', { reach: 42, dmg: 15, speed: 180 }),
      mv('rise', '起身斩', 10, 12, 20, 'slash', { reach: 44, dmg: 14 }),
    ],
  },
  mengyou: {
    idle: [40, 72],
    moves: [
      mv('slash', '横斩', 14, 10, 20, 'slash', { reach: 38, dmg: 12 }),
      mv('ram', '冲撞', 18, 16, 26, 'dash', { reach: 40, dmg: 14, speed: 150 }),
      mv('laugh', '哈哈笑', 28, 12, 30, 'aoe', { reach: 56, dmg: 9, flash: true }),
    ],
  },
  xiaohoudun: {
    idle: [34, 60],
    moves: [
      mv('combo', '大刀连', 14, 18, 22, 'slash', { reach: 42, dmg: 10, hits: 3 }),
      mv('poison', '起身毒', 16, 10, 24, 'aoe', { reach: 40, dmg: 11 }),
      mv('roll', '刺猬滚轮', 22, 18, 28, 'dash', { reach: 36, dmg: 15, speed: 200 }),
    ],
  },
  zhangliao: {
    idle: [30, 54],
    moves: [
      mv('sleeve', '袖箭', 20, 8, 20, 'ranged', { reach: 120, dmg: 11, speed: 240 }),
      mv('pillar', '机关柱', 24, 12, 28, 'aoe', { reach: 50, dmg: 13 }),
      mv('super', '超必', 30, 16, 36, 'dash', { reach: 48, dmg: 18, speed: 190 }),
      mv('advance', '步步推进', 12, 10, 16, 'slash', { reach: 34, dmg: 10 }),
    ],
  },
  lumeng: {
    idle: [24, 48],
    moves: [
      mv('skew', '斜走', 10, 14, 16, 'dash', { reach: 34, dmg: 11, speed: 170 }),
      mv('fast', '快斩', 12, 8, 14, 'slash', { reach: 32, dmg: 12 }),
      mv('rise', '起身痛击', 14, 12, 20, 'slash', { reach: 40, dmg: 15 }),
    ],
  },
  enemydiao: {
    idle: [20, 40],
    moves: [
      mv('counter', '强制反击', 8, 10, 14, 'slash', { reach: 36, dmg: 14 }),
      mv('flower', '天女散花', 18, 16, 24, 'ranged', { reach: 90, dmg: 10, speed: 180, hits: 3 }),
      mv('kick', '踢云', 12, 10, 16, 'dash', { reach: 38, dmg: 12, speed: 200 }),
    ],
  },
  shamoke: {
    idle: [36, 64],
    moves: [
      mv('axe', '巨斧', 16, 12, 22, 'slash', { reach: 44, dmg: 14 }),
      mv('charge', '蛮冲', 18, 16, 24, 'dash', { reach: 40, dmg: 15, speed: 160 }),
      mv('sweep', '横扫', 14, 10, 20, 'aoe', { reach: 48, dmg: 12 }),
    ],
  },
  lubu: {
    idle: [28, 50],
    rageIdle: [16, 32],
    moves: [
      mv('triple', '三段', 14, 20, 22, 'slash', { reach: 42, dmg: 11, hits: 3 }),
      mv('slam', '跳砸', 18, 12, 24, 'slam', { reach: 50, dmg: 18 }),
      mv('rush', '冲刺', 12, 16, 18, 'dash', { reach: 40, dmg: 16, speed: 220 }),
    ],
    rageMoves: [
      mv('triple', '三段·狂', 10, 18, 14, 'slash', { reach: 44, dmg: 12, hits: 3 }),
      mv('slam', '跳砸·狂', 12, 12, 16, 'slam', { reach: 54, dmg: 20 }),
      mv('rush', '冲刺·狂', 8, 14, 12, 'dash', { reach: 42, dmg: 17, speed: 260 }),
    ],
  },
  luxun: {
    idle: [32, 56],
    moves: [
      mv('slide', '滑砍', 16, 12, 20, 'slash', { reach: 40, dmg: 13 }),
      mv('close', '近身危', 10, 10, 16, 'slash', { reach: 30, dmg: 15 }),
      mv('feint', '表演斩', 20, 8, 22, 'dash', { reach: 36, dmg: 12, speed: 140 }),
    ],
  },
  zuoci: {
    idle: [40, 70],
    airborne: true,
    moves: [
      mv('charm', '变化符', 22, 14, 28, 'ranged', { reach: 100, dmg: 12, speed: 160 }),
      mv('orbit', '环飞', 18, 16, 24, 'aoe', { reach: 52, dmg: 11 }),
      mv('dive', '俯冲', 14, 14, 22, 'dash', { reach: 40, dmg: 15, speed: 180 }),
    ],
  },
  xuchu: {
    idle: [30, 55],
    moves: [
      mv('bash', '蛮拳', 12, 10, 18, 'slash', { reach: 36, dmg: 15 }),
      mv('rush', '虎冲', 16, 18, 22, 'dash', { reach: 42, dmg: 16, speed: 190 }),
      mv('quake', '撼地', 20, 12, 26, 'aoe', { reach: 54, dmg: 14 }),
      mv('grab', '抓投', 14, 10, 20, 'slash', { reach: 28, dmg: 18 }),
    ],
  },
  menghuo: {
    idle: [36, 66],
    moves: [
      mv('slash', '横斩', 14, 10, 20, 'slash', { reach: 38, dmg: 13 }),
      mv('ram', '冲撞', 18, 16, 24, 'dash', { reach: 42, dmg: 15, speed: 155 }),
      mv('elephant', '象冲', 26, 18, 32, 'dash', { reach: 50, dmg: 17, speed: 170 }),
      mv('laugh', '狂笑', 28, 12, 30, 'aoe', { reach: 56, dmg: 10, flash: true }),
    ],
  },
  huanggai: {
    idle: [34, 60],
    moves: [
      mv('fire', '火攻', 18, 14, 24, 'ranged', { reach: 100, dmg: 13, speed: 170 }),
      mv('ult', '无敌大招', 30, 20, 40, 'aoe', { reach: 70, dmg: 16, invuln: true, flash: true }),
      mv('slash', '船斩', 12, 10, 18, 'slash', { reach: 38, dmg: 12 }),
    ],
  },
  yueji: {
    idle: [32, 58],
    moves: [
      mv('ride', '骑突', 16, 18, 22, 'dash', { reach: 44, dmg: 14, speed: 200 }),
      mv('lance', '骑枪', 12, 10, 18, 'slash', { reach: 46, dmg: 13 }),
      mv('circle', '回转', 18, 14, 24, 'aoe', { reach: 48, dmg: 12 }),
    ],
  },
  weiyan: {
    idle: [30, 54],
    moves: [
      mv('disc', '飞盘', 16, 10, 20, 'ranged', { reach: 120, dmg: 12, speed: 210 }),
      mv('skew', '斜冲', 14, 16, 20, 'dash', { reach: 40, dmg: 14, speed: 190 }),
      mv('back', '绕背斩', 12, 10, 16, 'slash', { reach: 34, dmg: 13 }),
    ],
  },
  simayi: {
    idle: [36, 64],
    moves: [
      mv('talisman', '符箓', 20, 12, 24, 'ranged', { reach: 110, dmg: 13, speed: 150 }),
      mv('field', '法阵', 26, 16, 30, 'aoe', { reach: 60, dmg: 14, flash: true }),
      mv('push', '推掌', 12, 10, 18, 'slash', { reach: 36, dmg: 12 }),
    ],
  },
  caocao: {
    idle: [28, 50],
    phaseLock: 45,
    phase1: [
      mv('qi', '剑气线', 18, 12, 22, 'ranged', { reach: 130, dmg: 13, speed: 260 }),
      mv('thunder', '落雷', 22, 14, 26, 'aoe', { reach: 48, dmg: 15, flash: true }),
      mv('clone', '分身', 24, 10, 28, 'dash', { reach: 40, dmg: 12, speed: 200 }),
    ],
    phase2: [
      mv('chain', '连雷', 14, 18, 20, 'aoe', { reach: 56, dmg: 14, hits: 3, flash: true }),
      mv('screen', '全屏狂雷', 36, 20, 40, 'aoe', { reach: 200, dmg: 18, flash: true }),
      mv('fan', '扇形剑气', 20, 14, 24, 'ranged', { reach: 100, dmg: 15, speed: 240, hits: 2 }),
    ],
    moves: [], // filled by phase
  },
  lubu_bonus: {
    idle: [20, 36],
    moves: [
      mv('triple', '三段', 10, 18, 14, 'slash', { reach: 44, dmg: 14, hits: 3 }),
      mv('slam', '跳砸', 12, 12, 16, 'slam', { reach: 54, dmg: 20 }),
      mv('rush', '冲刺', 8, 14, 12, 'dash', { reach: 42, dmg: 18, speed: 270 }),
    ],
  },
  wood: {
    idle: [90, 120],
    moves: [mv('poke', '木桩戳', 20, 8, 30, 'slash', { reach: 28, dmg: 6 })],
  },
};

export function bossWeak(id) {
  return BOSS_WEAK[id] ? [...BOSS_WEAK[id]] : [];
}

/**
 * Merge stage boss stub with canonical stats. HP prefers table playHp; weak from BOSS_WEAK.
 */
export function resolveBossDef(stageBoss = {}) {
  const id = stageBoss.id || 'wood';
  const stats = BOSS_STATS[id] || {};
  const weak = bossWeak(id);
  const hp =
    stats.relHp != null ? playHpFromRel(stats.relHp) : stageBoss.hp != null ? stageBoss.hp : 100;
  return {
    ...stageBoss,
    id,
    name: stageBoss.name || stats.name || id,
    hp,
    hpBase: hp,
    relHp: stats.relHp || null,
    relAtk: stats.relAtk != null ? stats.relAtk : 18,
    weak: Object.prototype.hasOwnProperty.call(BOSS_WEAK, id) ? weak : (stageBoss.weak || []),
    packScore: stageBoss.packScore || stats.packScore || 900,
    airborne: !!(stageBoss.airborne || stats.airborne),
  };
}

export function framesToSec(f) {
  return f / 60;
}

export function createBossAi(bossId) {
  const axis = BOSS_AXES[bossId] || BOSS_AXES.wood;
  return {
    id: bossId,
    phase: 1,
    phaseLockT: 0,
    state: 'idle',
    timer: framesToSec(randRange(axis.idle || [40, 70])),
    move: null,
    hitLeft: 0,
    hitCd: 0,
    facing: -1,
    dashVx: 0,
    teleLabel: '',
    teleFlash: 0,
    moveHudT: 0,
    invulnT: 0,
    projectiles: [],
    rage: false,
  };
}

function randRange([a, b]) {
  return a + Math.random() * (b - a);
}

function pickMoves(axis, ai, hpRatio) {
  if (ai.id === 'caocao') {
    return ai.phase >= 2 ? axis.phase2 || axis.phase1 : axis.phase1 || axis.moves;
  }
  if (ai.id === 'lubu' && hpRatio < 0.5 && axis.rageMoves) return axis.rageMoves;
  return axis.moves || [];
}

function idleRange(axis, ai, hpRatio) {
  if (ai.id === 'lubu' && hpRatio < 0.5 && axis.rageIdle) return axis.rageIdle;
  return axis.idle || [40, 70];
}

/**
 * Advance boss AI. Mutates `enemy` position / flash fields.
 * @returns {{ dmgEvents: {x,y,reach,dmg,kind}[], label: string|null, flash: boolean }}
 */
export function tickBossAi(ai, enemy, targets, dt, world) {
  const out = { dmgEvents: [], label: null, flash: false, projectiles: ai.projectiles };
  if (!ai || !enemy || !enemy.alive || enemy.waiting) return out;
  if ((enemy.stunT || 0) > 0) return out;

  const axis = BOSS_AXES[ai.id] || BOSS_AXES.wood;
  const hpRatio = enemy.hpMax > 0 ? enemy.hp / enemy.hpMax : 1;

  if (ai.invulnT > 0) ai.invulnT -= dt;
  if (ai.teleFlash > 0) ai.teleFlash -= dt;
  if (ai.moveHudT > 0) ai.moveHudT -= dt;
  if (ai.hitCd > 0) ai.hitCd -= dt;

  // Cao Cao phase transition
  if (ai.id === 'caocao' && ai.phase === 1 && hpRatio < 0.5 && ai.phaseLockT <= 0 && ai.state === 'idle') {
    ai.phase = 2;
    ai.phaseLockT = framesToSec(axis.phaseLock || 45);
    ai.state = 'phase_lock';
    ai.teleLabel = '曹操·变身';
    ai.moveHudT = 1.2;
    ai.teleFlash = 0.8;
    out.label = '曹操·二阶段';
    out.flash = true;
  }
  if (ai.phaseLockT > 0) {
    ai.phaseLockT -= dt;
    if (ai.phaseLockT <= 0 && ai.state === 'phase_lock') {
      ai.state = 'idle';
      ai.timer = framesToSec(randRange(idleRange(axis, ai, hpRatio)));
    }
    return out;
  }

  if (ai.id === 'lubu' && hpRatio < 0.5 && !ai.rage) {
    ai.rage = true;
    out.label = '吕布·半血加速';
  }

  // face nearest
  const nearest = nearestTarget(targets, enemy.x);
  if (nearest) ai.facing = nearest.x >= enemy.x ? 1 : -1;

  // projectiles
  for (let i = ai.projectiles.length - 1; i >= 0; i--) {
    const pr = ai.projectiles[i];
    pr.x += pr.vx * dt;
    pr.life -= dt;
    if (pr.life <= 0 || pr.x < (world?.scrollX || 0) - 40 || pr.x > (world?.scrollX || 0) + (world?.viewW || 384) + 40) {
      ai.projectiles.splice(i, 1);
      continue;
    }
    for (const f of targets) {
      if (!f || f.hp <= 0 || (f.invulnT || 0) > 0) continue;
      if (Math.abs(pr.x - f.x) < 14 && Math.abs((pr.y || enemy.y) - f.y) < 20) {
        out.dmgEvents.push({ x: pr.x, y: pr.y || enemy.y, reach: 14, dmg: pr.dmg, kind: 'ranged', target: f });
        ai.projectiles.splice(i, 1);
        break;
      }
    }
  }

  ai.timer -= dt;

  if (ai.state === 'idle') {
    if (ai.timer <= 0) {
      const pool = pickMoves(axis, ai, hpRatio);
      if (!pool.length) {
        ai.timer = framesToSec(40);
        return out;
      }
      ai.move = pool[(Math.random() * pool.length) | 0];
      ai.state = 'telegraph';
      ai.timer = framesToSec(ai.move.tele);
      ai.teleLabel = ai.move.name;
      ai.moveHudT = framesToSec(ai.move.tele) + 0.35;
      ai.teleFlash = framesToSec(ai.move.tele);
      ai.hitLeft = ai.move.hits || 1;
      ai.hitCd = 0;
      out.label = ai.move.name;
      out.flash = true;
    }
    return out;
  }

  if (ai.state === 'telegraph') {
    enemy.hitFlash = Math.max(enemy.hitFlash || 0, 0.05);
    if (ai.timer <= 0) {
      ai.state = 'attack';
      ai.timer = framesToSec(ai.move.active);
      if (ai.move.invuln) ai.invulnT = framesToSec(ai.move.active + (ai.move.recover || 0) * 0.5);
      if (ai.move.kind === 'dash') {
        ai.dashVx = (ai.move.speed || 160) * ai.facing;
      }
      if (ai.move.kind === 'slam') {
        enemy._slamY = enemy.y;
        enemy.y = (enemy.airborne ? 100 : 148) - 40;
      }
      if (ai.move.kind === 'ranged') {
        const n = ai.move.hits || 1;
        for (let h = 0; h < n; h++) {
          ai.projectiles.push({
            x: enemy.x + ai.facing * 12,
            y: enemy.y + 8 + h * 4,
            vx: (ai.move.speed || 200) * ai.facing * (h === 0 ? 1 : 0.85 + h * 0.05),
            dmg: scaleAtk(ai.move.dmg, enemy.relAtk),
            life: 1.4,
          });
        }
      }
    }
    return out;
  }

  if (ai.state === 'attack') {
    if (ai.move.kind === 'dash' && ai.dashVx) {
      enemy.x += ai.dashVx * dt;
      const minX = (world?.scrollX || 0) + 40;
      const maxX = (world?.scrollX || 0) + (world?.viewW || 384) - 40;
      if (enemy.x < minX) {
        enemy.x = minX;
        ai.dashVx = 0;
      }
      if (enemy.x > maxX) {
        enemy.x = maxX;
        ai.dashVx = 0;
      }
    }
    if (ai.move.kind === 'slam') {
      enemy.y += 220 * dt;
      if (enemy.y >= (enemy._slamY || 148)) {
        enemy.y = enemy._slamY || 148;
      }
    }

    // patterned hit windows
    if (ai.hitLeft > 0 && ai.hitCd <= 0) {
      const dmg = scaleAtk(ai.move.dmg, enemy.relAtk);
      const reach = ai.move.reach || 36;
      if (ai.move.kind === 'aoe' || ai.move.kind === 'slam') {
        for (const f of targets) {
          if (!f || f.hp <= 0) continue;
          if (Math.abs(f.x - enemy.x) < reach && Math.abs(f.y - enemy.y) < 36) {
            out.dmgEvents.push({ x: enemy.x, y: enemy.y, reach, dmg, kind: ai.move.kind, target: f });
          }
        }
        if (ai.move.flash) out.flash = true;
      } else if (ai.move.kind === 'slash' || ai.move.kind === 'dash') {
        for (const f of targets) {
          if (!f || f.hp <= 0) continue;
          const dx = (f.x - enemy.x) * ai.facing;
          const near = ai.move.kind === 'dash' ? Math.abs(f.x - enemy.x) < reach : dx > -8 && dx < reach;
          if (near && Math.abs(f.y - enemy.y) < 28) {
            out.dmgEvents.push({ x: enemy.x, y: enemy.y, reach, dmg, kind: ai.move.kind, target: f });
          }
        }
      }
      ai.hitLeft -= 1;
      ai.hitCd = ai.move.hits > 1 ? framesToSec(Math.max(4, (ai.move.active / (ai.move.hits || 1)) | 0)) : 99;
    }

    if (ai.timer <= 0) {
      if (ai.move.kind === 'slam') enemy.y = enemy._slamY || 148;
      ai.dashVx = 0;
      ai.state = 'recover';
      ai.timer = framesToSec(ai.move.recover);
    }
    return out;
  }

  if (ai.state === 'recover') {
    if (ai.timer <= 0) {
      ai.state = 'idle';
      ai.move = null;
      ai.teleLabel = '';
      ai.timer = framesToSec(randRange(idleRange(axis, ai, hpRatio)));
    }
  }

  return out;
}

function scaleAtk(baseDmg, relAtk) {
  const a = relAtk != null ? relAtk : 18;
  return Math.max(4, Math.round(baseDmg * (a / 18)));
}

function nearestTarget(targets, x) {
  let best = null;
  let bestD = 1e9;
  for (const f of targets || []) {
    if (!f || f.hp <= 0) continue;
    const d = Math.abs(f.x - x);
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  return best;
}

/** Ground-only attacks vs airborne bosses (左慈) deal reduced damage. */
export function airborneHitMult(enemy, attacker) {
  if (!enemy || !enemy.airborne) return 1;
  if (attacker && attacker.airborne) return 1;
  return 0.55;
}
