---
name: project_overview
description: mega-idle-web-pixel 專案概述
type: project
---

# mega-idle-web-pixel 專案概述

## 專案性質

瀏覽器獵魔村經營遊戲（Hunter Village Tycoon 原創致敬版 — 手機優化版）。

## 技術棧

- **渲染**: Canvas 2D API（主場景 + 飄字/粒子）
- **UI**: DOM + CSS（響應式、手機觸控優先）
- **狀態**: Plain JS objects
- **存檔**: localStorage（key=`kingdomBuilderSave`，v2 遷移）
- **PWA**: manifest.json + Service Worker（hunter-village-v10）
- **部署**: GitHub Pages
- **無建構步驟**: 單一 `index.html`（約 3050 行），雙擊直接運行

## 架構特徵

- **單一 HTML 模式**：所有 JS 內嵌於 `index.html`，無 js/ 目錄
- 設計規範：`docs/straw-valley-DESIGN.md`
- UI 色彩：Rich Soil Brown (#5d4037)、Warm Wood (#8b5a2b)、Golden Wheat (#f4d03f)
- 字體：Press Start 2P（遊戲 UI）+ Lora serif（正文對話）

## 核心循環

```
每秒 tick → 公會素材產出 + 市集金幣 + 煉金藥水 → 流浪獵人/招募/派遣狩獵 → 戰鬥結算 → 存檔
```

## 系統模組

- Guild System — 每秒隨機產生素材（獸肉/清泉/木材/鐵礦/藥草）
- Hunter System — 村莊獵人 + 流浪獵人，含星級、特質、疲勞、戰鬥/休息/喝藥水
- Craft System — 鐵匠鋪/皮甲工坊製作裝備，煉金工房自動產藥水
- Hunt System — 五個獵場、驅逐/討伐/獵殺/頭目、Boss 解鎖下一獵場
- Legacy System — 成就永久加成、每日登入、魔域大君後村莊重建
- Offline/Save System — 8小時離線收益；localStorage + `pagehide`/`visibilitychange` 存檔

## GitHub Pages

- GitHub Actions workflows 已設定（redeploy workflow + Pages deployment）
- 當前分支：master
