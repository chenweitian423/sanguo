/**
 * 10-character specials (SAN-8), aligned to 烽火三国 / 119 summary.
 * Motions are simplified buffers: 236, 28, 46, 22, 8A (↑A).
 */

/** @typedef {{ id: string, name: string, motion: string, burst?: boolean, dmg: number, reach: number, label: string }} MoveDef */

/** @type {Record<string, { color: string, normals: string, specials: MoveDef[], burstNote: string }>} */
export const CHAR_MOVES = {
  guanyu: {
    color: '#c04040',
    normals: 'A连 · →A大斩',
    burstNote: '爆气 ←→A 回风扫叶',
    specials: [
      { id: 'feilong', name: '飞龙在天', motion: '236', dmg: 22, reach: 48, label: '↓↘→A' },
      { id: 'kuanglong', name: '狂龙出海', motion: '28', dmg: 20, reach: 40, label: '↓↑A' },
      { id: 'huifeng', name: '回风扫叶', motion: '46', dmg: 28, reach: 52, label: '←→A', burst: true },
    ],
  },
  zhangfei: {
    color: '#4060c0',
    normals: 'A连 · →A大斩',
    burstNote: '爆气 ↓↘→A 神龙摆尾',
    specials: [
      { id: 'kuangfeng', name: '狂风式', motion: '46', dmg: 20, reach: 44, label: '←→A' },
      { id: 'ehu', name: '饿虎扑羊', motion: '28', dmg: 24, reach: 36, label: '↑↓A' },
      { id: 'manniu', name: '蛮牛式', motion: '22', dmg: 18, reach: 32, label: '↓↓A' },
      { id: 'shenlong', name: '神龙摆尾', motion: '236', dmg: 30, reach: 56, label: '↓↘→A', burst: true },
    ],
  },
  zhaoyun: {
    color: '#c0c0e0',
    normals: 'A连 · →A三分·地',
    burstNote: '爆气 ↓↘→A 白鹤亮翅',
    specials: [
      { id: 'difen', name: '三分天下·地', motion: '6A', dmg: 14, reach: 40, label: '→A' },
      { id: 'dapeng', name: '大鹏展翅', motion: '28', dmg: 22, reach: 44, label: '↓↑A' },
      { id: 'baihe', name: '白鹤亮翅', motion: '236', dmg: 28, reach: 50, label: '↓↘→A', burst: true },
    ],
  },
  machao: {
    color: '#e08040',
    normals: 'A连 · →A飞龙追日',
    burstNote: '爆气 ←→A 仙人指路',
    specials: [
      { id: 'zhuiri', name: '飞龙追日', motion: '6A', dmg: 14, reach: 42, label: '→A' },
      { id: 'fanyun', name: '翻云崩', motion: '28', dmg: 22, reach: 40, label: '↑↓A' },
      { id: 'xianren', name: '仙人指路', motion: '46', dmg: 26, reach: 54, label: '←→A', burst: true },
    ],
  },
  huangzhong: {
    color: '#a08040',
    normals: '→A射箭 · 远程起手',
    burstNote: '爆气 ↑↓A 李广射虎',
    specials: [
      { id: 'shejian', name: '射箭', motion: '6A', dmg: 12, reach: 90, label: '→A' },
      { id: 'dupi', name: '独劈华山', motion: '236', dmg: 24, reach: 36, label: '↓↘→A' },
      { id: 'liguang', name: '李广射虎', motion: '28', dmg: 28, reach: 100, label: '↑↓A', burst: true },
    ],
  },
  zhuge: {
    color: '#60a060',
    normals: 'A连 · 法术向',
    burstNote: '爆气 ↓↑A 呼风唤雨',
    specials: [
      { id: 'pili', name: '霹雳火', motion: '46', dmg: 18, reach: 50, label: '←→A' },
      { id: 'leiting', name: '雷霆万钧', motion: '28', dmg: 22, reach: 60, label: '↓↑A' },
      { id: 'hufeng', name: '呼风唤雨', motion: '28', dmg: 30, reach: 80, label: '↓↑A', burst: true },
    ],
  },
  diaochan: {
    color: '#e060a0',
    normals: 'A连 · 快',
    burstNote: '爆气 ←→A 织女穿梭',
    specials: [
      { id: 'tiannu', name: '天女散花', motion: '236', dmg: 20, reach: 46, label: '↓↘→A' },
      { id: 'tiyun', name: '踢云纵', motion: '28', dmg: 18, reach: 34, label: '↑↓A' },
      { id: 'zhinv', name: '织女穿梭', motion: '46', dmg: 26, reach: 48, label: '←→A', burst: true },
    ],
  },
  zhangliao: {
    color: '#708090',
    normals: 'A连 · →A追风腿',
    burstNote: '爆气 ↑↓A 杀手锏',
    specials: [
      { id: 'zhuifeng', name: '追风腿', motion: '6A', dmg: 14, reach: 40, label: '→A' },
      { id: 'bawang', name: '霸王击鼎', motion: '46', dmg: 22, reach: 38, label: '←→A' },
      { id: 'shashou', name: '杀手锏', motion: '28', dmg: 28, reach: 44, label: '↑↓A', burst: true },
    ],
  },
  mozhangfei: {
    color: '#6030a0',
    normals: '张飞骨架 + PLUS',
    burstNote: '爆气挑拨/强化',
    specials: [
      { id: 'kuangfeng2', name: '狂风式', motion: '46', dmg: 21, reach: 44, label: '←→A' },
      { id: 'tiaobo', name: '挑拨', motion: '28', dmg: 16, reach: 50, label: '↑↓A' },
      { id: 'moshen', name: '魔神摆尾', motion: '236', dmg: 32, reach: 56, label: '↓↘→A', burst: true },
    ],
  },
  baijia: {
    color: '#d0d0d0',
    normals: '→A三箭 · 空↓A',
    burstNote: '爆气远程加强',
    specials: [
      { id: 'sanjan', name: '三箭', motion: '6A', dmg: 16, reach: 88, label: '→A' },
      { id: 'zhuihun', name: '追魂劈', motion: '236', dmg: 24, reach: 36, label: '↓↘→A' },
      { id: 'yunli', name: '云里射雕', motion: '28', dmg: 28, reach: 96, label: '↑↓A', burst: true },
    ],
  },
};

export function movesFor(charId) {
  return CHAR_MOVES[charId] || CHAR_MOVES.guanyu;
}
