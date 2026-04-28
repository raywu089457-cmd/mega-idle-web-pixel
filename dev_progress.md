---
name: dev_progress
description: mega-idle-web 開發進度追蹤
type: project
---

# mega-idle-web 開發進度

## 最後更新: 2026-04-26

## 系統狀態

| 系統 | Tier | 狀態 | 備註 |
|------|------|------|------|
| save-system | 0 | ✅ 完成 | js/data/saveManager.js |
| pwa | 0 | ✅ 完成 | manifest.json + sw.js |
| resource-system | 1 | ✅ 完成 | js/systems/resourceSystem.js |
| hero-system | 2 | ✅ 完成 | js/systems/heroSystem.js |
| shop-system | 3 | ✅ 完成 | js/systems/shopSystem.js |
| map-system | 3 | ✅ 完成 | js/systems/mapSystem.js |
| offline-system | 3 | ✅ 完成 | js/systems/offlineSystem.js |
| tick-system | 4 | ✅ 完成 | js/main.js (整合) |
| visual-canvas | 5 | ✅ 完成 | js/ui/canvasRenderer.js |
| visual-ui panels | 5 | ✅ 完成 | Resources/Heroes/Building/Map/Shop 面板 |
| monument-system | 2 | ✅ 完成 | 已整合在 resourceSystem |

## 已完成工作

- [x] CLAUDE.md 初始化
- [x] MEMORY.md 初始化
- [x] project_overview.md 建立
- [x] dev_progress.md 建立
- [x] saveManager.js 實現（IndexedDB）
- [x] gameData.js 實現（初始資料定義）
- [x] resourceSystem.js 實現（資源 CRUD + 生產）
- [x] heroSystem.js 實現（領土 + 漫遊英雄 AI）
- [x] shopSystem.js 實現（商店購買、製作）
- [x] mapSystem.js 實現（地圖探索）
- [x] offlineSystem.js 實現（8小時離線計算）
- [x] main.js 實現（遊戲主迴圈 + 初始化）
- [x] index.html 實現（遊戲入口 + UI 結構 + 面板系統）
- [x] css/style.css 實現（Medieval Fantasy 主題 + 面板樣式）
- [x] manifest.json 實現（PWA 配置）
- [x] sw.js 實現（Service Worker 離線支援）
- [x] canvasRenderer.js 實現（Canvas 視覺渲染）
- [x] UI 面板實現（Resources/Heroes/Building/Map/Shop）
- [x] 目錄結構創建（js/data, js/systems, js/ui, js/utils, css, assets）

## 驗收標準 (SPEC §11)

| 標準 | 狀態 |
|------|------|
| 純 HTML + JS，無需建構即可運行 | ✅ |
| 每秒 tick 產出 1-3 個材料（5 種） | ✅ |
| 每秒英雄戰鬥結算 | ✅ |
| 存檔到 IndexedDB，每 30 秒自動存 | ✅ |
| 離線回推，上限 8 小時 | ✅ |
| PWA 可安裝到桌面 | ✅ |
| GitHub Pages 發布 | ❌ 待部署 |

## 關鍵規格差異

- **Tick 間隔**: 1 秒（spec 2026-04-26）
- **每 tick 產出**: 1-3 個每種材料（隨機）
- **Auto-save**: 每 30 秒

## 資源類型

| ID | 名稱 | 初始值 | 容量 |
|----|------|--------|------|
| gold | 金幣 | 500 | 10,000 |
| magicStones | 遠古魔法石 | 0 | 999 |
| fruitPoor | 劣等水果 | 0 | 500 |
| waterDirty | 髒水 | 0 | 500 |
| woodRotten | 腐朽木頭 | 0 | 500 |
| ironRusty | 鏽跡斑斑的鐵 | 0 | 500 |
| herbLow | 低等藥材 | 0 | 500 |
