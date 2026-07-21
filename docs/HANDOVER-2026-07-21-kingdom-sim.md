# 交接 mega-idle-web-pixel 2026-07-21

## 本次 session 做了什麼

### 1. PWA SW 自動更新功能重寫（已 commit `0626d2e`）

原始半成品有 11 個 confirmed 對抗審查問題，全部修復並驗證通過。

| 檔案 | 改動 |
|---|---|
| `src/util.js` | `showToast(msg,type,duration=2200)` 新增至三參數，回傳 element；`duration<=0` 持久不消失 |
| `src/settings-and-init.js` | `registerSW()` / `promptUpdate()` 重寫：controllerchange 統一觸發 reload（`hadController` 擋首次安裝 false positive；`_refreshing` 防 loop）；toast `el.style.pointerEvents='auto'`；per-worker 去重（不再一次性永久壓制） |
| `sw.js` | 移除 install 無條件 `skipWaiting()`（新 SW 停在 waiting 等用戶點 toast）；從 ASSETS_TO_CACHE 移除 `./sw.js`（對齊 CLAUDE.md）；SKIP_WAITING message handler 保留 |
| `index.html` | focus-visible 焦點環（`:focus-visible` + `@supports not :focus-visible` 退回）|
| 8 個 `.modal-overlay` 內層 | `role="region"` → `role="dialog" aria-modal="true"`（ARIA dialog 語意） |

驗證：npm test 4/4、test:a11y 0 violations、offline OK、Playwright 實測 Tab-focus-trap / Esc 焦點還原 / 重複 hide 不偷焦點。

---

### 2. 鍵盤/Modal 焦點管理（已 commit `a62e6b1）

| 改動 | 檔 |
|---|---|
| `util.js showModal/hideModal` | showModal 存 opener focus 並主動移入 dialog 容器；hideModal 還原 focus（per-id map） |
| `ui.js setupKeyboardNav` | Esc 改走 hideModal；Tab focus-trap 顯式處理容器 tabindex=-1 情況 |
| `index.html` | `:focus-visible` 全域焦點環（WCAG 2.4.7）|

驗證：fresh-context Playwright 實測 0/0/0/0。pre-commit 全過。

---

### 3. 王國經營模擬（已跑完，`docs/KINGDOM-SIM-RESULT.md` 已存）

純 legitimate 模式（只呼叫玩家 API + gameTick 快轉，無注入）。300k ticks / 140s。

**三目標結果**：

| 目標 | 結果 |
|---|---|
| 招滿英雄 | ✅ **15/15**（領地硬上限，tavern L5） |
| 關卡全破 | ✅ **5/5 Boss + 15/15 難度（全破） |
| 資源全滿 | ⚠️ gold ✅ / 材料 ✅ / **magicStones 0/999 ❌** |

**15 隻「全 max」為何不可能**（已查 source 確認）：
- **50 隻 → 硬上限 15**：名額公式 `7+(tavern-1)×2`，酒館上限 5 無法突破
- **5★ 招募不到**：`expeditions.js:94` 流浪英雄 `stars: 3` **寫死**；只有初始英雄 Ray 走 `rollStars()`（~5% 傳說稀有度）。**設計上不可能靠招募湊出全 5★ 隊伍**
- **magicStones 零產出**：無 tick 生產，只能戰鬥掉落。1691 場戰鬥 + 24 Boss 掉了 **0 顆**。轉職（×15=300 顆）與強化（每件需數顆）全部卡死
- **advanced class**：需 20 magicStones，ms=0 → 0/15 advanced
- **裝備 +10**：強化需 ms，ms=0 → 卡在 +7~9

已達標：全 15 隻 21/21 技能滿、等級 Lv290+（無上限）、trait2 全解鎖、5 區全破

發現並修復 `src/data.js` 既有 bug：`makeGearInstance()` 使用 `choice(AFFIXES)` 但從未 import，fine/legend 裝備掉落時 `ReferenceError`。修復：加 `import { choice } from './util.js'`。

---

### 4. Balance rebalance（本次進行的改動）

**已applied 未 commit**（working tree）：
- `src/expeditions.js:94`：`stars: 3` → `stars: rollStars()`（流浪英雄星級現在走正常稀有度骰鐘，傳說 ~2% 出 5★）
- `src/data.js`：所有難度（easy/normal/hard/boss）magicStoneChance ×2（boss 上限 cap 0.9）：
  - Zone1 boss 0.3→**0.6**、Zone2 boss 0.35→**0.7**、Zone3 boss 0.4→**0.8**、Zone4 boss 0.45→**0.9**、Zone5 boss 0.5→**0.9**
  - 非 boss 難度同樣 ×2（0.05→0.1、0.1→0.2 等）
- `src/data.js`：清理 sim-impl 留的 patch 註解（保留必要 import）

### 5. 未完成（待續）

- **深淵 dispatch loop**：driver 未實作持續 `dispatchAbyss` → `abyssBest` 只到 1，需補全自動深淵迴圈
- **重跑模擬**：balance 改完後需重新跑 `scripts/kingdom-sim.mjs --maxTicks=500000` 驗證 15 全 max 可達（預期：MS 產出應大幅改善，5★ 仍靠 RNG）
- **git push**：本機 git 寫入 zlib deflate segfault（compression=0 可 commit 但 push/repack 仍崩）

---

## 工作區狀態

```
git status -s
M src/expeditions.js   (wandering stars rollStars)
M src/data.js          (choice import 清理 + MS ×2 + 乾淨註解)
M sw.js                 (CACHE_NAME v22→v24 bump，SW 行為同 0626d2e，working tree 未髒)
```

**未 commit**：expeditions.js + data.js 兩檔（balance rebalance）。`git add` + `git commit` 需 `core.compression=0` 繞過 zlib segfault。

---

## 關鍵檔案

- `scripts/kingdom-sim.mjs` — 921 行，legitimate 模擬驅動，含相位 A-E + 全 anomaly check
- `docs/KINGDOM-SIM-RESULT.md` — 11KB，第一次模擬完整報告（含各目標數字、balance wall 清單）
- `scripts/kingdom-sim.mjs --probe` — 快速驗證現有經濟狀態，30 秒

## 下個 session 起手

1. `cd "C:/Users/ray/Desktop/Claude code/mega-idle-web-pixel"`
2. 殺 zombie node（`powershell Get-CimInstance Win32_Process | ? commandline -like '*offline-test*' | stop`）
3. `node scripts/kingdom-sim.mjs --probe` 確認 balance 改動正常
4. 補深淵 dispatch loop 到 `scripts/kingdom-sim.mjs`，重跑 `--maxTicks=500000` 驗證全 max 可達
5. `git add src/expeditions.js src/data.js && git commit`（compression=0）然後推 GH Pages
