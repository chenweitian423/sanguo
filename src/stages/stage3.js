/** SAN-15 · 关3 威震汉中 — 孟优→夏侯惇→张辽；石缝/石狮→青缸；拿冰不锁爆 */

export const STAGE3 = {
  id: 3,
  worldW: 1300,
  name: '威震汉中地',
  blurb: '孟优→夏侯惇→张辽 · 青缸',
  waves: [
    {
      id: 'woods',
      teach: '汉中林地 · 可打路牌进密',
      grunts: [
        { x: 220, hp: 18 },
        { x: 260, hp: 18 },
        { x: 300, hp: 18 },
      ],
      chest: { x: 200 },
    },
    {
      id: 'crack',
      teach: '石缝密室 · 前方冰门/石狮',
      grunts: [
        { x: 380, hp: 20 },
        { x: 420, hp: 20 },
      ],
    },
    {
      id: 'city',
      teach: '内城清兵 · 三连Boss将至',
      grunts: [
        { x: 560, hp: 22 },
        { x: 600, hp: 22 },
        { x: 640, hp: 22 },
      ],
    },
  ],
  vaults: [
    {
      id: 'ice_door',
      type: 'door',
      x: 340,
      y: 156,
      r: 26,
      label: '冰剑密/冰门',
      setInside: 'ice_vault',
      note: '无名火更稳；到达也可进（宽松）· 拿冰不锁爆',
    },
    {
      id: 'qinggang_chest',
      type: 'chest_flag',
      x: 280,
      y: 156,
      requireInside: 'ice_vault',
      requireFlag: 'ice_lion_ok',
      label: '青缸箱',
      flag: 'has_ice',
      swordId: 'sword_ice',
    },
  ],
  /** 石狮：只打对的第三尊（119）；打错仅耗血无解锁 */
  props: [
    { x: 300, y: 156, hp: 14, label: '石狮1', lion: 'wrong', requireInside: 'ice_vault' },
    { x: 340, y: 156, hp: 14, label: '石狮2', lion: 'wrong', requireInside: 'ice_vault' },
    { x: 380, y: 156, hp: 14, label: '石狮3', lion: 'correct', requireInside: 'ice_vault' },
  ],
  bosses: [
    {
      id: 'mengyou',
      name: '孟优',
      hp: 150,
      x: 880,
      y: 148,
      weak: ['爆'],
      packScore: 22000,
    },
    {
      id: 'xiaohoudun',
      name: '夏侯惇',
      hp: 170,
      x: 1000,
      y: 148,
      weak: ['电'],
      packScore: 28000,
      // 天师符 drop flavor via bump optional skip
    },
    {
      id: 'zhangliao',
      name: '张辽',
      hp: 160,
      x: 1120,
      y: 148,
      weak: [],
      packScore: 26000,
    },
  ],
};
