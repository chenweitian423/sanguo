/** SAN-18 · 关6 雪战夺荆州 — 许褚→孟获/黄盖；凸砖开太阿；不强制和氏璧、不锁冰 */

export const STAGE6 = {
  id: 6,
  worldW: 1500,
  name: '雪战夺荆州',
  blurb: '许褚 · 凸砖太阿',
  waves: [
    {
      id: 'snow',
      teach: '雪道 · 无雨书灭火',
      grunts: [
        { x: 240, hp: 22 },
        { x: 280, hp: 22 },
        { x: 320, hp: 22 },
      ],
      chest: { x: 220 },
    },
    {
      id: 'city',
      teach: '荆州城 · 二层可打凸砖开爆剑密',
      grunts: [
        { x: 420, hp: 24 },
        { x: 460, hp: 24 },
        { x: 500, hp: 24 },
      ],
    },
    {
      id: 'wall',
      teach: '喷火墙旁 · 打凸砖（不强制和氏璧）',
      grunts: [
        { x: 600, hp: 24 },
        { x: 640, hp: 24 },
      ],
    },
  ],
  vaults: [
    {
      id: 'boom_door',
      type: 'door',
      x: 380,
      y: 156,
      r: 26,
      label: '太阿密',
      requireFlag: 'boom_brick_ok',
      setInside: 'boom_vault',
      note: '凸砖已开 · 不强制和氏璧（有璧仅演出）',
    },
    {
      id: 'taia_chest',
      type: 'chest_flag',
      x: 320,
      y: 156,
      requireInside: 'boom_vault',
      label: '太阿箱',
      flag: 'has_boom',
      swordId: 'sword_boom',
    },
  ],
  /** 凸砖机关：打掉即开爆密（119 需和氏璧；本作宽松） */
  props: [
    { x: 560, y: 156, hp: 16, label: '凸砖', brick: true },
    { x: 600, y: 140, hp: 20, label: '火柱', brick: false },
  ],
  bosses: [
    {
      id: 'xuchu',
      name: '许褚',
      hp: 200,
      x: 980,
      y: 148,
      weak: ['毒'],
      packScore: 45000,
    },
    {
      id: 'menghuo',
      name: '孟获',
      hp: 170,
      x: 1120,
      y: 148,
      weak: ['爆'],
      packScore: 30000,
      note: '可选线之一 · 原型两线都打',
    },
    {
      id: 'huanggai',
      name: '黄盖',
      hp: 180,
      x: 1260,
      y: 148,
      weak: ['冰'],
      packScore: 32000,
      note: '火属 · 弱冰',
    },
  ],
};
