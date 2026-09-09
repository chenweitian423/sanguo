/** SAN-13 · 关1 截江救阿斗 — 教学波 + 火书密（单人站位）+ 孙姬（撞×2傀儡） */

export const STAGE1 = {
  id: 1,
  worldW: 960,
  name: '截江救阿斗',
  blurb: '江船教学 · 火书密 · 孙姬',
  /** Tutorial / clear waves before boss. */
  waves: [
    {
      id: 't0',
      teach: 'J=攻击 · WASD移动',
      grunts: [
        { x: 220, hp: 14 },
        { x: 260, hp: 14 },
      ],
    },
    {
      id: 't1',
      teach: '同向连按跑步',
      grunts: [
        { x: 300, hp: 16 },
        { x: 340, hp: 16 },
        { x: 380, hp: 16 },
      ],
    },
    {
      id: 't2',
      teach: '方向+J 大斩 · K跳跃',
      grunts: [
        { x: 420, hp: 18 },
        { x: 460, hp: 18 },
      ],
    },
    {
      id: 't3',
      teach: '方向+L 防御',
      grunts: [
        { x: 500, hp: 18 },
        { x: 540, hp: 18 },
        { x: 580, hp: 18 },
      ],
    },
    {
      id: 't4',
      teach: 'L开栏 · I用道具（可选）',
      grunts: [{ x: 620, hp: 20 }],
      chest: { x: 600 },
    },
    {
      id: 't5',
      teach: '清至船舱 · 可找火书站位',
      grunts: [
        { x: 680, hp: 20 },
        { x: 720, hp: 20 },
      ],
    },
  ],
  /** 119 often needs 2P stand; 烽火: solo stand OK */
  vault: {
    x: 400,
    y: 168,
    r: 22,
    holdSec: 0.85,
    flag: 'has_fire_book',
    bagItem: 'rendun', // 人遁书（火书向）
    label: '火书站位（单人即可）',
  },
  /** Breakable water-beast props at start */
  props: [
    { x: 160, y: 156, hp: 8, label: '水兽', drop: 'sleeve' },
    { x: 200, y: 156, hp: 8, label: '水兽', drop: 'sleeve' },
  ],
  boss: {
    id: 'sunji',
    name: '孙姬',
    hp: 120,
    x: 880,
    y: 148,
    weak: [],
    armorElem: null,
    bumpsForPuppet: 2,
    packScore: 20000,
  },
};
