/** Remappable keyboard binds — 119 ABCD → default JKLI; WASD = 1P stick. */

export const ACTIONS = [
  { id: 'up', label: '上' },
  { id: 'down', label: '下' },
  { id: 'left', label: '左' },
  { id: 'right', label: '右' },
  { id: 'A', label: 'A 攻击' },
  { id: 'B', label: 'B 跳/翻页' },
  { id: 'C', label: 'C 道具/防' },
  { id: 'D', label: 'D 使用' },
];

export const DEFAULT_BINDS = {
  p1: {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    A: 'j',
    B: 'k',
    C: 'l',
    D: 'i',
  },
  // 2P 占位：方向键 + 小键盘，设置里可改
  p2: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    A: 'Numpad1',
    B: 'Numpad2',
    C: 'Numpad3',
    D: 'Numpad0',
  },
};

const STORAGE_KEY = 'fenghuo_keybinds_v1';

function cloneDefaults() {
  return {
    p1: { ...DEFAULT_BINDS.p1 },
    p2: { ...DEFAULT_BINDS.p2 },
  };
}

export function loadBinds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw);
    const out = cloneDefaults();
    for (const pad of ['p1', 'p2']) {
      if (!parsed[pad]) continue;
      for (const a of ACTIONS) {
        if (typeof parsed[pad][a.id] === 'string' && parsed[pad][a.id]) {
          out[pad][a.id] = parsed[pad][a.id];
        }
      }
    }
    return out;
  } catch {
    return cloneDefaults();
  }
}

export function saveBinds(binds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(binds));
}

export function resetBinds() {
  const b = cloneDefaults();
  saveBinds(b);
  return b;
}

/** Pretty label for HUD / settings. */
export function keyLabel(code) {
  if (!code) return '—';
  const map = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    ' ': 'Space',
    Space: 'Space',
    Numpad0: 'Num0',
    Numpad1: 'Num1',
    Numpad2: 'Num2',
    Numpad3: 'Num3',
    Numpad4: 'Num4',
    Numpad5: 'Num5',
    Numpad6: 'Num6',
    Numpad7: 'Num7',
    Numpad8: 'Num8',
    Numpad9: 'Num9',
  };
  if (map[code]) return map[code];
  if (code.length === 1) return code.toUpperCase();
  return code;
}
