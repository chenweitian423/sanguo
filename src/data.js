/** @typedef {{ id: string, name: string }} CharDef */
/** @typedef {{ id: number, name: string, blurb: string }} StageDef */

/** @type {CharDef[]} */
export const ROSTER = [
  { id: 'guanyu', name: '关羽' },
  { id: 'zhangfei', name: '张飞' },
  { id: 'zhaoyun', name: '赵云' },
  { id: 'machao', name: '马超' },
  { id: 'huangzhong', name: '黄忠' },
  { id: 'zhuge', name: '诸葛亮' },
  { id: 'diaochan', name: '貂蝉' },
  { id: 'zhangliao', name: '张辽' },
  { id: 'mozhangfei', name: '魔张飞' },
  { id: 'baijia', name: '白甲黄忠' },
];

/** @type {StageDef[]} */
export const STAGES = [
  { id: 1, name: '截江救阿斗', blurb: '江船教学 · 孙姬' },
  { id: 2, name: '定军斩夏侯', blurb: '火剑密室 · 彻里吉→夏侯渊' },
  { id: 3, name: '威震汉中地', blurb: '孟优→夏侯惇→张辽 · 青缸' },
  { id: 4, name: '大意失荆州', blurb: '吕蒙 · 灯门貂蝉 · 雷神锤' },
  { id: 5, name: '智破八阵图', blurb: '沙摩柯→破阵阵眼→吕布→陆逊→左慈' },
  { id: 6, name: '雪战夺荆州', blurb: '许褚 · 凸砖太阿' },
  { id: 7, name: '三国归一统', blurb: '越吉/电道 · 司马懿 · 曹操' },
];

export const W = 384;
export const H = 224;
export const CONTINUE_SEC = 10;
export const INTRO_SEC = 2;
