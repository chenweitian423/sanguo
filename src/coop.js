/** SAN-12: 2P co-op rules — trailing scroll lock, shared flags, separate bags/scores. */

export const COOP = {
  bossHpMult: 1.4,
  gruntHpMult: 1.65, // mid of 1.5–1.8
  itemQtyMult: 1.5, // mid of 1.4–1.6 when spawning bag drops
  bossPackBothFull: true,
  noFriendlyFire: true,
  worldW: 640,
  cameraLead: 72,
  rightMargin: 48,
};

export function isTwoPlayer(n) {
  return (n || 1) >= 2;
}

export function scaleEnemyHp(base, playerCount, { boss = false } = {}) {
  if (!isTwoPlayer(playerCount)) return base;
  const m = boss ? COOP.bossHpMult : COOP.gruntHpMult;
  return Math.round(base * m);
}

export function scaleDropQty(qty, playerCount) {
  if (!isTwoPlayer(playerCount)) return qty;
  return Math.max(1, Math.round(qty * COOP.itemQtyMult));
}

/**
 * Camera X follows the trailing (leftmost) living player.
 * Leaders cannot push the view past trailing + lead.
 */
export function trailingScrollX(playerXs, viewW, worldW = COOP.worldW) {
  if (!playerXs.length) return 0;
  const trail = Math.min(...playerXs);
  const lead = Math.max(...playerXs);
  let sx = trail - COOP.cameraLead;
  // keep leader roughly on screen
  const maxByLead = lead - (viewW - COOP.rightMargin);
  sx = Math.max(sx, maxByLead);
  sx = Math.max(0, Math.min(worldW - viewW, sx));
  return sx;
}

/** Clamp a player's desired X so they can't outrun the trailing scroll gate. */
export function clampPlayerX(x, scrollX, viewW, worldW = COOP.worldW) {
  const minX = scrollX + 16;
  const maxX = scrollX + viewW - COOP.rightMargin;
  return Math.max(16, Math.min(worldW - 16, Math.max(minX, Math.min(maxX, x))));
}
