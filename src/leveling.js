/** SAN-11: eased score→level table, ATK tiers, item power, elemental multipliers. */

/** Guanyu PLUS × 0.4, rounded to thousands. Index = level (1..24); need this score to REACH that level. */
export const EASED_THRESHOLDS = (() => {
  const plus = [
    32500, 65000, 97500, 130000, 175500, 221000, 266500, 312000, 364000, 416000,
    468000, 520000, 578500, 637000, 695500, 754000, 806000, 884000, 936000, 988000,
    1040000, 1300000, 1625000, 1950000,
  ];
  return plus.map((v) => Math.round((v * 0.4) / 1000) * 1000);
})();

/** Five ATK tiers (LV 0–4 / 5–9 / 10–14 / 15–19 / 20–24). */
export const ATK_BY_CHAR = {
  zhangfei: [128, 136, 144, 152, 160],
  guanyu: [112, 120, 128, 136, 144],
  zhaoyun: [112, 120, 128, 136, 144],
  machao: [112, 120, 128, 136, 144],
  huangzhong: [120, 128, 136, 144, 152],
  zhangliao: [104, 112, 120, 128, 136],
  zhuge: [96, 104, 112, 120, 128],
  diaochan: [88, 96, 104, 112, 120],
  mozhangfei: [88, 96, 104, 112, 120],
  baijia: [88, 96, 104, 112, 120],
};

export const BOSS_WEAK = {
  sunji: [],
  cheliji: ['电'],
  xiahouyuan: ['火'],
  mengyou: ['爆'],
  xiaohoudun: ['电'],
  zhangliao: [],
  lumeng: [],
  enemydiao: [],
  shamoke: ['冰'],
  lubu: ['火'],
  luxun: [],
  zuoci: ['火'],
  xuchu: ['毒'],
  menghuo: ['爆'],
  huanggai: ['冰'],
  yueji: ['电'],
  weiyan: ['电'],
  simayi: ['冰', '爆'],
  caocao: ['电'],
  lubu_bonus: ['火'],
  wood: [], // stub boss
};

const SWORD_ELEM = {
  sword_fire: '火',
  sword_ice: '冰',
  sword_thunder: '电',
  sword_boom: '爆',
};

export function levelFromScore(score) {
  let lv = 0;
  for (let i = 0; i < EASED_THRESHOLDS.length; i++) {
    if (score >= EASED_THRESHOLDS[i]) lv = i + 1;
    else break;
  }
  return Math.min(24, lv);
}

export function atkTier(level) {
  if (level >= 20) return 4;
  if (level >= 15) return 3;
  if (level >= 10) return 2;
  if (level >= 5) return 1;
  return 0;
}

/** Item power tier: 0–9 →1, 10–19 →2, ≥20 →3 (caps at 20). */
export function itemPowerTier(level) {
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  return 1;
}

export function atkStat(charId, level) {
  const row = ATK_BY_CHAR[charId] || ATK_BY_CHAR.guanyu;
  return row[atkTier(level)];
}

/** Attack speed multiplier vs LV0 (~+3.5% per tier). */
export function atkSpeedMult(level) {
  return 1 + atkTier(level) * 0.035;
}

export function swordElem(swordId) {
  return SWORD_ELEM[swordId] || null;
}

/**
 * Elemental multiplier.
 * Weakness hit → 1.5 (caller can force via weakHit).
 */
export function elemMult(atkElem, defElem, { weakHit = false } = {}) {
  if (weakHit) return 1.5;
  if (!atkElem) return 1;
  const a = atkElem;
  const d = defElem || '无';
  if (a === d) return 0.75;
  if ((a === '火' && d === '冰') || (a === '冰' && d === '火')) return 1.5;
  if (a === '爆' && d === '无') return 1.35;
  if (a === '爆' && d === '风') return 1.25;
  if (a === '电' && d === '毒') return 1.25;
  return 1;
}

export function isWeakHit(atkElem, weakList) {
  if (!atkElem || !weakList || !weakList.length) return false;
  return weakList.includes(atkElem);
}

/**
 * final = base × (atkStat/112) × elem_mult × (1 + sword_bonus)
 * Baseline ATK 112 (关羽 LV0) so base damage stays near prior feel.
 */
export function finalDamage({
  base,
  charId,
  level,
  atkElem = null,
  defElem = null,
  weakList = [],
  swordBonus = 0,
}) {
  const atk = atkStat(charId, level);
  const weakHit = isWeakHit(atkElem, weakList);
  const em = elemMult(atkElem, defElem, { weakHit });
  return base * (atk / 112) * em * (1 + swordBonus);
}

export function nextThreshold(level) {
  if (level >= 24) return null;
  return EASED_THRESHOLDS[level];
}
