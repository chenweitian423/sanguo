/** Drop tables (SAN-10) — 119-style: grunt throwables, chest treasures, boss ground heal, money = score. */

export const THROW_POOL = ['sleeve', 'bomb', 'poison_dart', 'smoke', 'lotus'];
export const TREASURE_POOL = ['tianshi', 'zhangling', 'huangshi', 'puppet'];
export const HEAL_LABELS = [
  { label: '鸡腿', heal: 35 },
  { label: '包子', heal: 20 },
  { label: '酒壶', heal: 15 },
];

export function roll(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Grunt death → common throwable into bag (caller adds qty). */
export function dropFromGrunt() {
  if (Math.random() > 0.55) return null;
  return { type: 'bag', itemId: roll(THROW_POOL), qty: 1 };
}

/** Chest → throwable or treasure. */
export function dropFromChest() {
  const treasure = Math.random() < 0.45;
  return {
    type: 'bag',
    itemId: treasure ? roll(TREASURE_POOL) : roll(THROW_POOL),
    qty: treasure ? 1 : 1 + Math.floor(Math.random() * 2),
  };
}

/** Boss death → always at least one ground heal; optional bag. */
export function dropFromBoss() {
  const heal = roll(HEAL_LABELS);
  const out = [{ type: 'heal', ...heal }];
  if (Math.random() < 0.5) {
    out.push({ type: 'bag', itemId: roll(TREASURE_POOL), qty: 1 });
  }
  return out;
}

/** Ground money — score only, never bag. */
export function spawnMoney() {
  const r = Math.random();
  if (r < 0.55) return { type: 'money', kind: '铜', score: 100, color: '#b87333' };
  if (r < 0.85) return { type: 'money', kind: '银', score: 500, color: '#c0c0d0' };
  return { type: 'money', kind: '金', score: 2000, color: '#f0c040' };
}
