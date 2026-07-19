# Handover Document — mega-idle-web-pixel

> 瀏覽器獵魔村經營遊戲（原創致敬版）。純 HTML + Canvas + JavaScript，無需建構工具。
> 部署：https://raywu089457-cmd.github.io/mega-idle-web-pixel/

---

## 專案架構

### 單一 entry point
所有遊戲邏輯在 `index.html`（2026-07-18 獵魔村版約 1849 行），雙擊即可運行，無需建構。目前包含資源/建築/獵人星級與特質/疲勞/狩獵地圖/商店/裝備強化/成就/每日/重建/離線收益/Canvas 場景與 WebAudio。

```
mega-idle-web-pixel/
├── index.html              # 遊戲本體（所有系統整合）
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker (快取策略)
├── css/style.css            # 樣式（少量，大部分用 inline style）
└── docs/
    ├── straw-valley-DESIGN.md   # UI 設計規範（必須嚴格遵守）
    └── HANDOVER.md             # 本交接文檔
```

### 存檔機制
- **Storage**: `localStorage`（key: `kingdomBuilderSave`）
- **Auto-save**: 每 10 秒，另於 `pagehide` / `visibilitychange` 觸發
- **儲存格式**: JSON v2，包含 version、lastOnline、resources、heroes、wanderingHeroes、buildings、mapProgress、shopInventory、activeExplorations、battleReports、stats、achievements、prestige、daily、settings

---

## 系統清單（index.html 行號區間）

> 注意：下列行號來自舊版，現行 `index.html` 已重寫；請以檔案內 `// ═══` 區段註解為準。

| 系統 | 行號 | 職責 |
|------|------|------|
| RESOURCES | 495–530 | 資源定義（gold, magicStones, 5種材料） |
| BUILDINGS | 505–540 | 建築定義：monument, tavern, weaponShop, potionShop, armorShop |
| HERO CLASSES | 512–519 | 6職業：warrior/mage/rogue/archer/priest/cleric（注意 cleric/priest 重複，應只用 priest） |
| ENGLISH_NAMES | 520+ | 流浪英雄英文名列表 |
| WANDERING_HERO_TYPES | 557–568 | 10種流浪英雄類型（每職業2種等 level 1/2/3/5/6/7/8） |
| ZONES | 568–614 | 5張地圖，每張含 3 難度（easy/normal/hard）+ boss，內含敵人/金幣範圍/xp 設定 |
| ITEMS | 615–624 | 6種裝備：woodenSword(w)/ironDagger(r)/mysticStaff(m)/huntersBow(a)/holyMace(p)/ironArmor(w)，另有 healthPotion 無職業限制 |
| HERO SYSTEM | 625–1200 | 英雄創建、訓練、招募、戰鬥、休息、經驗升級 |
| XP SYSTEM | 1035–1046 | `HeroSystem_gainXP()`：100 XP 升級（maxHp+10, atk+3, def+2），流浪英雄不適用 |
| SHOP SYSTEM | 1126–1180 | 合成系統（武器/藥水/盔甲） |
| MAP SYSTEM | 1167–1280 | 地圖進度、難度解鎖、探索派遣、Boss 擊敗解鎖下一關 |
| SAVE MANAGER | ~1400 | localStorage 存讀 |
| CANVAS | ~200 | 飄字動畫（攻擊數字等） |
| UI / RENDER | 1290–1950 | DOM 面板渲染（資源/英雄/建築/地圖/商店/戰報/設定） |
| GAME LOOP | ~2140 | gameTick() 每秒結算 + init() 初始化 |

---

## 當前遊戲狀態（最新 commit: 3a6ce20）

### 地圖系統（難度 + Boss）

每張地圖有 4 個階段按鈕，水平排列：
```
[🌾 平靜郊野]
[簡單] [普通] [困難] [🔒 BOSS]
```

