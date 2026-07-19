// src/state.js — L1 狀態 SOT + save/load/migration
// 從 index.html L910-1201 搬出(L911 標題下 SKILL_TREE 已搬到 data.js)
// 只 import L0 (data.js, util.js);業務模組 (L2) 不可 import state 內部
//
// 設計:state.js 只持有「資料面 SOT」與 save/load/migration 函式;
// runtime bootstrap (applyStateToRuntime / init / gameTick) 搬到 settings-and-init.js。

import { ZONES, BUILDINGS, BUILDING_ORDER } from './data.js';
import { isGear, makeGearInstance } from './data.js';

// ─── SAVE_KEY 常數 ───────────────────────────────────────────────────
export const SAVE_KEY = 'kingdomBuilderSave';

// ─── Runtime SOT (let 變數) ─────────────────────────────────────────
// 遊戲狀態序列化載體,只在 saveGame 組裝時寫入。
export let gameState = null;

// 資源 / 建築
export let resources = {};
export let buildingStates = {};

// 英雄
export let territoryHeroes = [];
export let wanderingHeroes = [];

// 庫存
export let shopInventory = {};
export let gearInventory = [];

// 商店 / 藥水自動產
export let potionShopAutoProduce = true;
export let potionShopTickCounter = 0;
export let shopStock = { healthPotion: 2, gear: 1 };
export let priceMult = { potion: 1, gear: 1 };
export let gearTickCounter = 0;

// 地圖 / 進度
export let mapProgress = null;
export let activeExplorations = [];

// 戰報
export let battleReports = [];

// 玩家進度聚合
export let stats = { kills: 0, bossKills: 0, goldEarned: 0, clicks: 0, crafted: 0, prestiges: 0, shopRevenue: 0 };
export let achievementsUnlocked = {};
export let prestige = { shards: 0, count: 0 };
export let daily = { lastClaim: null, streak: 0, bestStreak: 0 };
export let settings = { music: 40, sfx: 80, notif: true };

// 遊戲循環輔助
export let nextWanderingSpawnIn = 0;
export let territoryCombatTickCounter = 0;
export let resetting = false;

// 戰鬥 / 組隊
export const liveCombats = {};       // { [heroId]: combatState }
export const partyCombats = {};      // { [partyId]: combatState }
export let teams = [];

// 天氣 / 訂單
export let weather = { type: 'sunny', ticks: 0 };
export let craftOrders = [];

// 建築擺位
export let buildingPlots = {};

// UI 狀態
export let activePanel = null;
export let heroSubTab = 'territory';          // 'territory' | 'wander' | 'reports' | 'skills'
export let skillTabHeroId = null;
export let shopFilter = 'all';
export let heroReportSubTab = 'all';          // 'all' | 'zone' | 'wander'
export const expandedReports = new Set();
export let dispatchHeroId = null;
export let equipPick = null;
export let partyDispatchState = { zoneId: null, difficulty: null, selected: [], formation: {} };

// Modal / 提示佇列
export let pendingOfflineSummary = null;
export let pendingDailyReward = null;

// 浮字 / 粒子 (Canvas overlay)
export const floatState = { canvas: null, ctx: null, floats: [], particles: [] };

// 城內場景
export let sceneCtx = null, sceneCanvas = null;
export let sceneW = 0, sceneH = 0, sceneStart = 0;
export let sceneNight = 0;
export let hoverHotspot = null;
export let placementPick = null;

// 場景 NPC / 怪物
export const villagerNPCs = [];
export const wildMonsters = [];
export const tombstones = [];

// 音訊 context
export let audioCtx = null;

// 跨模組 forward refs(避免循環:由 init() 在 settings-and-init.js 內註冊)
export const impls = {
  startAbyssCombat: (hero) => { hero.status = 'idle'; },
  finishAbyssCombat: (hero, lc, won) => { delete liveCombats[hero.id]; },
  spawnWanderingHero: () => {},
  processWanderingTick: () => {},
  weatherTick: () => {},
  rollWeather: () => 'sunny',
  spawnFloat: () => {},
};

// ─── 常數 ───────────────────────────────────────────────────────────
export const MAX_INV = 100;
export const BW_LEAVE_CHANCE = 0.10;
export const PRICE_TIERS = [0.8, 1.2, 1.6];

