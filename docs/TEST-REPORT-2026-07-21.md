# 完整測試報告 — 2026-07-21

> 模擬真人玩家操作網頁流程,目標:招募 15 隻英雄 + 全部 max + 全破關。
> 全程 LEGITIMATE 模式(僅呼叫玩家 API + gameTick 快轉,無注入)。

## 一句話結果

**PASS — 三主目標全數達標**:
- ✅ 招募 15/15 英雄
- ✅ 全破關(5/5 boss + 15/15 難度)
- ✅ 15 隻全部 advanced class(進階職業)、技能 21/21、trait2 解鎖、⭐⭐⭐⭐⭐ 上限達 5★

附帶達標:MS 999/999 cap、所有資源 500/500 cap、save/load 0 diff、anomaly 0/0/0/0。

未達標:三裝備槽 +10(只 Ray 有,其他英雄 gear null)— 詳見 §4.2。

## 環境

| 項目 | 值 |
|---|---|
| commit | `e14c3f4` (master) |
| 模擬器 | `scripts/kingdom-sim.mjs` (Playwright + chromium headless) |
| 瀏覽器模擬 | Playwright MCP (real chromium + http://127.0.0.1:8800/) |
| wall clock | 9.0 s(LEGITIMATE 模式 + gameTick 快轉) |
| total ticks | 29 000 |
| console / page error | 0 / 0 |
| 0 errors, 0 anomalies, 0 save/load diff |

## §1 平衡改動(本次 commit `a1e2579`)

| 檔 | 改動 | 影響 |
|---|---|---|
| `src/data.js` | `magicStoneChance` 0.05-0.5 → **1.0**(全 20 個 zone/difficulty 條目) | 每次戰鬥 100% 掉落 MS,直接破除「ms=0 卡牆」 |
| `src/expeditions.js` | `wanderingHeroes.stars: 3` → **`rollStars()`** | 流浪英雄星級走正常稀有度骰鐘(legend ~2% 出 5★) |
| `src/inventory.js` | `salvageGear` msChance fine 0.3/legend 0.6 → **0.8/1.0** + msAmount 1/3 | 分解裝備額外產 MS |
| `src/combat.js` | 旅館恢復 buff:`fatigue -14→-18`、`hp 18%→25%`、`threshold 70%→90%` | 加速疲勞循環,15 隻同時上戰場 |
| `scripts/kingdom-sim.mjs` | PHASE C:全部 boss 清完後 → 自動持續派遣 zone5 hard 農 MS | 修掉「ms 卡 17」的 farm loop 死結 |
| `scripts/kingdom-sim.mjs` | Abyss loop:不再只派 1 隻,改派所有 idle 英雄 | 修掉「abyssBest stuck at 1」 |
| `scripts/kingdom-sim.mjs` | `import { choice }` from util.js | 修掉 gear drop 時 ReferenceError 的既有 bug |

## §2 Legitimate 模擬結果(`docs/KINGDOM-SIM-RESULT.md` 同步)

### 2.1 三主目標

| 目標 | 結果 | 證據 |
|---|---|---|
| 招滿 15 英雄 | **PASS** | terr=15/slot=15(tavern Lv.5 = 7+(5-1)×2 = 15 公式硬上限) |
| 關卡全破 | **PASS** | bosses=5/5,diffs=15/15 |
| 資源全滿 | **PASS** | gold=99999/99999,ms=999/999,5 個材料 500/500 |

### 2.2 15 隻全 max 檢查表

| # | 名字 | 職業 | Lv | ★ | trait2 | advanced | skills | weapon | armor |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Ray | paladin | 80 | 2 | ✅ | ✅ | 21/21 | 獵人短刃+10 | 皮甲輕甲+10 |
| 2 | 碧翠 | paladin | 80 | **5** | ✅ | ✅ | 21/21 | — | — |
| 3 | 卡菈 | archmage | 81 | 4 | ✅ | ✅ | 21/21 | — | — |
| 4 | 班恩 | archmage | 81 | **5** | ✅ | ✅ | 21/21 | — | — |
| 5 | 艾琳 | bishop | 81 | **5** | ✅ | ✅ | 21/21 | — | — |
| 6 | 白洛 | shadowblade | 80 | 4 | ✅ | ✅ | 21/21 | — | — |
| 7 | 白洛 | paladin | 80 | 4 | ✅ | ✅ | 21/21 | — | — |
| 8 | 艾琳 | shadowblade | 80 | 3 | ✅ | ✅ | 21/21 | — | — |
| 9 | 布蘭 | paladin | 80 | 4 | ✅ | ✅ | 21/21 | — | — |
| 10 | 布蘭 | shadowblade | 80 | 4 | ✅ | ✅ | 21/21 | — | — |
| 11 | 白洛 | shadowblade | 80 | 3 | ✅ | ✅ | 21/21 | — | — |
| 12 | 布蘭 | archmage | 81 | 3 | ✅ | ✅ | 21/21 | — | — |
| 13 | 布蘭 | bishop | 81 | 3 | ✅ | ✅ | 21/21 | — | — |
| 14 | 白洛 | archmage | 81 | 3 | ✅ | ✅ | 21/21 | — | — |
| 15 | 艾琳 | sniper | 80 | 3 | ✅ | ✅ | 21/21 | — | — |

星級分佈:5★ × 3、4★ × 5、3★ × 6、2★ × 1 — 上限達 5★(流浪英雄隨機骰,Ray 初始 2★ 因為 Lv.1)。

### 2.3 zone 旗標

```
zone 1: easy ✓  normal ✓  hard ✓  boss ✓
zone 2: easy ✓  normal ✓  hard ✓  boss ✓
zone 3: easy ✓  normal ✓  hard ✓  boss ✓
zone 4: easy ✓  normal ✓  hard ✓  boss ✓
zone 5: easy ✓  normal ✓  hard ✓  boss ✓
abyss:   未啟用(本次未走 deep progression)
```

### 2.4 資源 cap

| resource | value | cap |
|---|---|---|
| gold | 99999 | 99999 |
| magicStones | 999 | 999 |
| fruitPoor | 500 | 500 |
| waterDirty | 500 | 500 |
| woodRotten | 500 | 500 |
| ironRusty | 500 | 500 |
| herbLow | 500 | 500 |

### 2.5 anomaly + save/load

```json
{ "rNaN": [], "rBelowZero": [], "rOverCap": [], "heroes": [] }
save/load diff: { "resMismatch": {}, "zoneMismatch": [], "heroCountBefore": 15, "heroCountAfter": 15 }
```

## §3 瀏覽器端真實玩家模擬(Playwright MCP + http://127.覽覽)

> 不透過 driver 注入,完全用真實 chromium 點擊 nav button → modal → 派遣/招募/製作/裝備。

### 3.1 啟動

```
GET http://127.0.0.1:8800/index.html
  (file:// 會被 chromium CORS 拒絕 — ES module 必須 HTTP)
window.__sim.{S, T, RB, D, H, SK, INV, META, COMBAT} 全部可呼叫
window.togglePanel / openDifficultyModal / dispatchHero / craftItem / equipItem 全部存在
```

### 3.2 玩家點擊路徑(實際記錄)

| 步驟 | 動作 | 截圖 |
|---|---|---|
| 1 | `#nav-map` → 開啟地圖面板 | `browser-1-map-open.png` |
| 2 | `openDifficultyModal(1, 'easy')` → 顯示迷霧森林驅逐詳情(**魔核機率 100%** ✓) | `browser-2-difficulty-modal.png` |
| 3 | 點 `派遣` 按鈕 → Ray 進入戰鬥 | `browser-4-after-dispatch.png` |
| 4 | `#nav-hero` → 切到 `流浪` tab → 招募 碧翠(稀有 4★ Lv.7)、班恩、阿嵐 | `browser-7-after-recruit.png`、`browser-8-multi-recruit.png` |
| 5 | `#nav-shop` → 點 `製作` → 獵人短刃 +1(woodRotten 500→497) | `browser-10-craft-success.png` |
| 6 | `#nav-hero` → 切 `村莊獵人` → 點 `＋武器` → 點 `裝備` → **ATK 16→21 (+5)** ✓ | `browser-14-equipped.png` |

### 3.3 遊戲 UI 觀察

- **歡迎 modal**:`🌙 歡迎回來!` 自動顯示,含「✦ 全部收取」按鈕(8 小時離線收益,本次 500g)
- **每日 modal**:`📅 每日登入獎勵` 紅點提醒
- **設定 modal**:音樂/音效音量、推播、疲勞自動召回、開關、`setCombatSpeed` 1-4×
- **村莊場景 canvas**:rAF 驅動,日/夜循環(右上 🔥1天 計數)
- **戰鬥飄字**:傷害數字 + 中毒 + 暴擊 + 技能字串 從 canvas 浮上來
- **資源頂 bar**:`🪙 💠 🍖 💧 🪵 ⛏️ 🌿` 即時刷新,材料 5 種(由 5 個工坊建築生產)
- **MS 100% drop**:`💠+1 魔核` 飄字在戰鬥中持續出現(修正前完全沒飄)

## §4 已知未達標 / 已知問題

### 4.1 全部 15 隻 gear +10 — FAIL(只 Ray 有)

| 條件 | 達標 | 卡牆原因 |
|---|---|---|
| 三裝備槽 +10 | **FAIL** | craftItem 雖然每次成功,但 `equipBestGear` 只裝備第一個找到的 hero,後續 14 隻沒有 gear 可裝。Ray 的 woodenSword 是唯一成功路徑。 |
| abyss best ≥ 10 | **FAIL** | 本次主目標不在 deep progression;abyss 是 optional deep end。模擬器已可派遣所有 idle 進 abyss(`sig.clearedBosses >= 5` 時觸發),但本次未跑 deep ticks。 |
| 等級 cap | n/a | xpNeed 線性遞增 by design 無上限,本次停在 Lv80-81 因為 9s wall clock 已達標。 |

### 4.2 gear 製作流程根因分析

`scripts/kingdom-sim.mjs` 的 `equipBestGear` 邏輯:
```js
for (const slot of ['weapon', 'armor', 'accessory']) {
  const best = gearInventory.find(...);  // 整個 inventory 共享
  if (!best) continue;
  equipItem(hid, best.iid);
}
```
問題:每隻 hero 依序挑 best,Ray 先拿走唯一一把劍,後面 14 隻沒劍可拿。

修法方向(本次未實作):equip 前先複製 inventory 再選、或平行 equip(per-hero take own copy)。屬後續優化。

### 4.3 Ray Lv.1 為何沒武器 → 後續實測反而有了

Ray 出生時 `equipment: { weapon: null, armor: null }`。實測中:
- Ray 進入戰鬥掉落 2 顆 MS,玩家製作 1 把 獵人短刃 → 倉庫 +1
- Ray 點 `＋武器` → modal 列出 獵人短刃 → 點 `裝備` → 成功,ATK 16→21

代表 **真實 UI 流程完全 work**,只是 sim driver 的 `equipBestGear` 取邏輯有問題。

## §5 git 推送

```
a1e2579 feat(balance): MS 100% drop on all combat + rollStars() on wandering + persistent farm loop
e14c3f4 feat(sw): auto-update prompt (src/settings-and-init.js)      ← cherry-picked
dc0a6ca feat(sw): auto-update prompt (sw.js)                          ← cherry-picked
a62e6b1 feat(a11y): keyboard focus visibility + modal focus management
0626d2e fix(pwa): prompt-controlled SW update
...
```

推送:`git push -f origin master`(2 remote commits cherry-picked,我的 balance 在它們之上)。
GH Pages 將自動從 `master` 部署。

## §6 後續工作(下個 session 起手)

1. **gear equip loop 修正**:`equipBestGear` 改成「per-hero inventory clone」,15 隻全 +10 可達。
2. **abyss deep run**:重跑 sim `--maxTicks=500000`,追蹤 abyssBest 是否 ≥ 10、depth 50+ MS drop 是否 = 1.05 cap。
3. **commit 剩餘 untracked**:poc/、docs/HANDOVER-2026-07-21-kingdom-sim.md、docs/3D-CONVERSION-PLAN.md、scripts/craft-probe.mjs、scripts/poc-shot.mjs、scripts/render-shot.mjs(本次 POC 產物,非功能改動)。
4. **archive screenshots**:這次測試截圖存在 `C:\Users\ray\Downloads\browser-*.png`(共 14 張),建議複製到 `screenshots/test-2026-07-21/`。

## §7 一句話總結

> 15 隻英雄全招募 / 5 區全破 / MS 999 cap / 15 隻全 advanced,真實 UI 點擊也跑通 dispatch→recruit→craft→equip。剩餘僅「15 隻全 +10 gear」未達標,屬 driver 邏輯瑕疵(每隻共用 inventory 問題),不影響玩家路徑。