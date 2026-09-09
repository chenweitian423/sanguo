/**
 * SAN-22 visual layer — original arcade-inspired art + procedural fallbacks.
 * Optional PNG under assets/bg/stageN.png and assets/chars/{charId}.png
 * (generated originals inspired by public 119 screenshots — NOT ROM dumps).
 * NO KOFs / 三国战纪 ROM sprites or ripped tiles.
 */

/** @type {Map<number, HTMLImageElement|null>} */
const bgCache = new Map();
/** @type {Set<number>} */
const bgTried = new Set();

/** @type {Map<string, HTMLImageElement|null>} */
const heroCache = new Map();
/** @type {Set<string>} */
const heroTried = new Set();

function readyImg(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

function tryLoadBg(stageId) {
  if (bgTried.has(stageId)) return bgCache.get(stageId) || null;
  bgTried.add(stageId);
  if (typeof Image === 'undefined') {
    bgCache.set(stageId, null);
    return null;
  }
  const img = new Image();
  img.onload = () => bgCache.set(stageId, img);
  img.onerror = () => bgCache.set(stageId, null);
  img.src = `assets/bg/stage${stageId}.png`;
  bgCache.set(stageId, null); // pending → procedural until load
  return null;
}

function tryLoadHero(charId) {
  const id = String(charId || '');
  if (!id) return null;
  if (heroTried.has(id)) return heroCache.get(id) || null;
  heroTried.add(id);
  if (typeof Image === 'undefined') {
    heroCache.set(id, null);
    return null;
  }
  const img = new Image();
  img.onload = () => heroCache.set(id, img);
  img.onerror = () => heroCache.set(id, null);
  img.src = `assets/chars/${id}.png`;
  heroCache.set(id, null); // pending → procedural until load
  return null;
}

/** Prefetch known roster art (safe no-ops if file missing). */
export function preloadHeroArt(ids) {
  for (const id of ids || []) tryLoadHero(id);
}

/** Feet sit near y+28 (graybox convention: body from y to y+28). */
const FEET = 28;

/** In-play PNG hero height (px). */
const HERO_PNG_H = 36;

/** Per-hero palette + weapon silhouette kind. */
export const HERO_LOOK = {
  guanyu: {
    robe: '#2a6b3a',
    trim: '#c8a040',
    skin: '#c87858',
    hair: '#1a1010',
    accent: '#a02828',
    weapon: 'blade',
    hat: 'helm',
  },
  zhangfei: {
    robe: '#2a3870',
    trim: '#d0b050',
    skin: '#b07050',
    hair: '#0a0808',
    accent: '#101018',
    weapon: 'spear',
    hat: 'band',
    beard: true,
  },
  zhaoyun: {
    robe: '#e8e8f0',
    trim: '#4070a0',
    skin: '#d09070',
    hair: '#201818',
    accent: '#c0c8e0',
    weapon: 'spear',
    hat: 'helm',
  },
  machao: {
    robe: '#c85828',
    trim: '#e0c060',
    skin: '#c88060',
    hair: '#181010',
    accent: '#f0e0c0',
    weapon: 'spear',
    hat: 'plume',
  },
  huangzhong: {
    robe: '#8a6830',
    trim: '#d0a040',
    skin: '#c89070',
    hair: '#d0c8b0',
    accent: '#604020',
    weapon: 'bow',
    hat: 'band',
  },
  zhuge: {
    robe: '#3a7850',
    trim: '#e0d090',
    skin: '#d09878',
    hair: '#101018',
    accent: '#f0e8c0',
    weapon: 'fan',
    hat: 'cap',
  },
  diaochan: {
    robe: '#c04078',
    trim: '#f0c0d0',
    skin: '#e0a888',
    hair: '#181018',
    accent: '#f8e0e8',
    weapon: 'dual',
    hat: 'hair',
  },
  zhangliao: {
    robe: '#4a5868',
    trim: '#a0b0c0',
    skin: '#c08060',
    hair: '#101018',
    accent: '#708090',
    weapon: 'blade',
    hat: 'helm',
  },
  mozhangfei: {
    robe: '#402060',
    trim: '#c04080',
    skin: '#906070',
    hair: '#100818',
    accent: '#e040a0',
    weapon: 'spear',
    hat: 'horns',
    beard: true,
  },
  baijia: {
    robe: '#d8d8e0',
    trim: '#a0a8b8',
    skin: '#c89070',
    hair: '#e8e0d0',
    accent: '#f0f0f8',
    weapon: 'bow',
    hat: 'helm',
  },
};

const STAGE_PAL = {
  1: { sky0: '#1a4060', sky1: '#4a80a0', ground: '#3a4a38', strip: '#2a3830', accent: '#c8a060' },
  2: { sky0: '#2a3048', sky1: '#687898', ground: '#4a4030', strip: '#3a3020', accent: '#a08050' },
  3: { sky0: '#183028', sky1: '#3a6850', ground: '#2a4028', strip: '#1a2818', accent: '#60a050' },
  4: { sky0: '#0a1020', sky1: '#1a2840', ground: '#181820', strip: '#101018', accent: '#406080' },
  5: { sky0: '#201828', sky1: '#483858', ground: '#302838', strip: '#201820', accent: '#c0a060' },
  6: { sky0: '#587090', sky1: '#b0c8d8', ground: '#d0d8e0', strip: '#a0b0c0', accent: '#e8f0f8' },
  7: { sky0: '#102030', sky1: '#305070', ground: '#2a3830', strip: '#1a2820', accent: '#e0c060' },
};

function pal(stageId) {
  return STAGE_PAL[stageId] || STAGE_PAL[1];
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * Scenic stage background with layered parallax + ground strip.
 * Draws in **screen space** (call before world translate).
 */
export function drawStageBackground(ctx, stageId, scrollX, W, H, worldW, t) {
  const id = stageId | 0 || 1;
  const img = tryLoadBg(id);
  if (readyImg(img)) {
    // Stretch/crop to cover H; parallax scroll with scrollX (wrap if wider than screen).
    const scale = H / img.naturalHeight;
    const dw = img.naturalWidth * scale;
    const dh = H;
    const par = 0.45;
    let ox = (scrollX * par) % Math.max(dw, 1);
    if (ox < 0) ox += dw;
    // If image barely wider than screen, clamp instead of wrapping hard seams
    if (dw <= W + 2) {
      const maxOff = Math.max(0, dw - W);
      const world = Math.max(1, (worldW || 960) - W);
      ox = maxOff > 0 ? Math.min(maxOff, (scrollX / world) * maxOff) : 0;
      ctx.drawImage(img, -ox, 0, dw, dh);
    } else {
      ctx.drawImage(img, -ox, 0, dw, dh);
      if (ox + W > dw) ctx.drawImage(img, -ox + dw, 0, dw, dh);
    }
    return;
  }

  const p = pal(id);
  const g = ctx.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, p.sky0);
  g.addColorStop(1, p.sky1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 160);

  const far = scrollX * 0.15;
  const mid = scrollX * 0.4;
  const near = scrollX * 0.75;

  switch (id) {
    case 1:
      drawRiverBoatBg(ctx, W, H, far, mid, near, t, p);
      break;
    case 2:
      drawMountainBg(ctx, W, H, far, mid, near, t, p);
      break;
    case 3:
      drawForestBg(ctx, W, H, far, mid, near, t, p);
      break;
    case 4:
      drawRainNightBg(ctx, W, H, far, mid, near, t, p);
      break;
    case 5:
      drawFormationMistBg(ctx, W, H, far, mid, near, t, p);
      break;
    case 6:
      drawSnowCityBg(ctx, W, H, far, mid, near, t, p);
      break;
    case 7:
      drawRiverFinaleBg(ctx, W, H, far, mid, near, t, p);
      break;
    default:
      drawRiverBoatBg(ctx, W, H, far, mid, near, t, p);
  }

  // ground strip
  ctx.fillStyle = p.strip;
  ctx.fillRect(0, 160, W, H - 160);
  ctx.fillStyle = p.ground;
  ctx.fillRect(0, 158, W, 4);
  // subtle ground texture
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = -((scrollX * 0.9) % 16); x < W; x += 16) {
    ctx.fillRect(x, 168, 8, 1);
    ctx.fillRect(x + 4, 184, 6, 1);
  }
}

