# Claude Code — mega-idle-web-pixel

> 瀏覽器 2D 像素風「獵魔村」經營遊戲（原創致敬版，非原作素材）。純 HTML + Canvas + JavaScript，無需建構工具。
> 目前為**單一 HTML 模式**：CSS、DOM、遊戲資料與所有系統都內嵌在 `index.html`。

## 技術棧

| 層 | 技術 | 理由 |
|---|------|-----|
| 渲染 | Canvas 2D API（村莊場景 + 飄字/粒子） | 原生支援，無需額外庫 |
| UI | DOM + CSS（手機觸控優先） | 面板/按鈕/modal 易於維護 |
| 狀態 | Plain JS objects | 無需框架 |
| 存檔 | `localStorage`，key=`kingdomBuilderSave` | 沿用舊 key 並做 v2 遷移 |
| PWA | `manifest.json` + `sw.js` | 可安裝、核心檔離線快取 |
| 音效 | WebAudio 合成 | 無音檔依賴 |
| 部署 | GitHub Pages | 免費，零維護 |

**無建構步驟。直接編輯 `index.html` / `sw.js` / `manifest.json` 即可。**

## 目前核心循環

```
每秒 tick → 公會整理素材 + 市集產金幣 + 煉金工房產藥水
        → 流浪獵人造訪 / 招募 → 派遣狩獵（驅逐/討伐/獵殺/頭目）
        → 回合制戰鬥 → 金幣/經驗/魔核/裝備掉落
        → 鐵匠鋪與皮甲工坊製作裝備 → 強化 → 提升獵人星級成長與特質
        → 成就永久加成 → 擊敗魔域大君後可重建村莊（傳承碎片全產出 +10%/片）
```

## 主要系統（index.html）

- DATA：資源、建築、獵人職業、流浪獵人、5 個獵場、物品、特質、成就
- SAVE / LOAD：`localStorage`、v2 存檔遷移、離線收益（50%，上限 8 小時）
- RESOURCE / BUILDING：產能、容量、升級費用與效果文字
- HUNTER STATS：`getHeroStats()` 整合基礎屬性、星級、特質、疲勞、建築被動、成就、裝備與強化
- COMBAT / MAP：派遣、進度、頭目解鎖、戰報
- SHOP / EQUIP：製作、販售、裝備、卸下、強化
- SCENE / AUDIO：Canvas 日夜村莊、點擊公會、飄字粒子、WebAudio 音效
- 城內可視 AI：流浪獵人會從獵場門走進城，依需求（低血/疲勞/心情差→酒館休息、缺藥→煉金買藥、錢夠→鐵匠買裝備）走位進店，
  再依自己等級挑三個怪區（村郊原野 Lv1~5 / 霧林小徑 Lv4~9 / 荒嶺隘口 Lv8~14）即時打怪賺自己的金幣；
  戰鬥有傷害數字、血條、中毒/流血 debuff 與職業被動字樣。玩家可直接點小人開招募頁。
  狀態機在 `updateWanderingScene(dt)`，rAF 驅動；`prefers-reduced-motion` 時改由每秒 tick 推進。
  每個場景建築點擊都會開對應操作面板；底部導覽按鈕可收合/展開面板（`togglePanel`）。
- 村莊經濟：獵人消費入村莊金庫（`stats.shopRevenue`），貨架庫存 `shopStock` 由建築自動補貨、缺貨獵人會抱怨扣心情，
  定價 `priceMult`（薄利/標準/高價）太貴獵人不買。獵人有稀有度（普通/稀有/英雄/傳說，影響星級與錢包）、
  心情（低於 20 會離村）、陣亡墓碑 18 秒後復活、對話泡泡、進店會消失進門、商店同時只服務一位（其他排隊）。
  夜晚怪區會混入夜間怪種；建築 Lv3+ 牆面變石造、屋簷下有等級金磚。
- UI / TICK / INIT：面板渲染、每秒 `gameTick()`、10 秒自動存檔

## 開發約定

- 保持 dependency-free；不要引入建構工具或框架。
- 不使用原遊戲素材、原文或精確數值；只保留高階經營循環與原創表達。
- 手機優先：最大寬度 480px、44px 觸控目標、`prefers-reduced-motion` 要生效。
- 新增資源/建築/物品/成就/特質時，同步檢查存檔遷移與 UI 空狀態。
- 修改後至少執行：抽出 inline script 做 `node --check`，並用假 DOM/瀏覽器確認 init 無例外。

## PWA

- `manifest.json` 使用 `./index.html` 與 `./`，避免 GitHub Pages 子路徑問題。
- `sw.js` 只快取 `./`、`./index.html`、`./manifest.json`；大型 assets 不放入 install 快取。
- 每次玩法 release 必 bump `CACHE_NAME`（目前 `hunter-village-v8`），否則舊 PWA client 會繼續吃舊 `index.html`。
