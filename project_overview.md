---
name: project_overview
description: 瀏覽器閒置王國建設遊戲 mega-idle-web 專案概述
type: project
---

# mega-idle-web 專案概述

## 專案性質

瀏覽器閒置王國建設遊戲（Idle Kingdom Builder Web）。

## 技術棧

- **渲染**: Canvas 2D API
- **UI**: DOM + CSS (inline)
- **狀態**: Plain JS objects
- **存檔**: IndexedDB
- **PWA**: manifest.json + Service Worker
- **部署**: GitHub Pages
- **無建構步驟**: 純 HTML + JS，可直接雙擊運行

## 核心循環

每秒 tick → 材料產出(1-3/秒/material) + 英雄戰鬥結算 → 存檔

## 資源類型

| ID | 名稱 | 初始值 |
|----|------|--------|
| gold | 金幣 | 500 |
| magicStones | 遠古魔法石 | 0 |
| fruitPoor | 劣等水果 | 0 |
| waterDirty | 髒水 | 0 |
| woodRotten | 腐朽木頭 | 0 |
| ironRusty | 鏽跡斑斑的鐵 | 0 |
| herbLow | 低等藥材 | 0 |

## 系統模組

- Monument System — 每秒隨機產生 1-3 個每種材料
- Hero System — 領土英雄 + 漫遊英雄
- Shop System — 材料製造與購買
- Map System — 地圖探索
- Offline System — 8小時離線計算

## 設計文件

- `docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md` — 已批准的設計規格

## 當前狀態

初始化階段，剛建立 CLAUDE.md 和 MEMORY.md。
