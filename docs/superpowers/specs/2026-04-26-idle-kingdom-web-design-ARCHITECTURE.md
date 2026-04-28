# Mega-Idle-Web — 48 Agent 遊戲開發架構

> **Project**: mega-idle-web
> **Spec**: 2026-04-26-idle-kingdom-web-design.md
> **Author**: Claude Code
> **Date**: 2026-04-26

---

## 1. 架構差異分析

### 原始遊戲工作室架構 vs 本專案

| 面向 | 原始架構 | 本專案 (mega-idle-web) |
|------|----------|------------------------|
| **引擎** | Unity / Godot / Unreal | 純 HTML + Canvas |
| **語言** | C# / GDScript / C++ | Vanilla JavaScript |
| **建構** | 需編譯 | 無需建構，AI 直接編輯 .html/.js |
| **渲染** | 引擎特定 | Canvas 2D API |
| **UI** | 引擎特定系統 | DOM + CSS inline |
| **存檔** | 自定義格式 | IndexedDB (idb-keyval) |
| **部署** | 各引擎發布流程 | GitHub Pages + PWA |
| **除錯** | 需 IDE + 引擎除錯器 | 瀏覽器開發者工具 |

### 核心影響

1. **無需引擎專家 Agent** — 不需要 unity-specialist、godot-specialist、unreal-specialist
2. **無需建構系統 Agent** — 不需要 build-error-resolver（對純 JS 意義不大）
3. **網頁特定 Agent 需求** — 需要 PWA、瀏覽器相容性、Canvas 效能專家
4. **除錯模式改變** — 使用瀏覽器開發者工具而非引擎除錯器

---

## 2. Agent 角色矩陣 (48 Agents)

### 2.1 核心開發 Agents (12)

| Agent | 角色 | 專門領域 |
|-------|------|----------|
| **lead-programmer** | 首席開發者 | 架構設計、代碼審核、流程協調 |
| **frontend-developer** | 前端開發者 | HTML/CSS/JS、DOM 操作、CSS 動畫 |
| **canvas-engineer** | Canvas 工程師 | Canvas 2D API、效能優化、動畫系統 |
| **web-performance** | 網頁效能工程師 | 瀏覽器效能、記憶體管理、60fps 優化 |
| **pwa-specialist** | PWA 專家 | Service Worker、快取策略、離線支援 |
| **ui-designer** | UI 設計師 | 用戶介面、CSS 樣式、響應式設計 |
| **gameplay-programmer** | 遊戲邏輯工程師 | 資源系統、英雄系統、商店系統 |
| **save-system-engineer** | 存檔系統工程師 | IndexedDB、存檔結構、版本遷移 |
| **math-formula-engineer** | 數學公式工程師 | 戰鬥公式、產出公式、乱數系統 |
| **tick-system-engineer** | Tick 系統工程師 | 遊戲主迴圈、時間結算、同步系統 |
| **offline-system-engineer** | 離線系統工程師 | 時間計算、離線產出、8小時上限 |
| **deploy-automation** | 部署自動化工程師 | GitHub Pages、GitHub Actions、PWA 發布 |

### 2.2 資料與系統 Agents (8)

| Agent | 角色 | 專門領域 |
|-------|------|----------|
| **data-architect** | 資料架構師 | 資源定義、英雄屬性、建築數據 |
| **balance-designer** | 平衡設計師 | 產出速率、價格設定、遊戲節奏 |
| **resource-system-dev** | 資源系統開發者 | 5 種材料、金幣、魔法石 CRUD |
| **hero-system-dev** | 英雄系統開發者 | 領土英雄、漫遊英雄、戰鬥結算 |
| **monument-system-dev** | 紀念碑系統開發者 | 每秒產出、升級倍率、等級上限 |
| **shop-system-dev** | 商店系統開發者 | 材料兌換金幣、自动购买逻辑 |
| **map-system-dev** | 地圖系統開發者 | 區域解鎖、難度遞增、探索進度 |
| **combat-resolution-dev** | 戰鬥結算開發者 | 戰鬥邏輯、獎勵計算、傷害公式 |

### 2.3 視覺與使用者體驗 Agents (8)