// ─── Setters (ES module let 是 live binding,外部仍可 push 等;但 reassign 需走 setter) ─
export function setTerritoryHeroes(next) { territoryHeroes = next; }
export function setWanderingHeroes(next) { wanderingHeroes = next; }
export function setMapProgress(next) { mapProgress = next; }
export function setActivePanel(next) { activePanel = next; }
export function setBattleReports(next) { battleReports = next; }
export function setCraftOrders(next) { craftOrders = next; }
export function setTeams(next) { teams = next; }
export function setResources(next) { resources = next; }
export function setBuildingStates(next) { buildingStates = next; }
export function setShopInventory(next) { shopInventory = next; }
export function setGearInventory(next) { gearInventory = next; }
export function setShopStock(next) { shopStock = next; }
export function setPriceMult(next) { priceMult = next; }
export function setActiveExplorations(next) { activeExplorations = next; }
export function setStats(next) { stats = next; }
export function setAchievementsUnlocked(next) { achievementsUnlocked = next; }
export function setPrestige(next) { prestige = next; }
export function setDaily(next) { daily = next; }
export function setSettings(next) { settings = next; }
export function setWeather(next) { weather = next; }
export function setBuildingPlots(next) { buildingPlots = next; }
export function setNextWanderingSpawnIn(next) { nextWanderingSpawnIn = next; }
export function setPotionShopAutoProduce(next) { potionShopAutoProduce = next; }
export function setHeroSubTab(next) { heroSubTab = next; }
export function setSkillTabHeroId(next) { skillTabHeroId = next; }
export function setShopFilter(next) { shopFilter = next; }
export function setHeroReportSubTab(next) { heroReportSubTab = next; }
export function setDispatchHeroId(next) { dispatchHeroId = next; }
export function setEquipPick(next) { equipPick = next; }
export function setPartyDispatchState(next) { partyDispatchState = next; }
export function setPendingOfflineSummary(next) { pendingOfflineSummary = next; }
export function setPendingDailyReward(next) { pendingDailyReward = next; }
export function setSceneCtx(c, canvas, w, h) { sceneCtx = c; sceneCanvas = canvas; sceneW = w; sceneH = h; }
export function setSceneStart(s) { sceneStart = s; }
export function setSceneNight(n) { sceneNight = n; }
export function setHoverHotspot(next) { hoverHotspot = next; }
export function setPlacementPick(next) { placementPick = next; }
export function setResetting(v) { resetting = v; }
export function incTerritoryCombatTickCounter() { territoryCombatTickCounter += 1; }
export function incPotionShopTickCounter(delta = 1) { potionShopTickCounter += delta; }
export function setPotionShopTickCounter(n) { potionShopTickCounter = n; }
export function incGearTickCounter(delta = 1) { gearTickCounter += delta; }
export function setGearTickCounter(n) { gearTickCounter = n; }
export function incWeatherTicks() { weather.ticks += 1; }

// ─── Default state constructors ─────────────────────────────────────
export function defaultZoneProgress() {
  const zp = {};
  for (const z of ZONES) zp[z.id] = { easy: false, normal: false, hard: false, bossDefeated: false };
  return zp;
}
export function defaultMapProgress() {
  return { currentZone: 1, unlockedZones: [1], clearedZones: [], zoneProgress: defaultZoneProgress() };
}
export function defaultBuildings() {
  const b = {};
  for (const id of BUILDING_ORDER) b[id] = { level: BUILDINGS[id].startLevel };
  return b;
}
export function getDefaultGameState() {
  return {
    version: 2, lastOnline: Date.now(),
    resources: { gold: 500, magicStones: 0, fruitPoor: 0, waterDirty: 0, woodRotten: 0, ironRusty: 0, herbLow: 0 },
    heroes: [], wanderingHeroes: [],
    buildings: defaultBuildings(),
    mapProgress: defaultMapProgress(),
    shopInventory: {}, gearInventory: [], battleReports: [], activeExplorations: [],
    stats: { kills: 0, bossKills: 0, goldEarned: 0, clicks: 0, crafted: 0, prestiges: 0, shopRevenue: 0 },
    achievements: {}, prestige: { shards: 0, count: 0 },
    daily: { lastClaim: null, streak: 0, bestStreak: 0 },
    settings: { music: 40, sfx: 80, notif: true },
    nextWanderingSpawnIn: 0, potionShopAutoProduce: true,
  };
}

