---
name: project_overview
description: mega-idle-web-pixel 專案概述
type: project
---

# mega-idle-web-pixel 專案概述

## 專案性質

瀏覽器閒置王國建設遊戲（Idle Kingdom Builder Web — 手機優化版）。

## 技術棧

- **渲染**: Canvas 2D API
- **UI**: DOM + CSS（響應式、手機觸控優先）
- **狀態**: Plain JS objects
- **存檔**: IndexedDB
- **PWA**: manifest.json + Service Worker
- **部署**: GitHub Pages
- **無建構步驟**: 純 HTML + JS（約 2274 行），雙擊直接運行

## 架構特徵

- **單一 HTML 模式**：所有 JS 內嵌於 `index.html`，無 js/ 目錄
- 設計規範：`docs/straw-valley-DESIGN.md`
- UI 色彩：Rich Soil Brown (#5d4037)、Warm Wood (#8b5a2b)、Golden Wheat (#f4d03f)
- 字體：Press Start 2P（遊戲 UI）+ Lora serif（正文對話）

## 核心循環

```
每秒 tick → 材料產出(1-3/秒/material) + 英雄戰鬥結算 + 商店自動生產 → 存檔
```

## 系統模組

- Monument System — 每秒隨機產生 1-3 個每種材料
- Hero System — 領土英雄（7槽）+ 漫遊英雄（10槽）+ 戰鬥/休息/喝藥水
- Shop System — 材料製造、購買、藥水鋪自動生產
- Map System — 地圖探索、難度選擇、Boss 戰
- Offline System — 8小時離線計算
- Save System — IndexedDB + background save（visibilitychange 觸發）

## GitHub Pages

- GitHub Actions workflows 已設定（redeploy workflow + Pages deployment）
- 當前分支：master
