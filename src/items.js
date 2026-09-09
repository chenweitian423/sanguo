/** Item catalog for ItemPanel (SAN-7). Heals are ground pickups, not bag. */

export const PAGE_THROW = 0;
export const PAGE_TREASURE = 1;
export const PAGE_BOOK_SWORD = 2;
export const PAGE_NAMES = ['普通投掷', '高级法宝', '天书与四剑'];

/** @type {{ id: string, name: string, page: number, kind: string, qty?: number, elem?: string, held?: boolean }[]} */
export const STARTER_BAG = [
  { id: 'sleeve', name: '袖箭', page: PAGE_THROW, kind: 'throw', qty: 5 },
  { id: 'bomb', name: '炸弹', page: PAGE_THROW, kind: 'throw', qty: 2 },
  { id: 'poison_dart', name: '毒镖', page: PAGE_THROW, kind: 'throw', qty: 3 },
  { id: 'smoke', name: '毒筒', page: PAGE_THROW, kind: 'throw', qty: 2 },
  { id: 'lotus', name: '铁莲花', page: PAGE_THROW, kind: 'throw', qty: 1 },
  { id: 'tianshi', name: '天师符', page: PAGE_TREASURE, kind: 'treasure', qty: 1 },
  { id: 'zhangling', name: '张陵剑', page: PAGE_TREASURE, kind: 'treasure', qty: 1 },
  { id: 'huangshi', name: '黄石公', page: PAGE_TREASURE, kind: 'treasure', qty: 1 },
  { id: 'puppet', name: '傀儡', page: PAGE_TREASURE, kind: 'stun', qty: 1 },
  { id: 'rendun', name: '人遁书', page: PAGE_BOOK_SWORD, kind: 'book', qty: 1, elem: '火' },
  { id: 'tiandun', name: '天遁书', page: PAGE_BOOK_SWORD, kind: 'book', qty: 1, elem: '电' },
  { id: 'taiping', name: '太平要术', page: PAGE_BOOK_SWORD, kind: 'book', qty: 1, elem: '风' },
  { id: 'qingling', name: '太平青领', page: PAGE_BOOK_SWORD, kind: 'book', qty: 1, elem: '雨' },
  { id: 'didun', name: '地遁书', page: PAGE_BOOK_SWORD, kind: 'book', qty: 1, elem: '石' },
  { id: 'sword_fire', name: '倚天', page: PAGE_BOOK_SWORD, kind: 'sword', held: false, elem: '火' },
  { id: 'sword_ice', name: '青缸', page: PAGE_BOOK_SWORD, kind: 'sword', held: false, elem: '冰' },
  { id: 'sword_thunder', name: '干将', page: PAGE_BOOK_SWORD, kind: 'sword', held: false, elem: '电' },
  { id: 'sword_boom', name: '太阿', page: PAGE_BOOK_SWORD, kind: 'sword', held: false, elem: '爆' },
];

export function cloneBag() {
  return STARTER_BAG.map((i) => ({ ...i }));
}
