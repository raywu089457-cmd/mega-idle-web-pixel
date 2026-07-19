---
name: dev_progress
description: mega-idle-web-pixel 開發進度追蹤（最新）
type: project
---

# mega-idle-web-pixel 開發進度

## 最後更新: 2026-07-19（**23/23 全部完成** 🎉）

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

**單一 HTML 模式** — 所有 JS 內嵌於 `index.html`（約 3050 行），無 js/ 目錄、無建構步驟。
主題為「獵魔村物語 Hunter Village Tycoon」（原創致敬版）；存檔 `localStorage` key=`kingdomBuilderSave`（v2 遷移）。

## 系統狀態

| 系統 | 狀態 | 說明 |
|------|------|------|
| Resource / Building | ✅ | 素材產出、容量、升級費用與效果 |
| Hunter System | ✅ | 領地獵人 + 流浪獵人；星級/特質/疲勞/心情/稀有度 |
| Skill System | ✅ **wave 3 完成** | 5 職業技能樹（被動+主動）、AP 學習、冷卻/持續 buff、即時戰鬥觸發 |
| Party Dispatch | ✅ | 1~4 人編隊 modal；同區同難度依職業數 +5%/種攻擊加成 |
| Combat / Map | ✅ | 即時制戰鬥（liveCombats）、Boss 二階段+狂暴、5 獵場 |
| Shop / Equip | ✅ | 製作/販售/裝備/強化；村莊經濟（貨架庫存、定價、金庫） |
| Scene / AI | ✅ | Canvas 日夜村莊（2x scale）、流浪獵人城內走位 AI、怪區即時戰鬥 |
| Offline / Save | ✅ | 8h 離線收益；離線遠征結算（30s/場、上限 24 場、含魔核+掉落） |
| Daily / Achievement | ✅ | 每日登入 streak（HUD 顯示）、成就永久加成、重建傳承 |
| PWA | ✅ | manifest + sw.js（CACHE_NAME `hunter-village-v10`） |

## Wave 3 修復紀錄（2026-07-19 本 session）

前次 session 技能系統寫到一半中斷，本 session 補完：

1. **補 `tickSkillCds()`** — 原本未定義，`advanceLiveCombat()` 第一回合即 ReferenceError（遊戲崩潰級）
2. **修 `tryTriggerActiveSkill()`** — 未學習（Lv.0）的技能不再觸發/進冷卻/刷假 log
3. **持續型 buff 機制** — `SKILL_TREE` 補 `duration`（怒斬 5 / 狂暴 3 / 鷹眼 4 回合），
   `liveCombats[id].skillBuffs` + `applySkillBuffs()` 逐回合套用
4. **主動技能效果接通 `advanceLiveCombat()`** — critBonus/atkBonus/skillDmgBonus/pierce（無視防禦）/
   doubleAttack（疾風連擊）/healPower（治療）/slowEnemy（寒冰凍結 2 回合免反擊）/eva（閃避反擊）
5. **離線 `runCombat()` 補 eva 閃避**；移除未使用的 `partyCombats` 死宣告

## 驗證

- `node --check` 抽出 inline script：語法 OK
- Node vm 沙盒（stub DOM/localStorage）：31 項斷言全過（觸發/冷卻/buff 遞減/治療/凍結/連擊/閃避/30 tick 無例外/存檔含 skills）
- Playwright 真實瀏覽器：init 無 console/page error、技能學習+派遣+即時戰鬥完成（產生戰報）、場景與每日 modal 渲染正常

## Git 統計

- 總提交數：8（history 曾重寫；舊 96 commits 紀錄已不適用）
- 當前分支：master
- 最新提交：6534671（wave 2）；wave 3 修改尚未提交（工作區含 index.html / sw.js v10 / .gitignore / 刪 3 張根目錄大 PNG）

## 待追蹤

- [ ] wave 3 變更待 commit + push（部署 GitHub Pages）
- [ ] `docs/HANDOVER.md` 內容仍是舊王國版，整份需重寫對齊獵魔村現況
- [ ] 手機版 pixel-perfect UI 完全對齊 `docs/straw-valley-DESIGN.md`
- [ ] GitHub Pages 實際部署驗證 / PWA 離線實際運行驗證
