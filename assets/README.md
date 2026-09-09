# Assets

Original art only for 《烽火三国》.

## Rules

- **Allowed**: original pixel art, newly drawn / generated tiles & sprites, procedural canvas silhouettes under `src/gfx.js`.
- **Forbidden**: ripped or dumped assets from 三国战纪 / Knights of Valour (any ROM revision), or other commercial games.
- Do not commit KOFs / MAME / ROM-extracted PNGs, tilemaps, or palette dumps.

## Generated originals (SAN-22 ref art)

Stage backgrounds and hero portraits under `assets/bg/` and `assets/chars/` are **newly generated originals**, styled after **public screenshots** of 三国战纪119 (composition, palette, arcade mood). They are **not** ROM dumps, ripped tiles, or sampled KOVs frames.

Local style references (copyrighted screenshots) live only under `assets/ref/` — that folder is **gitignored** and must never be committed or shipped.

## Optional stage backgrounds

Place optional hand-drawn / generated (original) backgrounds here:

```
assets/bg/stage1.png   # 截江救阿斗 — dock / river
assets/bg/stage2.png   # 定军斩夏侯 — mountain
assets/bg/stage3.png   # 威震汉中地 — forest
assets/bg/stage4.png   # 大意失荆州 — stone courtyard / braziers
assets/bg/stage5.png   # 智破八阵图 — formation mist
assets/bg/stage6.png   # 雪战夺荆州 — snow city
assets/bg/stage7.png   # 三国归一统 — river finale
```

Target resolution: wide strip scaled to cover **H=224** at draw time (parallax via `scrollX`). If a file is missing, `drawStageBackground` falls back to pure canvas scenic layers.

## Hero sprites

```
assets/chars/{charId}.png   # e.g. guanyu.png, zhangfei.png, zhaoyun.png
```

Drawn in Play / CharSelect at ~32–40px tall (feet-anchored, facing flip). Missing IDs keep the procedural silhouette from `HERO_LOOK` in `src/gfx.js`.
