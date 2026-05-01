# Handover Document — mega-idle-web-pixel

> 瀏覽器閒置王國建設遊戲。純 HTML + Canvas + JavaScript，無需建構工具。
> 部署：https://raywu089457-cmd.github.io/mega-idle-web-pixel/

---

## 專案架構

### 單一 entry point
所有遊戲邏輯在 `index.html`（~1700 行），雙擊即可運行，無需建構。

```
mega-idle-web-pixel/
├── index.html              # 遊戲本體（所有系統整合）
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker (快取策略)
├── css/style.css            # 樣式（少量，大部分用 inline style）
└── docs/
    ├── straw-valley-DESIGN.md   # UI 設計規範（必須嚴格遵守）
    └── HANDOVER.md             # 本交接文檔
```

### 存檔機制
- **Storage**: `localStorage`（key: `kingdomBuilderSave`）
- **Auto-save**: 每 10 秒
- **儲存格式**: JSON，包含 version、lastOnline、resources、heroes、wanderingHeroes、buildings、mapProgress、shopInventory、tickCount

---

## 系統清單（index.html 行號區間）

| 系統 | 行號 | 職責 |
|------|------|------|
| HERO TYPES / DEFAULT STATE | 400–567 | 英雄資料結構、WANDERING_HERO_TYPES、getDefaultGameState() |
| RESOURCE SYSTEM | 569–616 | 資源 CRUD、產出監聽 |
| BUILDING SYSTEM | 618–648 | 建築升級、城堡，等級影響英雄欄位數量 |
| **HERO SYSTEM** | 649–900 | 領地/流浪英雄管理、訓練、招募、戰鬥、休息 |
| SHOP SYSTEM | 906–928 | 合成系統 |
| MAP SYSTEM | 934–970 | 地圖區域、解鎖進度 |
| OFFLINE SYSTEM | 979–998 | 離線收益計算 |
| SAVE MANAGER | 1052–1093 | localStorage 存讀 |
| FLOAT CANVAS | 1096–1130 | Canvas 飄字動畫（攻擊數字等） |
| UI / RENDER | 1132–1640 | DOM 面板渲染（資源/英雄/建築/地圖/商店/戰報/設定） |
| GAME LOOP | 1625–1640 | gameTick() 每秒結算 + init() 初始化 |
| EVENT DELEGATION | ~1319 | 所有動態 DOM 點擊透過單一 listener |

---

## 當前遊戲狀態（最新 commit: 737e235）

### 英雄欄位計算
```
領地英雄上限 = 7 + (城堡等級 - 1) * 2
流浪英雄上限 = 10 + (城堡等級 - 1) * 3

函式：
BuildingSystem_getTerritoryHeroSlots(currentCount = 0)
BuildingSystem_getWanderingHeroSlots(currentCount = 0)
BuildingSystem_getMaxWanderingHeroes() → 回傳流浪英雄上限（透過 getWanderingHeroSlots）
```

### 戰報系統
- 戰報展開：點擊 `.report-head`（event delegation），同一時間只展開一個
- 戰報內容：中文，顯示每回合傷害、戰鬥結果、金幣/魔石獎勵
- `.report-entry` margin-bottom: 6px（行 244）

### 休息機制（領地 + 流浪通用）
- 觸發：HP <= 最大 HP 的 10%（`h.hp <= (h.maxHp || 100) * 0.1`）
- 恢復：每 tick +0.1% 最大 HP
- 離開休息：HP 回到 80% 以上 (`h.hp >= (h.maxHp || 100) * 0.8`)
- `HeroSystem_processRestingTick()` 統一路由（行 888）

### 每秒戰鬥結算（territoryCombats / wanderingCombats）
- 每 tick 處理一回合（最多 10 回合），战報在戰鬥結束後一次生成
- 兩邊都結束戰鬥 → 產生戰報（`addBattleReport(heroName, zoneName, result, rewards, combatLog)`）

---

## 近期修改紀錄（可用於回溯 bug）

