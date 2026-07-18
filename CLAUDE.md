# Claude Code — mega-idle-web-pixel

> 瀏覽器 2D 像素風閒置王國經營遊戲。純 HTML + Canvas + JavaScript，無需建構工具。
> 目前為**單一 HTML 模式**：CSS、DOM、遊戲資料與所有系統都內嵌在 `index.html`。

## 技術棧

| 層 | 技術 | 理由 |
|---|------|-----|
| 渲染 | Canvas 2D API（主場景 + 飄字/粒子） | 原生支援，無需額外庫 |
| UI | DOM + CSS（手機觸控優先） | 面板/按鈕/ modal 易於維護 |
| 狀態 | Plain JS objects | 無需框架 |
| 存檔 | `localStorage`，key=`kingdomBuilderSave` | 簡單、離線可用 |
| PWA | `manifest.json` + `sw.js` | 可安裝、核心檔離線快取 |
| 音效 | WebAudio 合成 | 無音檔依賴 |
| 部署 | GitHub Pages | 免費，零維護 |

**無建構步驟。直接編輯 `index.html` / `sw.js` / `manifest.json` 即可。**

## 專案結構

```
mega-idle-web-pixel/
├── index.html              # 遊戲本體（約 1822 行）
├── manifest.json           # PWA manifest（start_url/scope 使用相對路徑）
├── sw.js                   # Service Worker（idle-kingdom-v4，只快取核心檔）
├── assets/                 # 參考用像素圖（畫廊展示，非關鍵 layout）
├── docs/
│   ├── straw-valley-DESIGN.md
│   └── HANDOVER.md
└── memory/                 # 開發紀錄
```

## 目前核心循環

```
每秒 tick → 石碑產材料 + 金礦產金幣 + 藥水鋪自動產藥水
        → 流浪英雄 AI / 招募 → 派遣探索 → 回合制戰鬥
        → 金幣/經驗/魔石/掉落 → 製作/強化裝備 → 升級建築
        → 成就永久加成 → 擊敗龍王後可轉生（傳承碎片全產出 +10%/片）
```

## 主要系統（index.html）

- DATA：資源、建築、職業、流浪英雄、5 張地圖、物品、成就
- SAVE / LOAD：`localStorage`、v2 存檔遷移、離線收益（50%，上限 8 小時）
- RESOURCE / BUILDING：產能、容量、升級費用與效果文字
- HERO STATS：`getHeroStats()` 整合基礎屬性、建築被動、成就、裝備與強化
- COMBAT / MAP：派遣、進度、Boss 解鎖、戰報
- SHOP / EQUIP：製作、販售、裝備、卸下、強化
- SCENE / AUDIO：Canvas 日夜場景、點擊城堡、飄字粒子、WebAudio 音效
- UI / TICK / INIT：面板渲染、每秒 `gameTick()`、10 秒自動存檔

## 開發約定

- 保持 dependency-free；不要引入建構工具或框架。
- 手機優先：最大寬度 480px、44px 觸控目標、`prefers-reduced-motion` 要生效。
- 新增資源/建築/物品/成就時，同步檢查存檔遷移與 UI 空狀態。
- 修改後至少執行：抽出 inline script 做 `node --check`，並用假 DOM/瀏覽器確認 init 無例外。

## PWA

- `manifest.json` 使用 `./index.html` 與 `./`，避免 GitHub Pages 子路徑問題。
- `sw.js` 只快取 `./`、`./index.html`、`./manifest.json`；大型 assets 不放入 install 快取。
