/** SAN-19 · 关7 三国归一统 — 主路越吉→魏延→司马懿→曹操；电道（雷神锤）跳过前两 Boss */

export const STAGE7 = {
  id: 7,
  worldW: 1600,
  name: '三国归一统',
  blurb: '越吉/电道 · 司马懿 · 曹操',
  waves: [
    {
      id: 'ferry',
      teach: '逍遥津 · 有雷神锤可进电道跳过越吉/魏延',
      grunts: [
        { x: 240, hp: 24 },
        { x: 280, hp: 24 },
        { x: 320, hp: 24 },
      ],
      chest: { x: 220 },
    },
    {
      id: 'deck',
      teach: '船舱清兵 · 终战将至',
      grunts: [
        { x: 420, hp: 26 },
        { x: 460, hp: 26 },
        { x: 500, hp: 26 },
      ],
    },
  ],
  vaults: [
    {
      id: 'thunder_gate',
      type: 'door',
      x: 360,
      y: 156,
      r: 28,
      label: '电道入口',
      requireFlag: 'has_leishenchui',
      setInside: 'thunder',
      note: '持锤进电道 · 将跳过越吉/魏延',
      // marks route when entered
      setRoute: 'thunder',
    },
    {
      id: 'ship_cabin',
      type: 'door',
      x: 520,
      y: 156,
      r: 24,
      label: '船舱密',
      setInside: 'cabin',
      grantBag: 'huangshi',
      note: '船舱补给',
    },
  ],
  /** bossesMain used when route_s7 !== thunder */
  bossesMain: [
    {
      id: 'yueji',
      name: '越吉',
      hp: 160,
      x: 900,
      y: 148,
      weak: ['电'],
      packScore: 28000,
    },
    {
      id: 'weiyan',
      name: '魏延',
      hp: 170,
      x: 1040,
      y: 148,
      weak: ['电'],
      packScore: 30000,
    },
    {
      id: 'simayi',
      name: '司马懿',
      hp: 200,
      x: 1180,
      y: 148,
      weak: ['冰', '爆'],
      packScore: 40000,
      note: '法宝多无效 · 不怕毒',
    },
    {
      id: 'caocao',
      name: '曹操',
      hp: 260,
      x: 1360,
      y: 148,
      weak: ['电'],
      packScore: 80000,
      note: '终战',
    },
  ],
  /** thunder route skips first two */
  bossesThunder: [
    {
      id: 'simayi',
      name: '司马懿',
      hp: 200,
      x: 1000,
      y: 148,
      weak: ['冰', '爆'],
      packScore: 40000,
      note: '电道接入 · 司马懿',
    },
    {
      id: 'caocao',
      name: '曹操',
      hp: 260,
      x: 1200,
      y: 148,
      weak: ['电'],
      packScore: 80000,
      note: '终战',
    },
  ],
};

// default list for tools that read .bosses
STAGE7.bosses = STAGE7.bossesMain;