| Commit | 說明 |
|--------|------|
| `737e235` | feat: 7 領地 + 10 流浪英雄欄位，城堡等級加成 |
| `4c9f3f7` | fix: 統一流浪/領地英雄休息機制 |
| `5f7b56a` | feat: 每秒一回合戰鬥，延後戰報生成 |
| `66ef57e` | fix: 翻譯戰報戰鬥日誌為中文 |
| `0480a2a` | fix: 移除 report-head 的 inline onclick，改用 event delegation |
| `dd2ae00` | fix: 戰報按鈕字體大小、單一展開行為 |
| `54d2912` | fix: 分開英雄分頁顯示、保留戰報展開狀態 |
| `2900dd2` | fix: 戰報正確傳遞 combatLog 並展開顯示 |
| `6f323e4` | ci: redeploy workflow 加入 permissions（id-token: write） |

---

## 開發約定與陷阱

### 1. 不要用 inline onclick
動態生成的 DOM（如英雄卡片、戰報）使用 event delegation：
```javascript
// ✅ 正確：document 層級統一監聽
document.addEventListener('click', e => {
  const head = e.target.closest('.report-head');
  if (head) { toggleReportExpand(...); return; }
  // ...
});

// ❌ 錯誤：inline onclick 會與 delegation 衝突
<div class="report-head" onclick="toggleReportExpand(...)">
```

### 2. 英雄欄位要傳 currentCount
`BuildingSystem_getTerritoryHeroSlots()` 和 `BuildingSystem_getWanderingHeroSlots()` 的參數是「當前英雄數量」，用於顯示 `current/max`。

### 3. 存檔 key 不一致會導致無法存檔
- 曾經出錯：遊戲實際存 IndexedDB 但 reset 按鈕清 localStorage
- 當前正確：`localStorage` key = `kingdomBuilderSave`

### 4. 不要在陌生區域做重構
對不熟悉的程式碼：只做最小修復，不做縮排/格式/命名等「看起來沒關係」的改動。

### 5. 修改後立即驗證
不要一口氣改完多處再去測，每次只改一個明確的目的。

---

## UI 設計規範（重要）

所有 UI 修改**必須**依據 `docs/straw-valley-DESIGN.md` 執行，嚴格禁止超出規範自由發揮。

核心規範：
- **色彩**：Rich Soil Brown (`#5d4037`)、Warm Wood (`#8b5a2b`)、Golden Wheat (`#f4d03f`)
- **字體**：Press Start 2P（遊戲 UI）、Lora serif（正文對話）
- **間距**：8px 網格對齊、48px 背包格子、44px 最小觸控區
- **圓角**：0px（90 度直角，像素風格）
- **陰影**：無漸層、無模糊，用邊框對比營造深度
- **紋理**：木紋/石紋邊框、羊皮紙背景

---

## Git 與部署

### Workflow（.github/workflows/redeploy.yml）
- `workflow_dispatch`：手動觸發
- `push`：推送到 master 時自動部署
- 部署目標：https://raywu089457-cmd.github.io/mega-idle-web-pixel/

### 權限問題曾導致部署失敗
解決方法：加入 `permissions: id-token: write, contents: read, pages: write`

### 常用指令
```bash
rtk git add . && rtk git commit -m "訊息"
rtk git push
rtk gh run list --limit 3
```

---

## 等待完成的工作

目前沒有進行中的功能需求。如果要繼續開發，建議方向：
1. **裝備系統**：英雄穿戴裝備增加屬性
2. **成就系統**：達成特定里程碑獎勵
3. **每日登入獎勵**
4. **更多英雄技能**：被動技能、必殺技

---

## 聯絡與上下文

- 本專案為手機優先的 PWA 版本，與電腦版平行開發
- 電腦版位置：`mega-idle-web/`（不同的 repo）
- 設計規範：`docs/straw-valley-DESIGN.md`
- 本交接文檔：`docs/HANDOVER.md`