// ─── Save migration (v1 → v2) ───────────────────────────────────────
/** Fill in fields introduced after v1 so old saves keep working. */
export function migrateSave(parsed) {
  const d = getDefaultGameState();
  if (!parsed || typeof parsed !== 'object') return d;
  parsed.version = 2;
  if (!parsed.stats) parsed.stats = d.stats;
  for (const k of Object.keys(d.stats)) if (parsed.stats[k] == null) parsed.stats[k] = d.stats[k];
  if (!parsed.achievements) parsed.achievements = {};
  if (!parsed.prestige) parsed.prestige = d.prestige;
  if (!parsed.daily) parsed.daily = d.daily;
  if (!parsed.settings) parsed.settings = d.settings;
  for (const k of Object.keys(d.settings)) if (parsed.settings[k] == null) parsed.settings[k] = d.settings[k];
  // New buildings added after v1 get their startLevel
  if (!parsed.buildings) parsed.buildings = {};
  for (const id of BUILDING_ORDER) {
    if (!parsed.buildings[id] || parsed.buildings[id].level == null) {
      parsed.buildings[id] = { level: BUILDINGS[id].startLevel };
    }
  }
  // Map progress: guarantee every zone has an entry
  if (!parsed.mapProgress || !parsed.mapProgress.zoneProgress) parsed.mapProgress = defaultMapProgress();
  else for (const z of ZONES) {
    if (!parsed.mapProgress.zoneProgress[z.id]) parsed.mapProgress.zoneProgress[z.id] = { easy: false, normal: false, hard: false, bossDefeated: false };
  }
  if (!parsed.mapProgress.unlockedZones) parsed.mapProgress.unlockedZones = [1];
  if (!parsed.mapProgress.clearedZones) parsed.mapProgress.clearedZones = [];
  if (parsed.mapProgress.abyssBest == null) parsed.mapProgress.abyssBest = 0;
  // Heroes: guarantee fields used by newer systems
  for (const h of (parsed.heroes || [])) {
    if (h.xp == null) h.xp = 0;
    if (!h.inventory) h.inventory = [];
    if (!h.equipment) h.equipment = { weapon: null, armor: null };
    if (h.exploreDifficulty === undefined) h.exploreDifficulty = null;
    if (h.explorationProgress == null) h.explorationProgress = 0;
    if (!h.skills) h.skills = [];
    if (h.skillPoints == null) h.skillPoints = 0;
    if (!h.combatSkillCds) h.combatSkillCds = {};
    h.partyId = null;   // 組隊戰狀態不存檔，重開後解散
  }
  for (const h of (parsed.wanderingHeroes || [])) {
    if (!h.inventory) h.inventory = [];
    if (!h.equipment) h.equipment = { weapon: null, armor: null };
    if (h.wallet == null) h.wallet = 0;
    if (h.diamonds == null) h.diamonds = 0;
  }
  if (!parsed.shopInventory) parsed.shopInventory = {};
  // wave 6：裝備改為實例制；舊存檔 shopInventory 內的裝備計數轉為普通品質實例
  if (!parsed.gearInventory) parsed.gearInventory = [];
  for (const id of Object.keys(parsed.shopInventory)) {
    if (isGear(id)) {
      for (let i = 0; i < parsed.shopInventory[id]; i++) parsed.gearInventory.push(makeGearInstance(id));
      delete parsed.shopInventory[id];
    }
  }
  if (!parsed.battleReports) parsed.battleReports = [];
  if (!parsed.activeExplorations) parsed.activeExplorations = [];
  return parsed;
}

// ─── saveGame / loadGame ────────────────────────────────────────────
export function saveGame() {
  if (!gameState || resetting) return;
  try {
    gameState.lastOnline = Date.now();
    // 內聯 ResourceSystem_getAll 以保持 L1 不引 L2 的依賴規則
    const allRes = {};
    for (const [k, v] of Object.entries(resources)) allRes[k] = v.value;
    gameState.resources = allRes;
    gameState.heroes = territoryHeroes;
    gameState.wanderingHeroes = wanderingHeroes;
    gameState.buildings = {};
    for (const [id, state] of Object.entries(buildingStates)) gameState.buildings[id] = { level: state.level };
    gameState.mapProgress = mapProgress;
    gameState.shopInventory = shopInventory;
    gameState.gearInventory = gearInventory;
    gameState.shopStock = shopStock;
    gameState.priceMult = priceMult;
    gameState.potionShopAutoProduce = potionShopAutoProduce;
    gameState.nextWanderingSpawnIn = nextWanderingSpawnIn;
    gameState.battleReports = battleReports.slice(0, 50);
    gameState.activeExplorations = activeExplorations;
    gameState.stats = stats;
    gameState.achievements = achievementsUnlocked;
    gameState.prestige = prestige;
    gameState.daily = daily;
    gameState.settings = settings;
    gameState.weather = weather;
    gameState.craftOrders = craftOrders;
    gameState.teams = teams;
    gameState.buildingPlots = buildingPlots;
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  } catch (e) { /* storage full or unavailable — ignore */ }
}

export function loadGame() {
  let parsed = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (e) { parsed = null; }
  gameState = migrateSave(parsed);
  return gameState;
}
