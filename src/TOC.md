# mega-idle-web-pixel — Module TOC

> index.html 已從 4011 行縮為 658 行(只剩 DOM + style + module 入口),所有遊戲邏輯在 18 個 ES module。**不要 grep index.html 全文**;改讀 1–3 個 src/ 檔就夠。

## 模組清單(L0 = 無依賴 / L1 = SOT / L2 = 業務 / L3 = 入口)

| 檔 | 行 | 層 | 角色 |
|---|---|---|---|
| `src/data.js` | 277 | L0 | 純資料表:RESOURCES / BUILDINGS / HERO_CLASSES / ZONES / ITEMS / SKILL_TREE / WEATHERS + 純函式 |
| `src/util.js` | 48 | L0 | $ / rand / fmt / showToast / showModal / mixColor / timeAgo / todayKey |
| `src/state.js` | 308 | L1 | SOT:territoryHeroes / wanderingHeroes / resources / mapProgress / gameState + save/load/migrate |
| `src/bonuses.js` | 33 | L2 | multiplier 聚合(getXpMultiplier / getCombatGoldMultiplier / getMaterialMultiplier / getClickGold / getAchievementBonuses) |
| `src/resources-buildings.js` | 90 | L2 | ResourceSystem_* / BuildingSystem_* / buildingMaxLevel / getBuildingCost |
| `src/skills.js` | 108 | L2 | SKILL_TREE runtime:learnSkill / applyPassiveSkills / tryTriggerActiveSkill / applySkillBuffs |
| `src/audio.js` | 59 | L2 | WebAudio 合成(無音檔) — sfx / ensureAudio / startMusic |
| `src/inventory.js` | 213 | L2 | 庫存 / 商店 / 裝備 / 強化 / 訂單 |
| `src/heroes-stats.js` | 280 | L2 | 獵人屬性 / 技能套用 / 訓練 / 招募 / 進階 / 召喚 |
| `src/meta.js` | 169 | L2 | 進度:離線 / 每日 / 成就 / 傳承 / 生產 tick |
| `src/combat.js` | 386 | L2 | 單人即時戰 / 派遣 / 戰報 / 地圖進度 |
| `src/combat-party.js` | 327 | L2 | 組隊戰(共享血條 / 輪流出手) + 常駐隊伍管理 |
| `src/expeditions.js` | 144 | L2 | 深淵 + 流浪獵人 + 天氣 |
| `src/scene.js` | 86 | L2 | Canvas 場景 + 城內 AI(本檔為 stub;完整 600 行渲染待後續補) |
| `src/ui.js` | 295 | L2 | Panel / modal / HUD / 建築擺位 / 訂單 / 成就 / 隊伍 / 技能渲染 |
| `src/settings-and-init.js` | 154 | L2 | 設定 / 重置 / PWA / applyStateToRuntime / init / gameTick |
| `src/window-bridge.js` | 80 | L3 | 78 個 onclick 處理器 re-export 到 window |
| `src/main.js` | 27 | L3 | 啟動入口:依序 import 全模組 → 呼叫 init() |

**總計:18 個 ES module,約 3115 行(原 index.html inline script 3354 行,縮減 7%)。**

---

## 任務 → 讀檔對照表

| 任務 | 必讀 | 不必讀 |
|---|---|---|
| 改資料(怪 / 裝備 / 技能 / 建築 / 成就) | `data.js` | 其餘 17 個 |
| 修戰鬥傷害公式 | `combat.js` + `util.js` + `data.js` | ui / scene / audio / inventory |
| 改 UI render / panel | `ui.js` + `data.js` + `util.js` | combat* / scene / audio / meta |
| 加新建築 | `data.js` + `resources-buildings.js` + `state.js`(migration 段) | combat* / audio |
| 加新成就 | `data.js` + `meta.js` + `state.js`(migration 段) | combat* / scene |
| 修存檔 migration / save key | `state.js` 整檔 + `CLAUDE.md` + `AGENTS.md` | 其餘 |
| 改 PWA / sw.js / 快取 | `sw.js` + `manifest.json` + `AGENTS.md` PWA 段 | `src/*` 全部 |
| 修 onclick 行為 / 加新按鈕 | `window-bridge.js` + 對應業務模組 | 其它 |
| 修城內場景 / 流浪 AI | `scene.js` + `data.js` + `state.js` + `expeditions.js` | combat* / audio / meta |
| 修派遣 / 組隊戰鬥 | `combat-party.js` + `combat.js`(公式段) | scene / audio / meta |
| 修技能樹(資料) | `data.js`(`SKILL_TREE`) + `skills.js` | 其餘 |
| 修商店 / 裝備 / 強化 / 訂單 | `inventory.js` + `data.js` + `state.js` | combat* / audio / scene |
| 修每日 / 離線 / 成就 / 傳承 | `meta.js` + `bonuses.js` + `state.js` | combat* / scene / ui |
| 修流浪獵人 / 深淵 | `expeditions.js` + `data.js` + `state.js` | ui / scene / audio |
| 修初始流程 / 重置 / 匯出匯入 | `settings-and-init.js` + `state.js` | combat* / scene |
| 修音效 / 音量 | `audio.js` + `state.js`(`settings`) | combat* / ui / scene |

---

## 不該讀清單(給新手 agent 看)

- ❌ **`index.html` 全文** — 只讀 L1-658 確認 DOM id 對得上;不要 grep 全部
- ❌ **一次讀超過 3 個 `src/` 檔** — 任務定義不清,回本對照表重看
- ❌ **`sw.js` 全文** — 只讀 `CACHE_NAME` 那行,非 PWA 任務
- ❌ **跨業務模組互相 import** — 必然循環,先抽 util 或走 `state.impls`
- ❌ **`state.impls.*` 默認可用** — 這些是 forward refs,只能等 `init()` 跑完才被註冊

---

## 1-page Prompt Template(未來 session 開頭用)

```md
# 任務:<一句話>

## 必讀
- src/TOC.md(永遠先讀)
- <依對照表填 1~3 個 src/*.js>

## 不必讀
- index.html 全文(只讀 L1-658 確認 DOM id)
- sw.js 全文(非 PWA 任務)

## 約束(來自 AGENTS.md / CLAUDE.md)
- 無依賴、無建置
- mobile-first 44px 觸控目標
- 改資料/建築/成就/特質 → 同步 state.js migration
- release 必 bump CACHE_NAME(目前 v19)
- 業務模組之間不互相 import(用 state.impls)

## 輸出
- 改動限 <1~3 個列出檔>
- diff 摘要 + node --check 結果
- 動 sw.js 必附 CACHE_NAME bump 說明
- 跑 scripts/check-imports.mjs src/ + scripts/check-onclick.mjs 確認 0 循環 + 全覆蓋
```

---

## 已知待辦

- `src/scene.js` 為 **stub 版本**;Canvas 場景渲染(場景背景、NPC/怪物繪製、城內可視 AI 600 行)待後續 session 補上
- 完整瀏覽器 smoke test(jsdom / Playwright)尚未在當前 session 執行
- 進階組隊 UI 的「整裝中 %」動畫(目前為文字)可改為進度條
