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

## 键位

| 键 | 作用 |
|---|---|
| `5` / `6` | 投币 |
| `1` / `Enter` | 开始 / 确认 / 过关 |
| 方向 | 走；`→→` 跑 |
| `A`/`Z`/`J` | 攻击；选人确认 |
| `→`+`A` | 大斩 |
| `B`/`X`/`K` | 跳 |
| `↓` | 蹲 |
| `→`+`C` | 防御（再 A 反击） |
| `A`+`B` | 血杀（扣血） |
| `A`+`B`+`C` | 爆气（耗 1 珠） |
| `C` | 道具栏 |
| `B`（栏开时） | 翻页 |
| `D`/`L` | 使用道具 |
| `Esc` | 回标题 |

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