| Agent | 角色 | 專門領域 |
|-------|------|----------|
| **visual-artist** | 視覺藝術家 | 圖示設計、Canvas 繪圖、顏色配置 |
| **animation-engineer** | 動畫工程師 | 浮動數字動畫、英雄移動動畫、過場動畫 |
| **ui-layout-designer** | UI 佈局設計師 | 面板切換、導航設計、DOM 結構 |
| **css-stylist** | CSS 造型師 | 樣式設計、CSS 變數、主題配色 |
| **canvas-renderer** | Canvas 渲染師 | 遊戲區域繪製、圖層管理、效能優化 |
| **icon-designer** | 圖示設計師 | 資源圖示、英雄圖示、建築圖示 |
| **color-harmony** | 色彩調和師 | 主題配色、對比度、無障礙色彩 |
| **responsive-designer** | 響應式設計師 | 行動裝置、平板、桌面斷點 |

### 2.4 測試與品質 Agents (8)

| Agent | 角色 | 專門領域 |
|-------|------|----------|
| **test-automation** | 測試自動化工程師 | 單元測試、整合測試、瀏覽器相容性測試 |
| **e2e-testing** | E2E 測試專家 | Playwright、关键用户流程測試 |
| **browser-compat** | 瀏覽器相容性專家 | Chrome/Firefox/Safari/Edge 相容性 |
| **performance-tester** | 效能測試師 | Lighthouse、記憶體洩漏、fps 監控 |
| **save-validation** | 存檔驗證專家 | 存檔完整性、版本遷移、資料驗證 |
| **pwa-validation** | PWA 驗證專家 | manifest.json、Service Worker、離線測試 |
| **accessibility-audit** | 無障礙存取審計員 | WCAG、鍵盤導航、螢幕閱讀器 |
| **code-reviewer** | 程式碼審核員 | 程式碼品質、安全性、最佳實踐 |

### 2.5 營運與部署 Agents (6)

| Agent | 角色 | 專門領域 |
|-------|------|----------|
| **release-manager** | 發布經理 | 版本管理、發布檢查清單、GitHub Pages |
| **github-actions-dev** | GitHub Actions 開發者 | CI/CD 流程、自動化測試、自動化部署 |
| **analytics-integration** | 分析整合工程師 | 遊戲事件追蹤、使用者行為分析 |
| **monitoring-dashboard** | 監控儀表板工程師 | 效能監控、錯誤追蹤、使用者回饋 |
| **community-manager** | 社群經理 | 玩家回饋、Discord、論壇整合 |
| **documentation-writer** | 文件撰寫工程師 | README、API 文件、開發者文檔 |

### 2.6 特殊需求 Agents (6)

| Agent | 角色 | 專門領域 |
|-------|------|----------|
| **security-auditor** | 安全審計員 | XSS 防護、IndexedDB 安全、輸入驗證 |
| **progressive-web-app-audit** | PWA 審計員 | PWA 標準合規、安裝體驗、離線能力 |
| **localization-lead** | 本地化負責人 | 多語言支援、Unicode、文字方向 |
| **seo-specialist** | SEO 專家 | Meta 標籤、SEO、社交分享 |
| **data-privacy** | 資料隱私專家 | GDPR、Cookies、本地存檔隱私 |
| **whimsy-injector** | 趣味注入專家 | 遊戲彩蛋、動畫驚喜、玩家驚喜 |

---

## 3. 資料夾結構映射

```
mega-idle-web/
├── index.html                      ← lead-programmer, frontend-developer
├── manifest.json                   ← pwa-specialist, deploy-automation
├── sw.js                           ← pwa-specialist, service-worker-dev
├── css/
│   └── style.css                   ← ui-designer, css-stylist, responsive-designer
├── js/
│   ├── main.js                     ← lead-programmer, tick-system-engineer
│   ├── data/
│   │   ├── saveManager.js          ← save-system-engineer, save-validation
│   │   └── gameData.js             ← data-architect, balance-designer
│   ├── systems/
│   │   ├── resourceSystem.js       ← resource-system-dev
│   │   ├── monumentSystem.js       ← monument-system-dev
│   │   ├── heroSystem.js           ← hero-system-dev, combat-resolution-dev
│   │   ├── shopSystem.js           ← shop-system-dev
│   │   ├── mapSystem.js            ← map-system-dev
│   │   └── offlineSystem.js        ← offline-system-engineer
│   ├── ui/
│   │   ├── uiManager.js            ← ui-layout-designer, frontend-developer
│   │   └── canvasRenderer.js       ← canvas-renderer, canvas-engineer, animation-engineer
│   └── utils/
│       └── math.js                 ← math-formula-engineer
└── assets/                         ← visual-artist, icon-designer, color-harmony
```

---

## 4. 工作流程設計

### 4.1 單一檔案修改流程

