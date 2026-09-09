/**
 * SAN-21: grunt relative tiers (Notion A=10 baseline) + per-stage HP/ATK mult.
 * Play HP ≈ relHp × PLAY_HP_PER_REL (A=10 → ~18).
 */

/** A=10 → ~18 play HP (matches early-stage grunt blobs). */
export const PLAY_HP_PER_REL = 1.8;

/** Contact ATK scale: relAtk 10 → ~8 play dmg/sec-ish contact stub. */
export const PLAY_ATK_PER_REL = 0.8;

/**
 * @typedef {{ name: string, relHp: number, relAtk: number, color: string, label?: string }} GruntTier
 */

/** @type {Record<string, GruntTier>} */
export const GRUNT_TIERS = {
  sword: { name: '刀兵', relHp: 10, relAtk: 10, color: '#c07060', label: '刀' },
  spear: { name: '枪兵', relHp: 11, relAtk: 11, color: '#8090a0', label: '枪' },
  shield: { name: '盾兵', relHp: 16, relAtk: 8, color: '#607080', label: '盾' },
  archer: { name: '弓兵', relHp: 8, relAtk: 12, color: '#70a070', label: '弓' },
  throw: { name: '投兵', relHp: 9, relAtk: 11, color: '#a08060', label: '投' },
  ninja: { name: '忍者', relHp: 9, relAtk: 14, color: '#505070', label: '忍' },
  rider: { name: '骑兵', relHp: 14, relAtk: 13, color: '#906050', label: '骑' },
  armor: { name: '甲兵', relHp: 18, relAtk: 10, color: '#708090', label: '甲' },
  leopard: { name: '豹骑', relHp: 12, relAtk: 15, color: '#c09040', label: '豹' },
  elite: { name: '精锐', relHp: 20, relAtk: 16, color: '#e0c060', label: '锐' },
};

export const GRUNT_TYPE_IDS = Object.keys(GRUNT_TIERS);

/** Stage HP/ATK multipliers (ticket: 1≈0.85 … 6–7≈1.3/1.2). */
export const STAGE_GRUNT_MULT = {
  1: { hp: 0.85, atk: 0.85 },
  2: { hp: 0.95, atk: 0.9 },
  3: { hp: 1.0, atk: 1.0 },
  4: { hp: 1.1, atk: 1.05 },
  5: { hp: 1.15, atk: 1.1 },
  6: { hp: 1.3, atk: 1.2 },
  7: { hp: 1.3, atk: 1.2 },
};

export function stageGruntMult(stageId) {
  return STAGE_GRUNT_MULT[stageId] || STAGE_GRUNT_MULT[3];
}

export function getGruntTier(type) {
  return GRUNT_TIERS[type] || GRUNT_TIERS.sword;
}

/**
 * Default type when wave omits `type` — rotates by index, biases later stages toward heavier tiers.
 * @param {number} stageId
 * @param {number} index
 */
export function defaultGruntType(stageId, index = 0) {
  const early = ['sword', 'spear', 'throw', 'archer'];
  const mid = ['sword', 'spear', 'shield', 'archer', 'throw', 'ninja'];
  const late = ['spear', 'shield', 'rider', 'armor', 'ninja', 'leopard', 'elite'];
  const pool = stageId >= 6 ? late : stageId >= 4 ? mid : early;
  return pool[index % pool.length];
}

/**
 * Build play-ready grunt stats from wave stub `{ x, hp?, type?, isEye? }`.
 * Explicit `hp` in stage data still wins (formation tuning); type/atk/color always attached.
 *
 * @param {{ x: number, y?: number, hp?: number, type?: string, isEye?: boolean }} g
 * @param {{ stageId: number, index?: number, playerCount?: number, scaleHp?: (n:number)=>number }} opts
 */
export function makeGrunt(g, opts) {
  const stageId = opts.stageId || 1;
  const index = opts.index || 0;
  const type = g.type || defaultGruntType(stageId, index);
  const tier = getGruntTier(type);
  const mult = stageGruntMult(stageId);
  const baseHp =
    g.hp != null
      ? g.hp
      : Math.max(1, Math.round(tier.relHp * PLAY_HP_PER_REL * mult.hp));
  const scaleHp = opts.scaleHp || ((n) => n);
  const hp = scaleHp(baseHp);
  const atk = Math.max(1, Math.round(tier.relAtk * PLAY_ATK_PER_REL * mult.atk));
  return {
    x: g.x,
    y: g.y != null ? g.y : 148,
    hp,
    hpMax: hp,
    alive: true,
    stunT: 0,
    type,
    name: tier.name,
    color: tier.color,
    label: tier.label,
    relHp: tier.relHp,
    relAtk: tier.relAtk,
    atk,
    isEye: !!g.isEye,
  };
}
