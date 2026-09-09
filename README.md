# 烽火三国

横版合作街机原型 · 玩法对齐三国战纪 119 正宗 PLUS · 逻辑分辨率 `384×224`。

## 当前进度

**SAN-5 + SAN-6**（本分支）：流程骨架 + 119 操作 / 易攒气 / 天书面板。

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
| `C` | 天书栏 |
| `D`/`L` | 使用天书 |
| `Esc` | 回标题 |

气：最多 3 珠；珠未满时**攻击命中敌人 +1 珠**；爆气中用天书有加强。

## 状态流

`TitleCoin` → `CharSelect` → `StageIntro` → `Play` → `StageClear` → … → 关7后 `Ending` → 标题  
`Play` 死亡 → `Continue`（10s，耗币续关保留 RunFlags）→ 超时/无币 `GameOver` → 标题

## Linear

- [SAN-5](https://linear.app/sanguo/issue/SAN-5/流程骨架titlecoincharselectstagecontinuegameover)
- [SAN-6](https://linear.app/sanguo/issue/SAN-6/操作与气119键位-易攒命中1珠)
