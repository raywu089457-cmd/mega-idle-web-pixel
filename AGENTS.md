# AGENTS.md — 放置王國 MEGA IDLE

單檔像素放置遊戲，**無依賴、無建置工具**。直接改 `index.html`，瀏覽器開啟即運行。

## 架構

- 全部遊戲邏輯在 `index.html`（約 4000 行）：inline `<style>` + DOM + 單一 inline `<script>`
- script 內分區：`DATA → STATE/SAVE → SYSTEMS → SCENE/AUDIO → UI → TICK/INIT`
- `sw.js`（PWA 離線快取）、`manifest.json`、`css/style.css`（少量補充樣式，大部分樣式在 index.html 內）
- 設計規格：`docs/straw-valley-DESIGN.md`，改動須遵守

## 硬性規則

- **不加任何依賴**：無 npm、無框架、無建置步驟；維持單一 HTML 檔，無充分理由不要拆分
- **mobile-first**：max-width 480px、觸控目標 ≥ 44px、`prefers-reduced-motion` 須生效
- 純 JavaScript（`'use strict'`）；遊戲資料用大型 const 物件表（camelCase 鍵）；UI 字串與註解用繁體中文
- 原創致敬作品：不使用原作素材、文字或確切數值

## 修改後驗證（最低門檻）

1. 抽出 inline script → `node --check` 語法檢查
2. 以假 DOM/瀏覽器環境確認 init 無例外（冒煙測試腳本放在 repo 外的 `Temp\opencode`）

## 存檔相容

- localStorage key：`kingdomBuilderSave`，JSON v2 格式含 migration
- 新增資源/建築/物品/成就/特質時 → 必須檢查 v2 save migration 與 UI 空狀態

## PWA / 部署

- GitHub Pages 子路徑部署：`manifest.json`、`sw.js` 一律用相對路徑（`./`）；安裝快取只放 `./`、`./index.html`、`./manifest.json`
- **每次遊戲性更新都要 bump `sw.js` 的 `CACHE_NAME`**（目前值以 `sw.js` 為準），否則舊 PWA 客戶端會一直吃舊版 `index.html`
- push 到 `master` 自動部署（`.github/workflows/redeploy.yml`）