**按鈕狀態邏輯：**
- 未解鎖地圖：全部灰化 🔒
- 已解鎖未通關：彩色可點，點擊開啟 `openDifficultyModal()` 顯示難度詳情
- 已通關：顯示 ✓ 已擊敗（灰化）
- BOSS：需 easy+normal+hard 全部通關才亮起（紫色👑），擊敗後解鎖下一張地圖

**openDifficultyModal(zoneId, difficulty)** 顯示：
- 難度名稱、推薦等級
- 怪物列表（名稱、HP、ATK、DEF）
- 金幣範圍
- 魔法石機率
- 經驗值
- 「派遣英雄」按鈕

**戰鬥系統：**
- `territoryCombats[combatKey]` — key 格式：`heroId_zoneId_difficulty`
- `HeroSystem_processExplorationTick(zoneId, difficulty)` — 每秒執行，90% 機率觸發戰鬥
- 敵人屬性直接讀 `zone.difficulties[difficulty].enemies[]`，不再用公式計算
- Boss 勝利：自動解鎖下一張地圖 + `MapSystem_markBossDefeated()`

### 英雄系統

**職業（共 6 種，HERO_CLASSES）：**
| key | 名稱 | baseHp | baseAtk | baseDef |
|-----|------|--------|--------|--------|
| warrior | 戰士 | 100 | 15 | 10 |
| mage | 法師 | 70 | 25 | 5 |
| rogue | 盜賊 | 85 | 18 | 8 |
| archer | 弓箭手 | 80 | 20 | 7 |
| priest | 牧師 | 90 | 10 | 15 |
| cleric | 牧師（重複） | 90 | 10 | 15 |

**注意：** `cleric` 與 `priest` 重複，兩者功能相同，統一用 `priest` 即可。

**流浪英雄生成（WANDERING_HERO_TYPES）：**
- 每職業 2 種：wandering_warrior_1/2, wandering_mage_1/2, wandering_rogue_1/2, wandering_archer_1/2, wandering_priest_1/2
- 等級：1/2/3/5/6/7/8
- 生成時隨機選職業，再從該職業內隨機選類型（確保各職業都會出現）

**領地英雄屬性計算（每次升級）：**
```
maxHp += 10
atk += 3
def += 2
```

**XP 系統：**
```
hero.xp += diffData.xp（各難度設定）
升級門檻：level * 100 XP
```

### 裝備系統

**ITEMS 定義：**
| id | 名稱 | 職業限制 |
|----|------|----------|
| woodenSword | 木製劍 | warrior |
| ironDagger | 鐵匕首 | rogue |
| mysticStaff | 神秘法杖 | mage |
| huntersBow | 獵人弓 | archer |
| holyMace | 聖光權杖 | priest |
| ironArmor | 鐵甲 | warrior |

**實心裝備流程（openEquipModal）：**
- 顯示「已裝備區」（金色框） + 「背包—武器/盔甲」分區
- 每物品有「裝備」「販賣」「卸下」按鈕
- `equipItemToHero()` 檢查 `item.forClass !== hero.class`，錯誤顯示 toast
- `sellItemFromEquip()`、`unequipItemFromHero()` — 皆有 `confirm()` 確認
- 每物品有 `instanceId`（唯一識別），用於同名物品個別追蹤

**掉落物品流程（ZONE_ENEMY_DROPS 已廢除）：**
- 現改用 `zone.difficulties[difficulty].drops[]`，item 內含 `instanceId`
- `HeroSystem_processExplorationTick()` 勝利時直接 push 到 `hero.inventory`

### 召回系統

**recallHero(heroId)：**
- 刪除 `territoryCombats[heroId + '_' + hero.currentZone + '_' + hero.exploreDifficulty]`
- 重置 hero 狀態：`idle`, `currentZone=null`, `explorationProgress=0`, `exploreDifficulty=null`

---

## 近期修改紀錄