```
User Request
    ↓
lead-programmer (分析需求)
    ↓
指定負責 Agent (如 hero-system-dev)
    ↓
程式碼撰寫
    ↓
code-reviewer (審核)
    ↓
accessibility-audit (無障礙檢查)
    ↓
完成
```

### 4.2 新系統開發流程

```
需求提出
    ↓
data-architect (設計資料結構)
    ↓
balance-designer (設計數值平衡)
    ↓
對應系統 Agent 開發 (如 hero-system-dev)
    ↓
canvas-renderer 開發對應視覺
    ↓
test-automation 撰寫測試
    ↓
e2e-testing 測試關鍵流程
    ↓
pwa-validation 驗證 PWA
    ↓
deploy-automation 部署
```

### 4.3 除錯流程

```
問題報告
    ↓
browser-compat (確認瀏覽器)
    ↓
performance-tester (分析效能)
    ↓
save-validation (檢查存檔)
    ↓
除錯修復
    ↓
regression test
    ↓
完成
```

---

## 5. 與原始架構的差異對照

### 5.1 移除的 Agent (15)

| Agent | 移除原因 |
|--------|----------|
| unity-specialist | 不使用 Unity |
| unity-ui-specialist | 不使用 Unity UI |
| unity-dots-specialist | 不使用 DOTS |
| unity-shader-specialist | 不使用 Unity 著色器 |
| unity-addressables-specialist | 不使用 Addressables |
| godot-specialist | 不使用 Godot |
| godot-gdscript-specialist | 不使用 GDScript |
| godot-csharp-specialist | 不使用 C# |
| godot-gdextension-specialist | 不使用 GDExtension |
| godot-shader-specialist | 不使用 Godot 著色器 |
| unreal-specialist | 不使用 Unreal |
| ue-blueprint-specialist | 不使用 Blueprint |
| ue-gas-specialist | 不使用 GAS |
| ue-replication-specialist | 不使用網路複製 |
| ue-umg-specialist | 不使用 UMG |
| cpp-build-resolver | 不使用 C++ 建構 |
| rust-reviewer | 不使用 Rust |
| java-build-resolver | 不使用 Java 建構 |

### 5.2 新增的 Agent (15)

| Agent | 新增原因 |
|--------|----------|
| canvas-engineer | Canvas 2D API 專業需求 |
| web-performance | 瀏覽器效能優化專業需求 |
| pwa-specialist | PWA + Service Worker 專業需求 |
| save-system-engineer | IndexedDB 存檔專業需求 |
| tick-system-engineer | 遊戲主迴圈專業需求 |
| offline-system-engineer | 離線計算專業需求 |
| deploy-automation | GitHub Pages 部署專業需求 |
| browser-compat | 跨瀏覽器相容性專業需求 |
| css-stylist | CSS 樣式專業需求 |
| canvas-renderer | Canvas 渲染專業需求 |
| animation-engineer | 動畫效果專業需求 |
| responsive-designer | 響應式設計專業需求 |
| github-actions-dev | CI/CD 自動化專業需求 |
| pwa-validation | PWA 驗證專業需求 |
| seo-specialist | 網頁 SEO 專業需求 |

### 5.3 改造的 Agent (18)

| 原始 Agent | 改造為 | 差異 |
|-----------|--------|------|
| game-designer | balance-designer | 專注數值平衡而非系統設計 |
| systems-designer | data-architect | 專注資料結構設計 |
| network-programmer | *(移除)* | 本專案無網路功能 |
| devops-engineer | deploy-automation | 簡化為 GitHub Pages 部署 |
| tech-debt | web-performance | 專注網頁效能而非引擎優化 |
| performance-analyst | performance-tester | 使用瀏覽器工具而非引擎分析 |
| qa-lead | test-automation | 自動化測試而非手動 QA |
| qa-tester | browser-compat | 專注瀏覽器相容性測試 |
| game-audio-engineer | *(移除)* | 本專案無音效 |
| sound-designer | *(移除)* | 本專案無音效 |
| accessibility-specialist | accessibility-audit | 專注網頁無障礙標準 |
| ux-designer | ui-layout-designer + responsive-designer | 分離為佈局與響應式 |
| level-designer | map-system-dev | 專注地圖系統而非等級設計 |
| world-builder | *(移除)* | 本專案為 2D 地圖 |
| narrative-director | *(移除)* | 本專案無敘事系統 |
| writer | documentation-writer | 改為文件撰寫 |
| security-engineer | security-auditor | 專注 Web 安全 |
| tools-programmer | github-actions-dev | 專注 CI/CD 工具 |

