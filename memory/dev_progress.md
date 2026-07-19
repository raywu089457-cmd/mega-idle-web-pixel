---
name: dev_progress
description: mega-idle-web-pixel 開發進度追蹤（最新）
type: project
---

# mega-idle-web-pixel 開發進度

## 最後更新: 2026-07-19

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
