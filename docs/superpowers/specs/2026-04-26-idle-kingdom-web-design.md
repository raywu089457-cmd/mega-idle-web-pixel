# Idle Kingdom Builder — Web Prototype Design

> **Status**: Approved
> **Author**: Claude Code
> **Date**: 2026-04-26
> **Project**: mega-idle-web

---

## 1. Overview

A browser-based idle kingdom builder prototype using pure HTML + Canvas + JavaScript. No build tools required — files can be opened directly in a browser or served via GitHub Pages with PWA support.

**Core Loop:**
```
每秒 tick → 材料產出(1-3/秒/material) + 英雄戰鬥結算 → 存檔
     ↓
商店消耗材料 → 金幣收入 → 升級建築/英雄
```

---

## 2. Tech Stack

| Layer | Technology | Justification |
|-------|-------------|---------------|
| Renderer | Canvas 2D API | 無需額外庫，原生支援 |
| UI | DOM + CSS (inline in HTML) | 最快開發，事件處理簡單 |
| State | Plain JS objects | 無需框架 |
| Save | IndexedDB (idb-keyval pattern) | 本地存檔，容量大 |
| PWA | manifest.json + Service Worker | 可安裝，離線支援 |
| Deploy | GitHub Pages | 免費，零維護 |

**No build step.** AI 可直接編輯 .html/.js 檔，無需編譯、除錯容易。

---

## 3. File Structure

```
mega-idle-web/
├── index.html              # 單一 entry point，雙擊即可運行
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker（快取 + 離線）
├── css/
│   └── style.css           # 所有樣式
├── js/
│   ├── main.js             # 初始化、遊戲主迴圈
│   ├── data/
│   │   ├── saveManager.js  # IndexedDB 存讀刪
│   │   └── gameData.js     # 初始資料（建築/英雄/地圖定義）
│   ├── systems/
│   │   ├── resourceSystem.js   # 資源 CRUD
│   │   ├── monumentSystem.js   # 每秒產出 1-3 materials
│   │   ├── heroSystem.js       # 英雄狀態與戰鬥
│   │   ├── shopSystem.js       # 材料→金幣
│   │   ├── mapSystem.js        # 探索系統
│   │   └── offlineSystem.js    # 8小時上限離線計算
│   ├── ui/
│   │   ├── uiManager.js    # DOM panel 切換
│   │   └── canvasRenderer.js  # Canvas 繪製（浮動數字/動畫）
│   └── utils/
│       └── math.js         # 公式、亂數
└── assets/                 # 圖片（可選）
```

---

## 4. Tick System (每秒結算)

### 4.1 Resource Production (每秒)

```javascript
// 每秒每 material 隨機 1-3 個
const produced = Math.floor(Math.random() * 3) + 1;
resources[materialType] += produced;
```

### 4.2 Hero Combat Resolution (每秒)

```javascript
// 每英雄每 tick 結算一回合
// Wandering heroes: 自動戰鬥，產出金幣
// Territory heroes: 探索進度推進
```

### 4.3 Shop Auto-Purchase (每秒)

```javascript
// 漫遊英雄每 tick 有機會購買
// 購買後：materials -= cost; gold += salePrice;
```

### 4.4 Save Check (每 30 秒)

```javascript
if (gameTime % 30 === 0) saveManager.save(gameState);
```

---

## 5. Resources

| ID | 名稱 | 初始值 | 容量 |
|----|------|--------|------|
| `gold` | 金幣 | 500 | 10,000（可擴展） |
| `magicStones` | 遠古魔法石 | 0 | 999 |
| `fruitPoor` | 劣等水果 | 0 | 500 |
| `waterDirty` | 髒水 | 0 | 500 |
| `woodRotten` | 腐朽木頭 | 0 | 500 |
| `ironRusty` | 鏽跡斑斑的鐵 | 0 | 500 |
| `herbLow` | 低等藥材 | 0 | 500 |

---

## 6. Systems Detail

### 6.1 Monument System

- 每秒隨機產生 1-3 個每種材料
- 升級後產量倍率增加
- 等級上限：10

### 6.2 Hero System

**領土英雄（Territory）:**
- 初始 3 槽位，最多 10
- 可派遣探索地圖
- 消耗金幣訓練

**漫遊英雄（Wandering）:**
- 每 2 分鐘自動生成
- 60% 戰鬥 / 30% 購買 / 10% 離開
- 戰鬥勝利：金幣收入（80%）+ 魔法石（20% 繳回王國）

### 6.3 Shop System

- 消耗 5 種材料製造物品
- 漫遊英雄自動購買
- 購買後：金幣進入王國庫

### 6.4 Map System

- 初始 1 區，解鎖後開新區
- 難度遞增
- 領土英雄探索，獲得金幣/材料/魔法石

### 6.5 Offline System

```javascript
// 玩家回來時計算
const now = Date.now();
const lastOnline = saveData.lastOnline;
const offlineSeconds = Math.min((now - lastOnline) / 1000, 8 * 3600);

// 套用離線產出（不稀釋）
const offlineMaterials = offlineSeconds * averageProductionPerSecond;
```

---

## 7. Save System

- **Storage**: IndexedDB
- **Auto-save**: 每 30 秒
- **Manual save**: UI 按鈕觸發
- **Key**: `idleKingdomSave`

**Save Data Structure:**
```javascript
{
  version: 1,
  lastOnline: timestamp,
  resources: { gold, magicStones, materials... },
  heroes: [...],
  buildings: [...],
  mapProgress: { zone: number, cleared: [] },
  monumentLevel: number,
  shopLevel: number
}
```

---

## 8. PWA Configuration

**manifest.json:**
```json
{
  "name": "Idle Kingdom Builder",
  "short_name": "IdleKingdom",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#6366f1",
  "icons": [...]
}
```

**sw.js:**
- 快取所有靜態資源
- 離線時仍可運行（遊戲邏輯全客戶端）

---

## 9. UI Layout

```
┌─────────────────────────────────────┐
│  [金幣] [石頭] [材料圖示×5]    ⚙️  │  ← 頂部狀態列
├─────────────────────────────────────┤
│                                     │
│         Canvas 遊戲區域              │  ← 主要視覺區
│     (浮動數字 / 英雄移動 / etc)      │
│                                     │
├─────────────────────────────────────┤
│  [資源] [英雄] [商店] [地圖] [存檔] │  ← 底部導航
└─────────────────────────────────────┘
```

---

## 10. Deployment

| 環境 | URL 格式 | 用途 |
|------|----------|------|
| Local | `file://.../index.html` | 雙擊直接運行 |
| GitHub Pages | `https://[user].github.io/[repo]/` | 分享/測試 |

**部署流程（AI 可全自動）：**
1. `git push` 到 GitHub
2. GitHub Actions 自動發布到 Pages
3. 玩家開 URL 即可遊玩

---

## 11. Acceptance Criteria

- [ ] 純 HTML + JS，無需建構即可運行
- [ ] 每秒 tick 產出 1-3 個材料（5 種）
- [ ] 每秒英雄戰鬥結算
- [ ] 存檔到 IndexedDB，每 30 秒自動存
- [ ] 離線回推，上限 8 小時
- [ ] PWA 可安裝到桌面
- [ ] GitHub Pages 發布

---

## 12. Open Questions

None — all resolved during brainstorming.