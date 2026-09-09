/**
 * SAN-21: tiny UI font-size / stroke tokens (Notion ranges).
 * Logo 22–28 · 闪卡名 18–20 · HUD/选人名 8–9 · 倒计时 12–16 · 描边 1px
 */

export const UI = {
  fontFamily: '"PingFang SC","Microsoft YaHei",monospace',
  /** text outline width in CSS px (game canvas) */
  stroke: 1,

  logo: 24,
  logoSm: 22,
  logoLg: 28,

  /** StageIntro / flash-card stage title */
  cardName: 18,
  cardNameLg: 20,

  /** HUD labels / char-select names */
  hud: 8,
  hudSm: 7,
  charName: 9,

  /** Continue countdown */
  countdown: 14,
  countdownLg: 16,
  countdownXl: 28,

  body: 10,
  title: 12,
  caption: 8,
  micro: 6,
  banner: 14,
};

/**
 * Draw stroked UI text with token defaults.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} str
 * @param {number} x
 * @param {number} y
 * @param {{ size?: number, color?: string, align?: CanvasTextAlign, baseline?: CanvasTextBaseline, stroke?: number }} [opts]
 */
export function drawUiText(ctx, str, x, y, opts = {}) {
  const size = opts.size != null ? opts.size : UI.body;
  const color = opts.color != null ? opts.color : '#e8dcc8';
  const align = opts.align || 'left';
  const baseline = opts.baseline || 'top';
  const stroke = opts.stroke != null ? opts.stroke : UI.stroke;

  ctx.font = `${size}px ${UI.fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (stroke > 0) {
    ctx.lineWidth = stroke;
    ctx.strokeStyle = '#000';
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  } else {
    ctx.fillStyle = '#000';
    ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
