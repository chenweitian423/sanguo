# 烽火三国

横版合作街机原型 · 玩法对齐三国战纪 119 正宗 PLUS · 逻辑分辨率 `384×224`。

## 当前进度

**SAN-5 流程骨架**（本分支）：投币 → 选人 → 关卡闪卡 → 占位战斗 → 过关 / Continue / GameOver。

设定总表（Notion）与 Linear 项目见团队文档。本仓旧「乱世刀锋」原型已按需求覆盖。

## 运行

本地直接开即可（纯静态）：

```bash
# 任选其一
npx --yes serve .
python3 -m http.server 8080
```

浏览器打开提示的地址，焦点点在画布上再按键。

## 键位（SAN-5）

| 键 | 作用 |
|---|---|
| `5` / `6` / `C` | 投币 +1 CREDIT |
| `1` / `Enter` | 有币时开始 / 确认 / 跳过闪卡 / 占位过关 |
| 方向键 | 选人光标 |
| `A` / `Z` / `J` | 确认选人（街机 A） |
| `D` / `X` / `K` | 占位「死亡」→ Continue |
| `Esc` | 调试：立刻回标题（清 RunFlags） |

## 状态流

`TitleCoin` → `CharSelect` → `StageIntro` → `Play` → `StageClear` → … → 关7后 `Ending` → 标题  
`Play` 死亡 → `Continue`（10s，耗币续关保留 RunFlags）→ 超时/无币 `GameOver` → 标题

## Linear

- [SAN-5](https://linear.app/sanguo/issue/SAN-5/流程骨架titlecoincharselectstagecontinuegameover)