function sil(ctx, color, alpha = 1) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
}

function drawRiverBoatBg(ctx, W, H, far, mid, near, t, p) {
  // distant hills
  sil(ctx, '#2a5068', 0.9);
  for (let i = -1; i < 6; i++) {
    const x = i * 90 - (far % 90);
    ctx.beginPath();
    ctx.moveTo(x, 130);
    ctx.lineTo(x + 45, 95);
    ctx.lineTo(x + 90, 130);
    ctx.fill();
  }
  // water bands
  sil(ctx, '#2a6088', 0.55);
  ctx.fillRect(0, 120, W, 40);
  sil(ctx, '#3a7898', 0.35);
  for (let y = 124; y < 156; y += 6) {
    const ox = Math.sin(t * 1.2 + y * 0.2) * 4 - (mid % 24);
    for (let x = ox; x < W + 24; x += 24) {
      ctx.fillRect(x, y, 14, 2);
    }
  }
  // boat silhouettes
  sil(ctx, '#1a2830', 0.85);
  for (let i = -1; i < 4; i++) {
    const bx = i * 140 - (near % 140) + 40;
    ctx.fillRect(bx, 132, 70, 10);
    ctx.beginPath();
    ctx.moveTo(bx + 8, 132);
    ctx.lineTo(bx + 20, 118);
    ctx.lineTo(bx + 28, 132);
    ctx.fill();
    ctx.fillRect(bx + 40, 122, 3, 10);
  }
  // reeds near shore
  sil(ctx, '#3a5840', 0.7);
  for (let x = -(near % 18); x < W; x += 18) {
    ctx.fillRect(x + 2, 148, 2, 12);
    ctx.fillRect(x + 6, 150, 2, 10);
  }
  ctx.globalAlpha = 1;
}

