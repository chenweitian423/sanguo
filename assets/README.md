# Assets

Original art only for 《烽火三国》.

## Rules

- **Allowed**: original pixel art, newly drawn tiles/sprites, procedural canvas silhouettes under `src/gfx.js`.
- **Forbidden**: ripped or dumped assets from 三国战纪 / Knights of Valour (any ROM revision), or other commercial games.
- Do not commit KOFs / MAME / ROM-extracted PNGs, tilemaps, or palette dumps.

## Optional stage backgrounds

Place optional hand-drawn (original) backgrounds here:

```
assets/bg/stage1.png   # 截江救阿斗 — river boat
assets/bg/stage2.png   # 定军斩夏侯 — mountain
assets/bg/stage3.png   # 威震汉中地 — forest
assets/bg/stage4.png   # 大意失荆州 — rain night
assets/bg/stage5.png   # 智破八阵图 — formation mist
assets/bg/stage6.png   # 雪战夺荆州 — snow city
assets/bg/stage7.png   # 三国归一统 — river finale
```

Target resolution: **384×224** (or wider for parallax strips). If a file is missing, `drawStageBackground` falls back to pure canvas scenic layers.

Arcade-inspired silhouettes for heroes/grunts/bosses are drawn in code — not sampled from KOVs frames.
