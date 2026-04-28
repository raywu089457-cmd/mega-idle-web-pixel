# Claude Code — mega-idle-web (Mobile Edition)

> 瀏覽器閒置王國建設遊戲。純 HTML + Canvas + JavaScript，無需建構工具。
> 本版本針對**手機/平板 PWA** 進行優化，與電腦版平行開發。

## 技術棧

| 層 | 技術 | 理由 |
|---|------|-----|
| 渲染 | Canvas 2D API | 原生支援，無需額外庫 |
| UI | DOM + CSS (responsive) | 手機觸控優先 |
| 狀態 | Plain JS objects | 無需框架 |
| 存檔 | IndexedDB | 本地存檔，容量大 |
| PWA | manifest.json + Service Worker | 可安裝、離線支援 |
| 觸控 | Pointer Events + Swipe Gestures | 統一觸控/滑鼠 |
| 部署 | GitHub Pages | 免費，零維護 |

**無建構步驟。AI 可直接編輯 .html/.js 檔，無需編譯。**

## 專案結構

```
mega-idle-web-mobile/
├── index.html              # 單一 entry point，雙擊即可運行
├── manifest.json           # PWA manifest (192x192, 512x512 icons)
├── sw.js                   # Service Worker (v2 cache)
├── css/
│   └── style.css           # 所有樣式 (含手機響應式)
├── js/
│   ├── main.js             # 初始化、遊戲主迴圈 (含 background/foreground handling)
│   ├── data/
│   │   ├── saveManager.js  # IndexedDB 存讀刪
│   │   └── gameData.js     # 初始資料（建築/英雄/地圖/物品定義）
│   ├── systems/
│   │   ├── resourceSystem.js   # 資源 CRUD + 每秒產出
│   │   ├── heroSystem.js       # 領土 + 漫遊英雄 AI
│   │   ├── shopSystem.js       # 商店製作/購買
│   │   ├── mapSystem.js        # 地圖探索
│   │   └── offlineSystem.js    # 8小時離線計算
│   └── ui/
│       ├── canvasRenderer.js   # Canvas 繪製
│       ├── mobileCanvas.js     # 手機 Canvas 響應式管理
│       └── touchHandler.js     # 觸控/滑動/長按處理
└── assets/                 # 圖片（可選）
```

## 核心遊戲循環 (與電腦版相同)

```
每秒 tick → 材料產出(1-3/秒/material) + 英雄戰鬥結算 → 存檔
     ↓
商店消耗材料 → 金幣收入 → 升級建築/英雄
```

## 手機專有功能

| 功能 | 說明 |
|------|------|
| **暫停/恢復** | 可視為背景時自動暫停，節省電量 |
| **滑動手勢** | 向右滑動關閉面板 |
| **長按檢測** | 44px 最小觸控區域 (Apple HIG) |
| **離線 earnings** | APP 恢復時顯示中斷期間的產出 |
| **安全區域** | 支援 iPhone X+ 的 safe area insets |
| **響應式面板** | 面板由底部往上滑，全螢幕顯示 |

## 存檔格式

- **Storage**: IndexedDB
- **Key**: `idleKingdomSave`
- **Auto-save**: 每 30 秒
- **Background save**: APP 進入背景時立即存檔

## 開發約定

- 單一 HTML 入口，雙擊即可運行
- 所有 JS 模組化存放於 `js/` 目錄
- Canvas 負責浮動數字/動畫，DOM 負責 UI 面板
- PWA 可安裝到桌面
- 與電腦版共享相同的遊戲系統（無 DOM 依賴）

## 已知差異 (vs 電腦版)

| 功能 | 電腦版 | 手機版 |
|------|--------|--------|
| 面板方向 | 由右側滑入 | 由底部往上 (全螢幕) |
| 輸入方式 | 點擊 + 滑鼠 | 觸控優先 (pointer events) |
| 背景處理 | 無 | visibilitychange 暫停/恢復 |
| 離線計算 | 30秒 check | 立即存檔 + timestamp delta |

## UI 設計規範（必須嚴格遵守）

> **重要**：所有 UI 修改與開發必須依據 `docs/straw-valley-DESIGN.md` 執行，**嚴格禁止超出規範以外自由發揮**。

設計規範核心要點：
- **色彩**：UI 框架 Rich Soil Brown (`#5d4037`)、木質面板 Warm Wood (`#8b5a2b`)、高亮 Golden Wheat (`#f4d03f`)
- **字體**：遊戲 UI 用 Press Start 2P (像素字體)、正文對話用 Lora serif
- **間距**：8px 網格對齊、48px 背包格子、44px 最小觸控區
- **圓角**：0px（90度直角，像素風格）
- **陰影**：無漸層、無模糊，用邊框對比營造深度
- **紋理**：木紋/石紋邊框、羊皮紙背景

違反規範的 UI 修改將被拒絕。

## 記憶體

- @MEMORY.md — 記憶索引
- @memory/mega-idle-web-mobile-implementation.md — 手機版實作記錄

## 部署

| 環境 | URL | 說明 |
|------|-----|------|
| **GitHub Pages** | https://raywu089457-cmd.github.io/mega-idle-web-pixel/ | 主要發布地址 |
| **獨立 Repo** | https://github.com/raywu089457-cmd/mega-idle-web-pixel | 程式碼同步到此 |

**push 設定（已寫入 git config）：**
```bash
git config push.default current          # 預設推送行為
git config remote.web.push +HEAD:refs/heads/main  # web remote 推送 HEAD → main
```
日後直接 `git push` 就會推到 `mega-idle-web-pixel` 這個獨立 repo。

## 修改代碼安全規範

> 降低「修 A 壞 B」出錯率的核心原則。

### 1. 先讀再改 — 理解上下文再動手

修改前必做：
- 讀完整個函數/模塊，不只是目標行
- 用 `Grep` 搜尋所有引用點，理解影響範圍
- 確認依賴關係（誰調用它，它調用誰）

### 2. 小步快跑 — 每次只改一件事

每次修改不超過：
- 1 個檔案（或強相關的 2-3 個）
- 10-20 行實質變動
- 1 個明確目的

避免「順手重構」和「順便優化」。

### 3. 改完立即驗證，不要一口氣改完再去測

```
讀 → 改 → 驗證這處改對了 → 再讀下一處
```

驗證方法（按場景）：
- **JS**: 在瀏覽器 console 測基本邏輯
- **簡單函數**: 手動 trace 幾個 input/output
- **有測試**: 先跑測試確認沒壞

### 4. 使用 `replace_all` 時格外小心

`replace_all` 會同步修改所有出現點，風險極高：
- 先用 `Grep` 看有多少處匹配
- 確認所有匹配都是預期要改的
- 考慮分批處理，而非一次全部替換

### 5. 避免在陌生區域做重構

對不熟悉的程式碼：
- 只做最小的功能修復
- 不做縮排、格式、變數命名等「看起來沒關係」的改動
- 標記 `// TODO: 這段需要重構` 留給未來

### 6. 善用 Tools 而非記憶

| Tool | 用途 |
|------|------|
| `Grep -n true` | 找到精確行號，防止改錯位置 |
| `Read limit=N offset=M` | 讀取目標區域的完整上下文 |
| `Glob` | 確認所有相關檔案 |

### 7. 核心心態：保守估計，小心驗證

> 當不確定時，選擇更小的改動範圍，而不是更大的重構。