function drawMountainBg(ctx, W, H, far, mid, near, t, p) {
  sil(ctx, '#3a4058', 0.95);
  for (let i = -1; i < 5; i++) {
    const x = i * 110 - (far % 110);
    ctx.beginPath();
    ctx.moveTo(x, 150);
    ctx.lineTo(x + 55, 60);
    ctx.lineTo(x + 110, 150);
    ctx.fill();
  }
  sil(ctx, '#4a5068', 0.8);
  for (let i = -1; i < 6; i++) {
    const x = i * 80 - (mid % 80);
    ctx.beginPath();
    ctx.moveTo(x, 155);
    ctx.lineTo(x + 40, 90);
    ctx.lineTo(x + 80, 155);
    ctx.fill();
  }
  // cave / cliff face
  sil(ctx, '#2a2838', 0.7);
  ctx.fillRect(W * 0.55 - (near % 40) * 0.2, 100, 90, 58);
  sil(ctx, '#1a1828', 0.5);
  ctx.beginPath();
  ctx.ellipse(W * 0.62, 140, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // torch flickers
  const flick = 0.5 + 0.5 * Math.sin(t * 8);
  sil(ctx, `rgba(240,160,60,${0.35 + flick * 0.25})`);
  ctx.beginPath();
  ctx.arc(W * 0.58, 118, 4 + flick, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawForestBg(ctx, W, H, far, mid, near, t, p) {
  sil(ctx, '#1a3828', 0.9);
  for (let i = -1; i < 8; i++) {
    const x = i * 60 - (far % 60);
    ctx.fillRect(x + 22, 80, 8, 80);
    ctx.beginPath();
    ctx.ellipse(x + 26, 78, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  sil(ctx, '#2a4830', 0.85);
  for (let i = -1; i < 10; i++) {
    const x = i * 48 - (mid % 48);
    ctx.fillRect(x + 16, 100, 6, 60);
    ctx.beginPath();
    ctx.ellipse(x + 19, 96, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // canopy dapples
  sil(ctx, '#406848', 0.25);
  for (let i = 0; i < 12; i++) {
    const x = ((i * 73 - mid * 0.5) % (W + 40)) - 20;
    ctx.beginPath();
    ctx.ellipse(x, 40 + (i % 3) * 18, 30, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // underbrush
  sil(ctx, '#284030', 0.8);
  for (let x = -(near % 14); x < W; x += 14) {
    ctx.fillRect(x, 148, 3, 12);
    ctx.fillRect(x + 5, 150, 2, 10);
  }
  ctx.globalAlpha = 1;
}

function drawRainNightBg(ctx, W, H, far, mid, near, t, p) {
  // city silhouette
  sil(ctx, '#121828', 0.95);
  for (let i = -1; i < 8; i++) {
    const x = i * 70 - (far % 70);
    const h = 40 + ((i * 17) % 50);
    ctx.fillRect(x, 160 - h, 50, h);
    ctx.fillRect(x + 8, 160 - h - 12, 8, 12);
  }
  // lanterns
  const pulse = 0.4 + 0.3 * Math.sin(t * 3);
  for (let i = 0; i < 5; i++) {
    const x = ((i * 90 + 30 - mid) % (W + 60)) - 20;
    sil(ctx, `rgba(240,180,60,${pulse})`);
    ctx.beginPath();
    ctx.arc(x, 100 + (i % 2) * 20, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // rain streaks
  sil(ctx, 'rgba(160,190,220,0.35)');
  const rainOff = (t * 180) % 20;
  for (let x = 0; x < W; x += 7) {
    for (let y = -20; y < 160; y += 18) {
      const yy = y + rainOff + ((x * 3) % 11);
      ctx.fillRect(x + ((y / 18) % 3), yy, 1, 8);
    }
  }
  // wet ground sheen
  sil(ctx, 'rgba(80,100,140,0.2)');
  ctx.fillRect(0, 150, W, 10);
  ctx.globalAlpha = 1;
}

function drawFormationMistBg(ctx, W, H, far, mid, near, t, p) {
  // stone pillars / bagua hints
  sil(ctx, '#383048', 0.9);
  for (let i = -1; i < 6; i++) {
    const x = i * 90 - (far % 90);
    ctx.fillRect(x + 30, 70, 14, 90);
    ctx.fillRect(x + 26, 66, 22, 8);
  }
  // mist layers
  for (let layer = 0; layer < 3; layer++) {
    const a = 0.12 + layer * 0.08;
    sil(ctx, `rgba(180,160,200,${a})`);
    const oy = 90 + layer * 22 + Math.sin(t * 0.6 + layer) * 4;
    for (let i = -1; i < 5; i++) {
      const x = i * 120 - ((mid * (0.5 + layer * 0.2)) % 120);
      ctx.beginPath();
      ctx.ellipse(x + 60, oy, 70, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // formation eye glow
  const glow = 0.3 + 0.3 * Math.sin(t * 2.5);
  sil(ctx, `rgba(240,200,80,${glow})`);
  ctx.beginPath();
  ctx.arc(W / 2 - (near % 30) * 0.1, 110, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSnowCityBg(ctx, W, H, far, mid, near, t, p) {
  // walls
  sil(ctx, '#708090', 0.9);
  ctx.fillRect(0, 100, W, 60);
  sil(ctx, '#607080', 0.95);
  for (let i = -1; i < 10; i++) {
    const x = i * 48 - (far % 48);
    ctx.fillRect(x, 88, 28, 14);
  }
  // gate
  sil(ctx, '#405060', 0.95);
  const gx = W / 2 - 36 - (mid % 20) * 0.15;
  ctx.fillRect(gx, 70, 72, 90);
  sil(ctx, '#283848', 0.9);
  ctx.fillRect(gx + 22, 100, 28, 60);
  // snow flakes
  sil(ctx, 'rgba(255,255,255,0.7)');
  for (let i = 0; i < 40; i++) {
    const x = ((i * 97 + t * (20 + (i % 5) * 8) - near * 0.2) % (W + 10));
    const y = ((i * 53 + t * 40) % 160);
    ctx.fillRect(x, y, 2, 2);
  }
  // snowbanks
  sil(ctx, '#e8f0f8', 0.85);
  for (let x = -(near % 40); x < W; x += 40) {
    ctx.beginPath();
    ctx.ellipse(x + 20, 156, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRiverFinaleBg(ctx, W, H, far, mid, near, t, p) {
  // sunset/war glow sky already from gradient; add sun disc
  sil(ctx, 'rgba(240,160,60,0.45)');
  ctx.beginPath();
  ctx.arc(W * 0.75, 50, 22, 0, Math.PI * 2);
  ctx.fill();
  // distant cliffs
  sil(ctx, '#203040', 0.9);
  for (let i = -1; i < 5; i++) {
    const x = i * 100 - (far % 100);
    ctx.fillRect(x, 90, 70, 70);
  }
  // wide river
  sil(ctx, '#204060', 0.6);
  ctx.fillRect(0, 115, W, 45);
  sil(ctx, '#306080', 0.35);
  for (let y = 120; y < 155; y += 5) {
    const ox = Math.sin(t + y) * 6 - (mid % 30);
    for (let x = ox; x < W + 30; x += 30) ctx.fillRect(x, y, 18, 2);
  }
  // war banners
  sil(ctx, '#802028', 0.85);
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 90 - (near % 45) * 0.3;
    ctx.fillRect(x, 70, 3, 50);
    ctx.fillRect(x + 3, 72, 16, 12);
  }
  // thunder flash occasional
  if (Math.sin(t * 7) > 0.92) {
    sil(ctx, 'rgba(200,220,255,0.15)');
    ctx.fillRect(0, 0, W, 160);
  }
  ctx.globalAlpha = 1;
}

/**
 * Draw a playable hero silhouette.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ charId: string, x: number, y: number, facing?: number, atkT?: number, airborne?: boolean, squatting?: boolean, guarding?: boolean, burstT?: number, invulnT?: number, t?: number }} o
 */
function drawHeroPng(ctx, o, img) {
  const facing = o.facing == null ? 1 : o.facing;
  const t = o.t || 0;
  const bob = o.airborne ? -2 : Math.sin(t * 8) * (o.atkT > 0 ? 0 : 0.8);
  let feetY = o.y + FEET;
  let targetH = HERO_PNG_H;
  if (o.squatting) {
    targetH = HERO_PNG_H * 0.78;
    feetY = o.y + FEET;
  } else if (o.airborne) {
    feetY = o.y + 20;
  }
  const scale = targetH / img.naturalHeight;
  const dw = img.naturalWidth * scale;
  const dh = targetH;
  const cx = o.x;
  const top = feetY - dh + bob;

  ctx.save();
  if (o.invulnT > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
  if (o.burstT > 0) {
    ctx.strokeStyle = 'rgba(240,200,60,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, top + dh / 2, Math.max(14, dw * 0.28), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.translate(cx, feetY + bob);
  ctx.scale(facing, 1);
  ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  ctx.restore();
  ctx.globalAlpha = 1;

  if (o.atkT > 0) {
    const reach = 30;
    ctx.strokeStyle = 'rgba(255,220,120,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const ay = top + dh * 0.4;
    if (facing > 0) ctx.arc(cx + 4, ay, reach * 0.55, -0.9, 0.6);
    else ctx.arc(cx - 4, ay, reach * 0.55, Math.PI - 0.6, Math.PI + 0.9);
    ctx.stroke();
  }
  if (o.guarding) {
    ctx.strokeStyle = '#80c0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 10, top - 2, 20, dh + 4);
  }
}

export function drawHero(ctx, o) {
  const png = tryLoadHero(o.charId);
  if (readyImg(png)) {
    drawHeroPng(ctx, o, png);
    return;
  }

  const look = HERO_LOOK[o.charId] || HERO_LOOK.guanyu;
  const facing = o.facing == null ? 1 : o.facing;
  const t = o.t || 0;
  const bob = o.airborne ? 0 : Math.sin(t * 8) * (o.atkT > 0 ? 0 : 1.2);
  let feetY = o.y + FEET;
  let bodyH = o.squatting ? 18 : 26;
  if (o.airborne) {
    feetY = o.y + 20;
    bodyH = 24;
  }
  const cx = o.x;
  const top = feetY - bodyH + bob;

  ctx.save();
  if (o.invulnT > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
  if (o.burstT > 0) {
    ctx.strokeStyle = 'rgba(240,200,60,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, top + bodyH / 2, 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.translate(cx, 0);
  ctx.scale(facing, 1);

  // legs
  ctx.fillStyle = look.robe;
  if (o.squatting) {
    ctx.fillRect(-5, feetY - 8, 4, 8);
    ctx.fillRect(1, feetY - 8, 4, 8);
  } else if (o.airborne) {
    ctx.fillRect(-6, feetY - 10, 4, 8);
    ctx.fillRect(2, feetY - 6, 4, 6);
  } else {
    const step = Math.sin(t * 10) * 2;
    ctx.fillRect(-5, feetY - 10, 4, 10);
    ctx.fillRect(1, feetY - 10 + step, 4, 10 - Math.max(0, step));
  }

  // torso
  ctx.fillStyle = look.robe;
  ctx.fillRect(-6, top + 8, 12, bodyH - 14);
  ctx.fillStyle = look.trim;
  ctx.fillRect(-6, top + 8, 12, 2);

  // head
  ctx.fillStyle = look.skin;
  ctx.fillRect(-4, top + 1, 8, 8);
  ctx.fillStyle = look.hair;
  ctx.fillRect(-4, top, 8, 3);
  drawHat(ctx, look, top, facing);

  if (look.beard) {
    ctx.fillStyle = look.accent;
    ctx.fillRect(-3, top + 7, 6, 4);
  }

  // eye
  ctx.fillStyle = '#201810';
  ctx.fillRect(1, top + 4, 2, 2);

  // arms + weapon
  drawWeapon(ctx, look, top, bodyH, o.atkT || 0, feetY);

  ctx.restore();
  ctx.globalAlpha = 1;

  // attack slash arc (screen/world, not flipped)
  if (o.atkT > 0) {
    const reach = 30;
    ctx.strokeStyle = 'rgba(255,220,120,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const ay = top + 12;
    if (facing > 0) ctx.arc(cx + 4, ay, reach * 0.55, -0.9, 0.6);
    else ctx.arc(cx - 4, ay, reach * 0.55, Math.PI - 0.6, Math.PI + 0.9);
    ctx.stroke();
  }

  if (o.guarding) {
    ctx.strokeStyle = '#80c0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 10, top - 2, 20, bodyH + 4);
  }
}

function drawHat(ctx, look, top, facing) {
  ctx.fillStyle = look.trim;
  switch (look.hat) {
    case 'helm':
      ctx.fillRect(-5, top - 2, 10, 4);
      ctx.fillStyle = look.accent;
      ctx.fillRect(3, top - 6, 2, 6);
      break;
    case 'band':
      ctx.fillStyle = look.accent;
      ctx.fillRect(-4, top + 1, 8, 2);
      break;
    case 'plume':
      ctx.fillRect(-5, top - 2, 10, 4);
      ctx.fillStyle = '#f0e0c0';
      ctx.fillRect(2, top - 10, 3, 10);
      break;
    case 'cap':
      ctx.fillStyle = look.accent;
      ctx.fillRect(-5, top - 1, 10, 3);
      ctx.fillRect(-3, top - 4, 6, 3);
      break;
    case 'hair':
      ctx.fillStyle = look.hair;
      ctx.fillRect(-5, top - 2, 10, 4);
      ctx.fillRect(3, top + 2, 3, 8);
      break;
    case 'horns':
      ctx.fillStyle = look.accent;
      ctx.fillRect(-6, top - 4, 3, 5);
      ctx.fillRect(3, top - 4, 3, 5);
      break;
    default:
      break;
  }
}

function drawWeapon(ctx, look, top, bodyH, atkT, feetY) {
  const swing = atkT > 0 ? 1 : 0;
  ctx.fillStyle = look.trim;
  switch (look.weapon) {
    case 'blade': {
      // guan dao / long blade held forward
      const ang = swing ? -0.6 : 0.15;
      ctx.save();
      ctx.translate(5, top + 12);
      ctx.rotate(ang);
      ctx.fillStyle = '#a0a8b0';
      ctx.fillRect(0, -2, 22, 3);
      ctx.fillStyle = look.accent;
      ctx.fillRect(16, -4, 8, 7);
      ctx.restore();
      ctx.fillStyle = look.skin;
      ctx.fillRect(3, top + 10, 4, 4);
      break;
    }
    case 'spear': {
      ctx.fillStyle = '#8a7060';
      ctx.fillRect(4, top - 4 - swing * 6, 2, bodyH + 6);
      ctx.fillStyle = look.trim;
      ctx.fillRect(2, top - 8 - swing * 6, 6, 5);
      ctx.fillStyle = look.skin;
      ctx.fillRect(2, top + 10, 4, 4);
      break;
    }
    case 'bow': {
      ctx.strokeStyle = look.trim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, top + 12, 8, -1.1, 1.1);
      ctx.stroke();
      ctx.fillStyle = '#c0a080';
      ctx.fillRect(6, top + 10, 10, 1);
      break;
    }
    case 'fan': {
      ctx.fillStyle = look.accent;
      const fy = top + 8 - swing * 4;
      ctx.beginPath();
      ctx.moveTo(4, fy + 6);
      ctx.lineTo(14, fy);
      ctx.lineTo(14, fy + 12);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'dual': {
      ctx.fillStyle = '#d0d8e0';
      ctx.fillRect(5, top + 8 - swing * 5, 10, 2);
      ctx.fillRect(-8, top + 14, 8, 2);
      break;
    }
    default:
      break;
  }
}

/**
 * Mini hero for CharSelect cards / HUD chip.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} charId
 * @param {number} x center
 * @param {number} y feet-ish
 * @param {number} [scale]
 */
export function drawHeroMini(ctx, charId, x, y, scale = 0.7) {
  const png = tryLoadHero(charId);
  if (readyImg(png)) {
    // CharSelect / HUD: prefer PNG art (~28px at scale 0.7)
    const targetH = 28 * (scale / 0.7);
    const s = targetH / png.naturalHeight;
    const dw = png.naturalWidth * s;
    const dh = targetH;
    ctx.save();
    ctx.drawImage(png, x - dw / 2, y - dh, dw, dh);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawHero(ctx, {
    charId,
    x: 0,
    y: -FEET,
    facing: 1,
    atkT: 0,
    airborne: false,
    squatting: false,
    guarding: false,
    burstT: 0,
    invulnT: 0,
    t: 0,
  });
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, type?: string, color?: string, label?: string, isEye?: boolean, alive?: boolean }} grunt
 */
export function drawGrunt(ctx, grunt) {
  if (grunt.alive === false) return;
  const type = grunt.type || 'sword';
  const col = grunt.color || '#606878';
  const cx = grunt.x;
  const feetY = grunt.y + FEET;
  const top = feetY - 22;

  ctx.save();
  // body
  ctx.fillStyle = col;
  ctx.fillRect(cx - 6, top + 6, 12, 14);
  // head
  ctx.fillStyle = '#c09070';
  ctx.fillRect(cx - 4, top, 8, 7);
  ctx.fillStyle = '#201810';
  ctx.fillRect(cx - 4, top, 8, 2);

  // type-specific gear
  ctx.fillStyle = col;
  switch (type) {
    case 'spear':
      ctx.fillStyle = '#8a7060';
      ctx.fillRect(cx + 5, top - 2, 2, 24);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(cx + 3, top - 4, 6, 4);
      break;
    case 'shield':
      ctx.fillStyle = '#708090';
      ctx.fillRect(cx - 10, top + 6, 5, 12);
      ctx.fillStyle = '#a0b0c0';
      ctx.fillRect(cx - 9, top + 9, 3, 4);
      break;
    case 'archer':
      ctx.strokeStyle = '#80a070';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + 7, top + 10, 6, -1, 1);
      ctx.stroke();
      break;
    case 'throw':
      ctx.fillStyle = '#a08060';
      ctx.beginPath();
      ctx.arc(cx + 7, top + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ninja':
      ctx.fillStyle = '#303050';
      ctx.fillRect(cx - 6, top + 6, 12, 14);
      ctx.fillRect(cx - 4, top, 8, 7);
      ctx.fillStyle = '#e06060';
      ctx.fillRect(cx - 2, top + 3, 4, 1);
      break;
    case 'rider':
    case 'leopard':
      ctx.fillStyle = col;
      ctx.fillRect(cx - 8, feetY - 10, 16, 8);
      ctx.fillRect(cx - 6, top + 4, 12, 12);
      break;
    case 'armor':
    case 'elite':
      ctx.fillStyle = '#90a0b0';
      ctx.fillRect(cx - 7, top + 5, 14, 16);
      ctx.fillStyle = '#d0d8e0';
      ctx.fillRect(cx - 5, top - 1, 10, 5);
      break;
    default: // sword
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(cx + 5, top + 8, 10, 2);
      break;
  }

  if (grunt.isEye) {
    ctx.strokeStyle = '#ffe080';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 9, top - 2, 18, 26);
    ctx.fillStyle = 'rgba(240,200,60,0.35)';
    ctx.beginPath();
    ctx.arc(cx, top + 10, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Larger boss silhouette + name plate; telegraph flash.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, name?: string, hp?: number, hpMax?: number, hitFlash?: number, airborne?: boolean, alive?: boolean }} enemy
 * @param {number} t
 * @param {{ telegraph?: boolean, attacking?: boolean, facing?: number, reach?: number, moveKind?: string }} [ai]
 */
export function drawBoss(ctx, enemy, t, ai = {}) {
  if (!enemy) return;
  const cx = enemy.x;
  const feetY = (enemy.airborne ? enemy.y + 20 : enemy.y + FEET);
  const bodyH = enemy.airborne ? 30 : 34;
  const top = feetY - bodyH;
  const tele = !!ai.telegraph;
  const flash = enemy.hitFlash > 0;

  if (!enemy.alive) {
    ctx.fillStyle = '#405060';
    ctx.fillRect(cx - 12, enemy.y + 18, 24, 10);
    return;
  }

  ctx.save();
  // telegraph flash ring
  if (tele) {
    const pulse = 0.4 + 0.4 * Math.sin(t * 12);
    ctx.strokeStyle = `rgba(255,220,100,${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 16, top - 4, 32, bodyH + 8);
  }

  const bodyCol = flash ? '#ffffff' : tele ? '#c08040' : '#704050';
  ctx.fillStyle = bodyCol;
  // legs
  ctx.fillRect(cx - 8, feetY - 12, 6, 12);
  ctx.fillRect(cx + 2, feetY - 12, 6, 12);
  // torso (wider)
  ctx.fillRect(cx - 10, top + 10, 20, bodyH - 18);
  // pauldron
  ctx.fillStyle = flash ? '#fff' : '#907060';
  ctx.fillRect(cx - 12, top + 10, 8, 6);
  ctx.fillRect(cx + 4, top + 10, 8, 6);
  // head
  ctx.fillStyle = flash ? '#fff' : '#c09070';
  ctx.fillRect(cx - 5, top + 2, 10, 9);
  ctx.fillStyle = '#201810';
  ctx.fillRect(cx - 5, top, 10, 3);
  // crest
  ctx.fillStyle = tele ? '#ffe080' : '#c04040';
  ctx.fillRect(cx - 2, top - 6, 4, 8);

  // cape
  ctx.fillStyle = flash ? '#ddd' : '#502838';
  ctx.beginPath();
  ctx.moveTo(cx - 10, top + 12);
  ctx.lineTo(cx - 16, feetY - 4);
  ctx.lineTo(cx - 6, top + 18);
  ctx.fill();

  // attack telegraph swing
  if (ai.attacking) {
    ctx.fillStyle = 'rgba(255,120,80,0.35)';
    const reach = ai.reach || 36;
    const fac = ai.facing || 1;
    if (ai.moveKind === 'slash' || ai.moveKind === 'dash') {
      ctx.fillRect(fac > 0 ? cx : cx - reach, top + 12, reach, 14);
    } else if (ai.moveKind === 'aoe' || ai.moveKind === 'slam') {
      ctx.beginPath();
      ctx.arc(cx, top + 18, reach * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // name plate
  const label = enemy.name || 'Boss';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  const tw = Math.min(72, label.length * 7 + 8);
  ctx.fillRect(cx - tw / 2, top - 14, tw, 10);
  ctx.font = '7px "PingFang SC","Microsoft YaHei",monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  ctx.fillText(label, cx + 1, top - 13);
  ctx.fillStyle = tele ? '#ffe080' : '#e0b0b0';
  ctx.fillText(label, cx, top - 14);

  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, lamp?: boolean, brick?: boolean, lion?: string, label?: string }} pr
 */
export function drawProp(ctx, pr) {
  const cx = pr.x;
  const y = pr.y;
  if (pr.lamp) {
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(cx - 2, y - 4, 4, 18);
    ctx.fillStyle = '#c0a040';
    ctx.beginPath();
    ctx.arc(cx, y - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(240,200,80,0.25)';
    ctx.beginPath();
    ctx.arc(cx, y - 6, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.brick) {
    ctx.fillStyle = '#a08060';
    ctx.fillRect(cx - 10, y, 20, 14);
    ctx.fillStyle = '#806040';
    ctx.fillRect(cx - 10, y + 6, 20, 2);
    ctx.fillRect(cx - 2, y, 2, 14);
  } else if (pr.lion) {
    const correct = pr.lion === 'correct';
    ctx.fillStyle = correct ? '#6080a0' : '#406080';
    // stone lion silhouette
    ctx.fillRect(cx - 10, y + 2, 20, 12);
    ctx.fillRect(cx - 6, y - 6, 12, 10);
    ctx.fillRect(cx + 4, y - 10, 4, 6);
    ctx.fillStyle = correct ? '#a0c0e0' : '#507090';
    ctx.fillRect(cx - 4, y - 2, 3, 2);
  } else {
    ctx.fillStyle = '#406080';
    ctx.fillRect(cx - 10, y, 20, 14);
    ctx.fillStyle = '#6080a0';
    ctx.fillRect(cx - 8, y + 2, 16, 3);
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, open?: boolean }} c
 */
export function drawChest(ctx, c) {
  const cx = c.x;
  const y = c.y;
  if (c.open) {
    ctx.fillStyle = '#403020';
    ctx.fillRect(cx - 11, y + 4, 22, 10);
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(cx - 11, y - 2, 22, 6);
  } else {
    ctx.fillStyle = '#8a5a20';
    ctx.fillRect(cx - 11, y, 22, 14);
    ctx.fillStyle = '#c0a040';
    ctx.fillRect(cx - 11, y + 5, 22, 2);
    ctx.fillStyle = '#e0c060';
    ctx.fillRect(cx - 2, y + 4, 4, 4);
    ctx.strokeStyle = '#5a3810';
    ctx.strokeRect(cx - 10.5, y + 0.5, 21, 13);
  }
}

/**
 * Thumbnail of stage BG for StageIntro / Attract cards (screen-space clip).
 */
export function drawStageThumb(ctx, stageId, x, y, w, h, t = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);
  ctx.scale(w / 384, h / 160);
  drawStageBackground(ctx, stageId, 0, 384, 224, 960, t);
  // hide ground strip overflow in thumb
  ctx.restore();
  ctx.strokeStyle = '#6080a0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/**
 * Richer title logo panel.
 */
export function drawLogoPanel(ctx, W, H, blinkT) {
  const pw = 220;
  const ph = 56;
  const px = (W - pw) / 2;
  const py = 36;
  // outer glow
  ctx.fillStyle = 'rgba(180,120,40,0.12)';
  roundRect(ctx, px - 6, py - 6, pw + 12, ph + 12, 6);
  ctx.fill();
  // panel
  const g = ctx.createLinearGradient(px, py, px, py + ph);
  g.addColorStop(0, '#2a2018');
  g.addColorStop(1, '#141018');
  ctx.fillStyle = g;
  roundRect(ctx, px, py, pw, ph, 4);
  ctx.fill();
  ctx.strokeStyle = '#c0a060';
  ctx.lineWidth = 1;
  roundRect(ctx, px + 0.5, py + 0.5, pw - 1, ph - 1, 4);
  ctx.stroke();
  // corner ornaments
  ctx.fillStyle = '#f0c060';
  const orn = (ox, oy) => {
    ctx.fillRect(ox, oy, 8, 1);
    ctx.fillRect(ox, oy, 1, 8);
  };
  orn(px + 4, py + 4);
  orn(px + pw - 12, py + 4);
  ctx.fillRect(px + 4, py + ph - 5, 8, 1);
  ctx.fillRect(px + 4, py + ph - 12, 1, 8);
  ctx.fillRect(px + pw - 12, py + ph - 5, 8, 1);
  ctx.fillRect(px + pw - 5, py + ph - 12, 1, 8);

  // flame accents
  const flick = 0.5 + 0.5 * Math.sin((blinkT || 0) * 6);
  ctx.fillStyle = `rgba(240,120,40,${0.35 + flick * 0.25})`;
  ctx.beginPath();
  ctx.moveTo(px + 18, py + ph - 8);
  ctx.lineTo(px + 24, py + 14);
  ctx.lineTo(px + 30, py + ph - 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + pw - 30, py + ph - 8);
  ctx.lineTo(px + pw - 24, py + 14);
  ctx.lineTo(px + pw - 18, py + ph - 8);
  ctx.fill();
}