---

## 6. Agent 協作關係圖

```
                    ┌─────────────────┐
                    │ lead-programmer │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
│  核心開發群    │    │   資料系統群   │    │  視覺體驗群    │
│ (12 agents)   │    │  (8 agents)   │    │  (8 agents)   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌───────▼───────┐
                    │   測試品質群   │
                    │  (8 agents)   │
                    └───────────────┘
                             │
                    ┌───────▼───────┐
                    │  營運部署群    │
                    │  (6 agents)   │
                    └───────────────┘
```

---

## 7. 單一職責原則 (Single Responsibility)

每個 Agent 有明確的邊界：

| Agent | 職責範圍 | 檔案所有權 |
|-------|----------|-----------|
| **canvas-engineer** | Canvas 2D API 使用、效能優化 | canvasRenderer.js |
| **pwa-specialist** | Service Worker、快取、離線 | sw.js, manifest.json |
| **save-system-engineer** | IndexedDB 操作、版本遷移 | saveManager.js |
| **tick-system-engineer** | 遊戲主迴圈、時間同步 | main.js (loop 部分) |
| **resource-system-dev** | 資源 CRUD、容量檢查 | resourceSystem.js |
| **hero-system-dev** | 英雄狀態、AI 行為 | heroSystem.js |
| **combat-resolution-dev** | 戰鬥邏輯、傷害計算 | heroSystem.js (combat 部分) |
| **math-formula-engineer** | 公式定義、乱數包裝 | math.js |
| **offline-system-engineer** | 離線時間計算、產出回補 | offlineSystem.js |

---

## 8. 檔案與 Agent 對應矩陣

| 檔案 | 主要 Agent | 支援 Agent |
|------|-----------|------------|
| `index.html` | frontend-developer | lead-programmer, ui-layout-designer |
| `css/style.css` | css-stylist | responsive-designer, color-harmony |
| `js/main.js` | tick-system-engineer | lead-programmer |
| `js/data/saveManager.js` | save-system-engineer | save-validation, security-auditor |
| `js/data/gameData.js` | data-architect | balance-designer |
| `js/systems/resourceSystem.js` | resource-system-dev | math-formula-engineer |
| `js/systems/monumentSystem.js` | monument-system-dev | resource-system-dev |
| `js/systems/heroSystem.js` | hero-system-dev | combat-resolution-dev, math-formula-engineer |
| `js/systems/shopSystem.js` | shop-system-dev | resource-system-dev |
| `js/systems/mapSystem.js` | map-system-dev | hero-system-dev |
| `js/systems/offlineSystem.js` | offline-system-engineer | resource-system-dev |
| `js/ui/uiManager.js` | ui-layout-designer | frontend-developer |
| `js/ui/canvasRenderer.js` | canvas-renderer | canvas-engineer, animation-engineer |
| `js/utils/math.js` | math-formula-engineer | combat-resolution-dev |
| `sw.js` | pwa-specialist | web-performance |
| `manifest.json` | pwa-specialist | seo-specialist |
| `assets/*` | visual-artist | icon-designer, color-harmony |

---

## 9. 審核閘門 (Review Gates)

每個檔案修改需通過以下閘門：

### 9.1 邏輯檔案 (systems/*.js)
```
□ code-reviewer 審核
□ math-formula-engineer 公式檢查
□ performance-tester 效能檢查
□ save-validation (如涉及存檔)
```

### 9.2 視覺檔案 (ui/*.js, css/*.css)
```
□ code-reviewer 審核
□ accessibility-audit 無障礙檢查
□ responsive-designer 響應式檢查
□ browser-compat 瀏覽器測試
```

### 9.3 基礎設施 (sw.js, manifest.json)
```
□ pwa-specialist 審核
□ pwa-validation 驗證
□ security-auditor 安全檢查
```

---

## 10. 總結

mega-idle-web 的 48 Agent 架構是根據**純網頁遊戲**的特性完全客製化：

- **移除**：所有引擎特定 Agent（Unity/Godot/Unreal 相關）
- **新增**：網頁特定 Agent（Canvas、PWA、瀏覽器相容性）
- **改造**：遊戲引擎概念 → 網頁開發概念
- **簡化**：多系統 → 單一 HTML + JS 檔案結構

這個架構確保每個 Agent 的專業領域與網頁遊戲開發需求精確匹配，實現最高的開發效率。
