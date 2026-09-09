/**
 * SAN-21: id-based WebAudio SFX/BGM stubs (no wav assets).
 * Beeps / noise bursts keyed by id — swap real samples later without call-site churn.
 */

/** @typedef {'hit'|'jump'|'guard'|'burst'|'qi'|'coin'|'heal'|'item'|'chest'|'boss_die'|'continue_tick'|'stage_clear'|'menu'} SfxId */
/** @typedef {'title'|'stage'|'boss'|'ending'|'silence'} BgmId */

export const SFX_IDS = [
  'hit',
  'jump',
  'guard',
  'burst',
  'qi',
  'coin',
  'heal',
  'item',
  'chest',
  'boss_die',
  'continue_tick',
  'stage_clear',
  'menu',
];

export const BGM_IDS = ['title', 'stage', 'boss', 'ending', 'silence'];

/** @type {AudioContext|null} */
let ctx = null;
/** @type {OscillatorNode|null} */
let bgmOsc = null;
/** @type {GainNode|null} */
let bgmGain = null;
/** @type {BgmId} */
let bgmId = 'silence';
let muted = false;
let lastContinueSec = -1;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Unlock / resume on first user gesture. */
export function unlockAudio() {
  const c = ac();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
}

export function setMuted(v) {
  muted = !!v;
  if (bgmGain) bgmGain.gain.value = muted || bgmId === 'silence' ? 0 : 0.04;
}

/**
 * Play a short stub SFX by id.
 * @param {SfxId|string} id
 * @param {{ vol?: number }} [opts]
 */
export function playSfx(id, opts = {}) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const vol = opts.vol != null ? opts.vol : 0.12;
  const now = c.currentTime;

  /** @type {Record<string, { type: OscillatorType| 'noise', f0: number, f1?: number, dur: number, gain?: number }>} */
  const table = {
    hit: { type: 'square', f0: 420, f1: 180, dur: 0.06, gain: 0.1 },
    jump: { type: 'triangle', f0: 220, f1: 440, dur: 0.1, gain: 0.08 },
    guard: { type: 'sine', f0: 660, f1: 520, dur: 0.07, gain: 0.09 },
    burst: { type: 'sawtooth', f0: 110, f1: 330, dur: 0.22, gain: 0.11 },
    qi: { type: 'sine', f0: 520, f1: 780, dur: 0.08, gain: 0.07 },
    coin: { type: 'square', f0: 880, f1: 1320, dur: 0.09, gain: 0.08 },
    heal: { type: 'sine', f0: 360, f1: 720, dur: 0.14, gain: 0.08 },
    item: { type: 'triangle', f0: 480, f1: 640, dur: 0.1, gain: 0.07 },
    chest: { type: 'square', f0: 200, f1: 400, dur: 0.12, gain: 0.09 },
    boss_die: { type: 'sawtooth', f0: 160, f1: 40, dur: 0.35, gain: 0.12 },
    continue_tick: { type: 'square', f0: 300, f1: 240, dur: 0.05, gain: 0.07 },
    stage_clear: { type: 'triangle', f0: 440, f1: 880, dur: 0.28, gain: 0.09 },
    menu: { type: 'sine', f0: 400, f1: 400, dur: 0.04, gain: 0.05 },
  };

  const spec = table[id] || table.hit;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime((spec.gain || 0.1) * (vol / 0.12), now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur);
  g.connect(c.destination);

  if (spec.type === 'noise') {
    const n = Math.floor(c.sampleRate * spec.dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    src.start(now);
    src.stop(now + spec.dur + 0.02);
    return;
  }

  const osc = c.createOscillator();
  osc.type = /** @type {OscillatorType} */ (spec.type);
  osc.frequency.setValueAtTime(spec.f0, now);
  if (spec.f1 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.f1), now + spec.dur);
  osc.connect(g);
  osc.start(now);
  osc.stop(now + spec.dur + 0.02);
}

/**
 * Placeholder BGM — soft loop tone or silence.
 * @param {BgmId|string} id
 */
export function playBgm(id) {
  const next = /** @type {BgmId} */ (BGM_IDS.includes(id) ? id : 'silence');
  if (next === bgmId && bgmOsc) return;
  stopBgm();
  bgmId = next;
  if (next === 'silence' || muted) return;
  const c = ac();
  if (!c) return;

  const tones = {
    title: 110,
    stage: 146.83,
    boss: 98,
    ending: 164.81,
  };
  const freq = tones[next] || 110;
  bgmGain = c.createGain();
  bgmGain.gain.value = 0.035;
  bgmGain.connect(c.destination);
  bgmOsc = c.createOscillator();
  bgmOsc.type = 'sine';
  bgmOsc.frequency.value = freq;
  // gentle tremolo via LFO-ish second osc into gain is overkill — keep flat stub
  bgmOsc.connect(bgmGain);
  bgmOsc.start();
}

export function stopBgm() {
  try {
    if (bgmOsc) bgmOsc.stop();
  } catch (_) {
    /* already stopped */
  }
  bgmOsc = null;
  bgmGain = null;
  bgmId = 'silence';
}

/** Fire continue_tick once per whole second remaining. */
export function tickContinue(secondsLeft) {
  const sec = Math.ceil(secondsLeft);
  if (sec !== lastContinueSec && sec > 0 && sec <= 10) {
    lastContinueSec = sec;
    playSfx('continue_tick');
  }
  if (secondsLeft <= 0) lastContinueSec = -1;
}

export function resetContinueTick() {
  lastContinueSec = -1;
}
