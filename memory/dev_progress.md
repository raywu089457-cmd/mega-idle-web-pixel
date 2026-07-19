---
name: dev_progress
description: mega-idle-web-pixel 開發進度追蹤（最新）
type: project
---

# mega-idle-web-pixel 開發進度

## 最後更新: 2026-07-19（W10-13 六項修正完成）

## 本輪（六項需求）

| # | 項目 | 狀態 | 說明 |
|---|------|------|------|
| 1 | reset 按鈕沒真的重置 | ✅ aa52333 | `pagehide` 在 reload 前回寫舊進度；`saveGame` 加 `resetting` 旗標 |
| 2 | 像素風不清晰 | ✅ aa52333 | `SCENE_SCALE=2` 把內容擠到左上 1/4；改回 1 → 240×360 全幅 + CSS pixelated 放大 |
| 3 | 四組隊伍共同戰鬥 | ✅ fc2e67c | 常駐隊伍 ×4（獵人面板「隊伍」分頁）、共享血條連戰、倒下脫隊、手動撤退；修 zombie member bug |
| 4 | 字體/介面尺寸 | ✅ aa52333 | 7px→9px 地板、11px→12px、zone 13→14、nav 11→12 |
| 5 | 建築上限跟隨主堡 | ✅ aa52333 | `buildingMaxLevel()` = min(自身, 公會×2)；面板顯示上限與 🔒 提示 |
| 6 | 建築擺設系統 | ✅ ceac8c1 | **原本不存在**，本次實作：9 空地兩兩交換、hotspot/AI 錨點跟隨、建築面板換位 UI、存檔持久化 |

## 驗證

- vm 沙盒 170 項斷言全過（W10-13 新增 26 項）
- Playwright：reset 後 gold=500、隊伍分頁/出擊/連戰、擺設換位+hotspot 跟隨，零錯誤
- 線上已部署（ceac8c1），sw v18

## 架構備註（W13 後）

- **隊伍**：`teams[4]`（存檔）；`dispatchTeam()` → `startPartyCombat(..., teamId)`；
  `pc.teamId != null` 且非頭目勝利 → `pc.waiting` 整裝 → `startPartyNextRound()` 連戰；
  倒下成員**先算 survivors 再復位**（順序錯會 zombie）。撤退 `endTeamRun()`。
- **擺設**：`PLOT_COORDS[9]` + `buildingPlots{building:plotIdx}` + `plotDelta()`；
  `BUILDING_ANCHORS` 改 getter 即時位移；drawScene 每棟建築 `save/translate/restore`；
  `hotspotAt` 與 hotspot 高亮框都吃 delta。建築 id ↔ 場景 key 映射 `BUILDING_TO_SCENE`。

## 執行中計畫：DESIGN-BACKLOG 23 項 — 已完成

追蹤檔：`docs/DESIGN-BACKLOG.md`（全 wave ✅）。

| Wave | 內容 | 狀態 |
|------|------|------|
| 3 | 技能系統接通 | ✅ bd98a22 |
| 4 | QoL 8 項 | ✅ b1a5d02 |
| 5 | Boss 機制×5、元素相剋、DPS 摘要、夜間掉落 | ✅ fa36ca3 |
| 6 | 裝備實例制、品質 roll、詞綴、套裝、分解 | ✅ 5851cf4 |
| 7 | 真·組隊戰（共享血條）+ 陣型前後排 | ✅ fbfa2e9 |
| 8 | 轉職 5 進階職（Lv.20）+ 第二特質（Lv.15）+ 重骰 | ✅ 2a4dd09 |
| 9 | 委託訂單、天氣系統、無盡深淵 | ✅ 95245b4 |

## 驗證流程（每 wave 必跑）

1. `node extract-js.js`（Temp\opencode）抽出 inline script → `node --check`
2. `node game-smoke-test.js`（Temp\opencode）— vm 沙盒斷言（最終 147 項全過）
3. Playwright 真實瀏覽器 smoke（Temp\opencode\waveN-browser-smoke.js）— 零 console/page error
4. 玩法 release 必 bump `sw.js` CACHE_NAME（目前 `hunter-village-v16`）
5. commit + 更新 DESIGN-BACKLOG.md

## 架構備註（wave 9 後）

- **裝備實例制**：`gearInventory[]` 存 `{iid,id,tier,affix,plus,name,icon}`；藥水仍 `shopInventory{}` 計數。
- **戰鬥三軌**：單人即時戰（`liveCombats` + `advanceLiveCombat`）、團隊戰（`partyCombats` + `advancePartyCombat`，共享血條+前後排）、離線結算（`runCombat`）。
  深淵戰借用 `liveCombats`（`isAbyss` 旗標，`finishLiveCombat` 分流到 `finishAbyssCombat`）。
- **進階職業**：`ADV_CLASSES` + `CLASS_LINEAGE`；技能樹/裝備限制一律用 `baseClassOf()` 查。
- **世界系統**：天氣 `weather`（600 tick 輪替）、委託 `craftOrders`（300 tick 生成、180s 期限）、深淵（`hero.abyssDepth` / `mapProgress.abyssBest`）。
- 存檔遷移：舊裝備計數→實例、`partyId` 重開解散、`abyssBest` 預設 0，都在 `migrateSave()`。

## 後續可做（原 30 項中未選的 7 項）

#1 自動派遣、#3 勝率預估、#18 羈絆、#19 送禮、#20 退役、#27 聲望、#28 圖鑑 — 見 `docs/DESIGN-BACKLOG.md` 末段。

## 架構型態

**單一 HTML 模式** — 所有 JS 內嵌於 `index.html`（約 3950 行），無 js/ 目錄、無建構步驟。
遊戲名「放置王國 MEGA IDLE」；存檔 `localStorage` key=`kingdomBuilderSave`（v2 遷移）。

## 待追蹤

- [ ] `docs/HANDOVER.md` 內容仍是舊王國版，整份需重寫對齊現況
- [ ] 手機版 pixel-perfect UI 完全對齊 `docs/straw-valley-DESIGN.md`
- [ ] PWA 離線實際運行驗證
- [ ] 原 30 項未選 7 項：#1 自動派遣、#3 勝率預估、#18 羈絆、#19 送禮、#20 退役、#27 聲望、#28 圖鑑
