# Claude Code — mega-idle-web

> 瀏覽器閒置王國建設遊戲。純 HTML + Canvas + JavaScript，無需建構工具。

## 技術棧

| 層 | 技術 | 理由 |
|---|------|-----|
| 渲染 | Canvas 2D API | 原生支援，無需額外庫 |
| UI | DOM + CSS (inline) | 最快開發 |
| 狀態 | Plain JS objects | 無需框架 |
| 存檔 | IndexedDB (idb-keyval pattern) | 本地存檔，容量大 |
| PWA | manifest.json + Service Worker | 可安裝，離線支援 |
| 部署 | GitHub Pages | 免費，零維護 |

**無建構步驟。AI 可直接編輯 .html/.js 檔，無需編譯。**

## 專案結構

```
mega-idle-web/
├── index.html              # 單一 entry point，雙擊即可運行
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   └── style.css           # 所有樣式
├── js/
│   ├── main.js             # 初始化、遊戲主迴圈（所有系統整合）
│   ├── data/
│   │   ├── saveManager.js  # IndexedDB 存讀刪
│   │   └── gameData.js    # 初始資料（建築/英雄/地圖/物品定義）
│   └── systems/
│       ├── resourceSystem.js   # 資源 CRUD + 每秒產出
│       ├── heroSystem.js       # 領土 + 漫遊英雄 AI
│       ├── shopSystem.js       # 商店製作/購買
│       ├── mapSystem.js        # 地圖探索
│       └── offlineSystem.js    # 8小時離線計算
└── assets/                 # 圖片（可選）
```

## 核心遊戲循環

```
每秒 tick → 材料產出(1-3/秒/material) + 英雄戰鬥結算 → 存檔
     ↓
商店消耗材料 → 金幣收入 → 升級建築/英雄
```

## 存檔格式

- **Storage**: IndexedDB
- **Key**: `idleKingdomSave`
- **Auto-save**: 每 30 秒

## 開發約定

- 單一 HTML 入口，雙擊即可運行
- 所有 JS 模組化存放於 `js/` 目錄
- Canvas 負責浮動數字/動畫，DOM 負責 UI 面板
- PWA 可安裝到桌面

## 現有文件參考

- @docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md — 已批准的設計規格

## 記憶體

- @MEMORY.md — 記憶索引