| Commit | 說明 |
|--------|------|
| `3a6ce20` | feat: 地圖難度階梯、XP系統、boss解鎖、新地圖UI |
| `8fdff02` | feat: 驅逐/販賣加入 confirm() 確認 |
| `6f33364` | fix: toast字體 7px→11px |
| `f14e7ec` | fix: 錯誤toast顯示正確職業限制訊息 |
| `96bbfb1` | fix: 流浪英雄生成從level限制改為全職業隨機 |
| `34fad23` | feat: 裝備modal含已裝備/背包分區、unequip/sell按鈕 |
| `1c38e7c` | feat: 每張地圖 6 種武器掉落設定 |
| `e09b907` | feat: 弓箭手/牧師武器、地圖掉落、職業限制 |

---

## 開發約定與陷阱

### 1. 不要用 inline onclick
動態生成的 DOM（如英雄卡片、戰報）使用 event delegation，在 `document` 層級統一監聽。

### 2. 地圖難度按鈕使用 `diff` 字串
- `openDifficultyModal(zoneId, 'easy')` — difficulty 參數可選 `easy`/`normal`/`hard`/`boss`
- `MapSystem_startExploration(heroId, zoneId, difficulty)` — 第三參數不可省略
- `hero.exploreDifficulty` — 掛在英雄物件上，用於召回時刪除正確的 combatKey

### 3. 存檔版本遷移
`MapSystem_init()` 需處理舊存檔（無 `zoneProgress` 欄位），自動初始化為 5 個 zone 的預設狀態。

### 4. 不要刪除 `genZoneEnemyName` 前的程式碼
`resolveZoneCombat()` 仍被部分舊流程調用，保留作為兼容。

### 5. clerics/priest 重複
`HERO_CLASSES` 內 `cleric` 和 `priest` 重複定義，兩者皆為牧師，統一留 `priest` 即可。

### 6. ZONE_ENEMY_DROPS 已廢除
舊地圖掉落系統（`ZONE_ENEMY_DROPS`）已不再被 `HeroSystem_processExplorationTick()` 使用。新系統直接讀 `zone.difficulties[difficulty]` 內的 `drops`。

### 7. `instanceId` 不可缺
所有背包物品（新生成、掉落、卸下）都需产生 `instanceId`，格式：`'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)`。

---

## UI 設計規範（重要）

所有 UI 修改**必須**依據 `docs/straw-valley-DESIGN.md` 執行，嚴格禁止超出規範自由發揮。

核心規範：
- **色彩**：Rich Soil Brown (`#5d4037`)、Warm Wood (`#8b5a2b`)、Golden Wheat (`#f4d03f`)
- **字體**：Press Start 2P（遊戲 UI）、Lora serif（正文對話）
- **間距**：8px 網格對齊、48px 背包格子、44px 最小觸控區
- **圓角**：0px（90 度直角，像素風格）
- **陰影**：無漸層、無模糊，用邊框對比營造深度
- **紋理**：木紋/石紋邊框、羊皮紙背景

---

## Git 與部署

### Workflow（.github/workflows/redeploy.yml）
- `workflow_dispatch`：手動觸發
- `push`：推送到 master 時自動部署
- 部署目標：https://raywu089457-cmd.github.io/mega-idle-web-pixel/

### 常用指令
```bash
rtk git add . && rtk git commit -m "訊息"
rtk git push
rtk gh run list --limit 3
```

---

## 等待完成的工作

目前沒有進行中的功能需求。如果要繼續開發，建議方向：
1. **裝備附加屬性**：目前裝備只改變外觀，未實際增加英雄 ATK/DEF
2. **成就系統**：達成特定里程碑獎勵
3. **更多英雄技能**：被動技能、必殺技
4. **組隊戰鬥**：多人協力挑戰 Boss
5. **每日登入獎勵**

---

## 聯絡與上下文

- 本專案為手機優先的 PWA 版本，與電腦版平行開發
- 電腦版位置：`mega-idle-web/`（不同的 repo）
- 設計規範：`docs/straw-valley-DESIGN.md`
- 本交接文檔：`docs/HANDOVER.md`