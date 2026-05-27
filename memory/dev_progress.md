---
name: dev_progress
description: mega-idle-web-pixel 開發進度追蹤（最新）
type: project
---

# mega-idle-web-pixel 開發進度

## 最後更新: 2026-05-28

## 架構型態

**單一 HTML 模式** — 所有 JS 內嵌於 `index.html`（2274 行），無 js/ 目錄。移除 js/ 模組版的 refactor 已完成（commit c396d4b）。

## 系統狀態

| 系統 | 狀態 | 說明 |
|------|------|------|
| Resource System | ✅ | 材料 CRUD、每秒產出、容量 |
| Building System | ✅ | 紀念碑等建築升級 |
| Hero System | ✅ | 領土 + 漫遊英雄、戰鬥系統、休息喝藥水 |
| Shop System | ✅ | 商店製作/購買、藥水鋪自動生產 |
| Map System | ✅ | 地圖探索、難度選擇、Boss |
| Offline System | ✅ | 離線計算（上限 8 小時） |
| Save System | ✅ | IndexedDB 存讀 |
| PWA | ✅ | manifest.json + Service Worker |
| Tick Loop | ✅ | 每秒 tick 一次，auto-save 每 10 秒 |

## 核心循環（已實作）

```
每秒 tick → 隨機產出 1-3 個材料/種 → 漫遊英雄戰鬥/購買/休息結算
         → 領土英雄探索推進（每 5 ticks 結算一回合）
         → 商店自動生產（藥水鋪）
         → 面板刷新 → HUD 更新
```

## 實作亮點（偏離原 spec 已實作的功能）

- **領土英雄探索中 HP≤1 時優先使用背包藥水**：戰鬥失敗後立即消耗背包藥水康復至 30%（探索中觸發，非等待回領地後）
- **領土英雄休息自動喝藥水**：HP < 50% + 背包有藥水，每 5 ticks 消耗 1 瓶回 30% HP（079d2b3）
- **XP 進度條**：英雄卡顯示 XP 進度條（256c5fb）
- **物品系統**：掉落、穿戴、切換裝備（47a2cdc）
- **難度選擇**：openDifficultyModal 指定 zoneId（dfbb4d3）
- **戰鬥報告面板**：延後顯示、展開詳情（5f7b56a）
- **領土英雄數量**：7 個領土槽 + 10 個漫遊槽（737e235）
- **漫遊英雄三向系統**：戰鬥 / 購買消耗品 / 休息（9fee062）
- **城堡等級**：根據城堡等級縮放英雄上限（737e235）
- **背景/前景處理**：visibilitychange 自動暫停存檔（init 2256-2268）

## 驗收標準 (SPEC)

| 標準 | 狀態 |
|------|------|
| 純 HTML + JS，無需建構即可運行 | ✅ |
| 每秒 tick 產出 1-3 個材料（5 種） | ✅ |
| 每秒英雄戰鬥結算 | ✅（每 5 ticks 結算一回合） |
| 存檔到 IndexedDB，每 N 秒自動存 | ✅（每 10 秒） |
| 離線回推，上限 8 小時 | ✅ |
| PWA 可安裝到桌面 | ✅ |
| GitHub Pages 發布 | ✅（GitHub Actions workflows 已設定） |

## Git 統計

- 總提交數：96 個（自 2026-04 起）
- 當前分支：master
- 最新提交：079d2b3（refactor: 領地英雄自動喝藥水改為消耗自身背包內的藥水）

## 資源定義

- 金幣初始化：500
- 材料容量：500
- 魔法石容量：999

## 待追蹤

- [ ] 手機版 pixel-perfect UI 完全對齊設計規範（`docs/straw-valley-DESIGN.md`）
- [ ] GitHub Pages 實際部署驗證
- [ ] PWA 離線實際運行驗證
