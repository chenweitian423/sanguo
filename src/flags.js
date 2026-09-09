/**
 * RunFlags + relaxed gate rules (SAN-9).
 * No ice|boom mutex; vaults need no character/party locks; boom vault no heshi hard gate.
 */

export const FLAG_KEYS = [
  'has_fire_book',
  'has_puppet',
  'has_nameless_fire',
  'has_fire', // 倚天
  'has_general_seal',
  'has_ice', // 青缸
  'has_thunder', // 干将
  'has_heshi',
  'has_boom', // 太阿
  'has_leishenchui',
  'has_jiujiezhang',
  'has_stealth_robe',
];

export const FLAG_LABEL = {
  has_fire_book: '火书',
  has_puppet: '傀儡',
  has_nameless_fire: '无名火',
  has_fire: '倚天',
  has_general_seal: '将军印',
  has_ice: '青缸',
  has_thunder: '干将',
  has_heshi: '和氏璧',
  has_boom: '太阿',
  has_leishenchui: '雷神锤',
  has_jiujiezhang: '九节杖',
  has_stealth_robe: '鱼鬣衣',
};

export function emptyFlags() {
  /** @type {Record<string, boolean|string>} */
  const f = {};
  for (const k of FLAG_KEYS) f[k] = false;
  f.route_s7 = 'main'; // main | thunder
  return f;
}

export function swordCount(flags) {
  return [flags.has_fire, flags.has_ice, flags.has_thunder, flags.has_boom].filter(Boolean).length;
}

export function fourSwords(flags) {
  return swordCount(flags) === 4;
}

/** Relaxed gate checks — always allow in 烽火; document 119 contrast in comments. */
export const Gates = {
  /** 119: often 2P stand; 烽火: solo OK */
  enterFireBookVault() {
    return { ok: true, reason: '单人站位即可（宽松）' };
  },
  /** 119: 诸葛/黄忠条件; 烽火: arrive OK */
  enterFireSwordVault() {
    return { ok: true, reason: '到达即进，无人物要求（宽松）' };
  },
  /** 119: ice locks boom; 烽火: never */
  canHoldIceAndBoom() {
    return { ok: true, reason: '冰爆同局可持（宽松）' };
  },
  /** 119: needs 和氏璧; 烽火: brick only */
  enterBoomVault(flags) {
    return {
      ok: true,
      reason: flags.has_heshi ? '凸砖+和氏璧演出加成' : '凸砖即可，不强制和氏璧（宽松）',
      bonus: !!flags.has_heshi,
    };
  },
  /** Thunder path needs hammer — keep 119 item key */
  enterThunderRoute(flags) {
    if (flags.has_leishenchui) {
      return { ok: true, reason: '持雷神锤进电道，跳过越吉/魏延' };
    }
    return { ok: false, reason: '需雷神锤' };
  },
};

export function applySwordFlag(flags, swordId) {
  if (swordId === 'sword_fire') flags.has_fire = true;
  if (swordId === 'sword_ice') flags.has_ice = true;
  if (swordId === 'sword_thunder') flags.has_thunder = true;
  if (swordId === 'sword_boom') flags.has_boom = true;
}

export function flagStrip(flags) {
  const parts = [];
  for (const k of FLAG_KEYS) {
    if (flags[k]) parts.push(FLAG_LABEL[k]);
  }
  if (flags.route_s7 === 'thunder') parts.push('电道');
  const n = swordCount(flags);
  if (n) parts.unshift(`剑${n}/4`);
  if (fourSwords(flags)) parts.unshift('神兵四绝');
  return parts.length ? parts.join(' · ') : '（尚无收集）';
}
