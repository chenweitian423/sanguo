/** SAN-16 · 关4 大意失荆州 — 吕蒙（撞×3九节杖）；灯门→敌貂蝉→老鹰密雷神锤 */

export const STAGE4 = {
  id: 4,
  worldW: 1400,
  name: '大意失荆州',
  blurb: '吕蒙 · 灯门貂蝉 · 雷神锤',
  waves: [
    {
      id: 'outer',
      teach: '荆州外围 · 暗室在左侧',
      grunts: [
        { x: 220, hp: 20 },
        { x: 260, hp: 20 },
        { x: 300, hp: 20 },
      ],
    },
    {
      id: 'dark',
      teach: '暗室：先左灯再右灯开门',
      grunts: [
        { x: 400, hp: 22 },
        { x: 440, hp: 22 },
      ],
      chest: { x: 380 },
    },
    {
      id: 'before_meng',
      teach: '主路吕蒙 · 支线可打敌貂蝉拿锤',
      grunts: [
        { x: 700, hp: 24 },
        { x: 740, hp: 24 },
        { x: 780, hp: 24 },
      ],
    },
  ],
  vaults: [
    {
      id: 'dark_door',
      type: 'door',
      x: 360,
      y: 156,
      r: 26,
      label: '暗室门',
      requireFlag: 'lamp_ok',
      setInside: 'diao_room',
      note: '灯序正确 · 进打敌貂蝉',
    },
    {
      id: 'eagle_desk',
      type: 'door',
      x: 320,
      y: 156,
      r: 22,
      label: '老鹰几案',
      requireInside: 'diao_room',
      requireFlag: 'diao_cleared',
      setInside: 'eagle',
      note: '进老鹰密室',
    },
    {
      id: 'hammer_chest',
      type: 'chest_flag',
      x: 280,
      y: 156,
      requireInside: 'eagle',
      label: '雷神锤箱',
      flag: 'has_leishenchui',
      bagItem: null,
    },
  ],
  /** 灯：必须先左(1)后右(2) */
  props: [
    { x: 300, y: 140, hp: 10, label: '左灯', lamp: 1 },
    { x: 420, y: 140, hp: 10, label: '右灯', lamp: 2 },
  ],
  /** 支线精英：灯开后可进房打；不挡主路过关 */
  sideBoss: {
    id: 'enemydiao',
    name: '敌貂蝉',
    hp: 160,
    x: 340,
    y: 148,
    weak: [],
    requireInside: 'diao_room',
    onClearFlag: 'diao_cleared',
    packScore: 18000,
  },
  bosses: [
    {
      id: 'lumeng',
      name: '吕蒙',
      hp: 200,
      x: 1180,
      y: 148,
      weak: [],
      packScore: 32000,
      bumps: { count: 3, flag: 'has_jiujiezhang', msg: '撞吕蒙×3 · 九节杖' },
    },
  ],
};
