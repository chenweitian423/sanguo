# 烽火三国

横版合作街机原型 · 玩法对齐三国战纪 119 正宗 PLUS · 逻辑分辨率 `384×224`。

## 当前进度

**SAN-5～9**：流程 + 操作气 + HUD/栏 + 出招 + RunFlags/宽松门控（Continue 保留旗标；冰爆同持；密道无人物锁；爆密不强制璧；电道要锤）。

设定总表（Notion）与 Linear 项目见团队文档。本仓旧「乱世刀锋」原型已按需求覆盖。

## 运行

本地直接开即可（纯静态）：

```bash
# 任选其一
npx --yes serve .
python3 -m http.server 8080
```

浏览器打开提示的地址，焦点点在画布上再按键。

## 键位（119）

默认 **1P**：`WASD` 方向 · `J/K/L/I` = A/B/C/D。标题 **Tab** 打开设置，1P/2P 可改键，`R` 恢复默认（存 localStorage）。

| 街机 | 默认 1P | 作用 |
|---|---|---|
| 投币 | `5` / `6` | 投币 |
| START | `1` / `Enter` | 开始 / 确认 / 过关；`2`=2P |
| 方向 | `WASD` | 走；同向连按跑；`S` 蹲 |
| A | `J` | 攻击 / 确定 |
| 方向+A | `D`/`A`+`J` | 大斩 |
| B | `K` | 跳；栏开时翻页 |
| C | `L` | 道具栏；方向+C 防御 |
| D | `I` | 使用道具 |
| A+B | `J`+`K` | 血杀 |
| A+B+C | `J`+`K`+`L` | 爆气 |
| — | `Tab` / `Esc` | 键位设置 / 回标题 |

2P 默认：方向键 + 小键盘 `1/2/3/0` = A/B/C/D（可在设置改）。

气：最多 3 珠；珠未满时**攻击命中敌人 +1 珠**；爆气中用天书有加强。

## 状态流

`TitleCoin` → `CharSelect` → `StageIntro` → `Play` → `StageClear` → … → 关7后 `Ending` → 标题  
`Play` 死亡 → `Continue`（10s，耗币续关保留 RunFlags）→ 超时/无币 `GameOver` → 标题

## Linear

- [SAN-5](https://linear.app/sanguo/issue/SAN-5/流程骨架titlecoincharselectstagecontinuegameover)
- [SAN-6](https://linear.app/sanguo/issue/SAN-6/操作与气119键位-易攒命中1珠)
- [SAN-7](https://linear.app/sanguo/issue/SAN-7/hud-itempanel投掷法宝天书四剑)
- [SAN-8](https://linear.app/sanguo/issue/SAN-8/10人角色骨架-出招表接入)
- [SAN-9](https://linear.app/sanguo/issue/SAN-9/runflags-状态机-宽松门控)
- [SAN-10](https://linear.app/sanguo/issue/SAN-10/道具掉落清兵箱boss加血-傀儡定身)
- [SAN-11](https://linear.app/sanguo/issue/SAN-11/分数升级-0-24易升表-属性相克)
- [SAN-12](https://linear.app/sanguo/issue/SAN-12/2p-同屏落后锁卷轴-经济加量)
- [SAN-13](https://linear.app/sanguo/issue/SAN-13/关1-截江救阿斗主路火书密孙姬)
- [SAN-14](https://linear.app/sanguo/issue/SAN-14/关2-定军斩夏侯火剑密王平密双boss)
- [SAN-15](https://linear.app/sanguo/issue/SAN-15/关3-威震汉中三boss冰剑密)
- [SAN-16](https://linear.app/sanguo/issue/SAN-16/关4-大意失荆州吕蒙貂蝉灯门雷神锤)

## 道具掉落（SAN-10）

- 清兵：约 55% 掉普通投掷进栏；有概率掉金钱（只加分）
- 木箱：攻击/靠近打开 → 普通投掷或高级法宝
- Boss：必掉加血地上物（鸡腿/包子/酒壶），捡起瞬回；有概率再掉法宝
- 傀儡：定身（非助战），不召唤助战单位
- 金钱：铜 100 / 银 500 / 金 2000，不进道具栏

## 分数升级 + 属性相克（SAN-11）

- 易升表：关羽 PLUS ×0.4（千位取整）；Lv24 = 780000；道具威力 LV20 满档
- 五档 ATK（每 5 级）；攻速每档约 +3.5%
- `final = base × (atk/112) × elem_mult × (1+sword_bonus)`
- 火↔冰 1.5；同属 0.75；Boss 弱点命中 1.5

## 2P 同屏（SAN-12）

- 标题 `1`=1P（1币），`2`=2P（2币）；选人可同角
- 卷轴跟随**落后**玩家；领先者无法独自推镜
- 分数/等级/背包各算；RunFlags 共享；无友伤
- 2P：Boss HP×1.4，杂兵×1.65，掉落数量×1.5；Boss 包两人全额
- 2P 键位默认方向键+小键盘，可在 Tab 设置里改

## 关1 对齐说明

与 119 对得上的：**孙姬**、**撞×2 傀儡**、火书密（PLUS 站位 → 本作单人站圈）、教学清兵。  
故意宽松：火书/破口密单人。仍简化：整船多屏/船舱 B·C/孙姬细轴未做完。

## 关1 截江（SAN-13）

- 教学波 T0–T5（攻击/跑/大斩/防/道具）
- 火书站位密室：站圈约 0.85s，**单人即可** → `has_fire_book` + 人遁书
- 水兽机关可打碎掉袖箭
- Boss **孙姬**：靠近攻击或顶撞累计×2 → 傀儡；击败过关

## 关2 定军（SAN-14）

- 山道清兵波；**火剑密**门无条件可进 → 箱得倚天、火柱自焚得无名火
- **王平密**可选，不锁冰/爆；可拿黄石公
- Boss：**彻里吉**（撞×2黄石公，弱电）→ **夏侯渊**（撞×2将军印，弱火）

## 关3 威震汉中（SAN-15）

- Boss：**孟优**(弱爆) → **夏侯惇**(弱电) → **张辽**(无)
- 冰剑密：进门（宽松可不强制无名火）→ 打**第三尊石狮** → 开箱得**青缸**
- 拿冰**不锁爆**（宽松）

## 关4 大意失荆州（SAN-16）

- Boss：**吕蒙**（撞×3 → 九节杖）
- 支线：暗室**先左灯再右灯**开门 → **敌貂蝉** → 几案进老鹰密 → **雷神锤**
