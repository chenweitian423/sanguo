/** SAN-17 · 关5 智破八阵 — 已取消破阵门槛；清兵后直接 Boss 线到吕布 */

export const STAGE5 = {
  id: 5,
  worldW: 1400,
  name: '智破八阵图',
  blurb: '沙摩柯→吕布→陆逊→左慈',
  waves: [
    {
      id: 'burn',
      teach: '燃烧林 · 无破阵门槛，清完直接 Boss',
      grunts: [
        { x: 240, hp: 20 },
        { x: 280, hp: 20 },
        { x: 320, hp: 20 },
        { x: 360, hp: 20 },
      ],
      chest: { x: 220 },
    },
  ],
  vaults: [
    {
      id: 'grove',
      type: 'door',
      x: 300,
      y: 156,
      r: 24,
      label: '竹林密',
      setInside: 'grove',
      grantBag: 'tianshi',
      note: '竹林密室',
    },
  ],
  bosses: [
    {
      id: 'shamoke',
      name: '沙摩柯',
      hp: 160,
      x: 820,
      y: 148,
      weak: ['冰'],
      packScore: 28000,
    },
    {
      id: 'lubu',
      name: '吕布',
      hp: 220,
      x: 980,
      y: 148,
      weak: ['火'],
      packScore: 45000,
      onClear: {
        flags: ['has_thunder', 'has_heshi'],
        swordId: 'sword_thunder',
        msg: '吕布败 · 干将+和氏璧',
      },
    },
    {
      id: 'luxun',
      name: '陆逊',
      hp: 150,
      x: 1120,
      y: 148,
      weak: [],
      packScore: 24000,
    },
    {
      id: 'zuoci',
      name: '左慈',
      hp: 180,
      x: 1260,
      y: 148,
      weak: ['火'],
      packScore: 30000,
      airborne: true,
      note: '飞行难普连 · 火剑/人遁克',
    },
  ],
};
