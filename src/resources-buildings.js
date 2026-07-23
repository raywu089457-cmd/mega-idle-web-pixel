// src/resources-buildings.js — L2 資源/建築系統
// 從 index.html L1203-1236 (ResourceSystem) + L1262-1303 (BuildingSystem) 搬出
// 設計:不 import 其他 L2 業務模組;buildingEffectText 移到 ui.js(避免與 inventory 循環)

import { RESOURCES, BUILDINGS, BUILDING_ORDER } from './data.js'
import { resources, buildingStates, stats, setResources, setBuildingStates } from './state.js'

// ═══════════════════════════════════════════════════════════════════
// RESOURCE SYSTEM
// ═══════════════════════════════════════════════════════════════════
export function ResourceSystem_init(savedState) {
  const next = {};
  for (const [key, config] of Object.entries(RESOURCES)) {
    next[key] = { value: savedState?.resources?.[key] ?? config.initial, capacity: config.capacity };
  }
  setResources(next);
}
export function ResourceSystem_add(resourceId, amount) {
  if (!resources[resourceId]) return 0;
  const prev = resources[resourceId].value;
  const newValue = Math.min(prev + amount, RESOURCES[resourceId].capacity);
  resources[resourceId].value = newValue;
  return newValue - prev;
}
export function ResourceSystem_subtract(resourceId, amount) {
  if (!resources[resourceId]) return false;
  if (resources[resourceId].value < amount) return false;
  resources[resourceId].value -= amount;
  return true;
}
export function ResourceSystem_get(resourceId) { return resources[resourceId]?.value ?? 0; }
export function ResourceSystem_getAll() { const r = {}; for (const [k, v] of Object.entries(resources)) r[k] = v.value; return r; }
export function ResourceSystem_getCapacity(resourceId) { return resources[resourceId]?.capacity ?? 0; }
export function ResourceSystem_getFillPercent(resourceId) { const s = resources[resourceId]; if (!s || s.capacity === 0) return 0; return (s.value / s.capacity) * 100; }
export function ResourceSystem_canAfford(cost) { for (const [id, amt] of Object.entries(cost)) if (ResourceSystem_get(id) < amt) return false; return true; }
export function ResourceSystem_spend(cost) { if (!ResourceSystem_canAfford(cost)) return false; for (const [id, amt] of Object.entries(cost)) ResourceSystem_subtract(id, amt); return true; }

/** Gold gained through gameplay — also tracked in lifetime stats. */
export function gainGold(amount) {
  const added = ResourceSystem_add('gold', amount);
  if (added > 0) stats.goldEarned += added;
  return added;
}

// ═══════════════════════════════════════════════════════════════════
// BUILDING SYSTEM
// ═══════════════════════════════════════════════════════════════════
export function BuildingSystem_init(savedState) {
  const next = {};
  const saved = savedState?.buildings || {};
  for (const id of BUILDING_ORDER) {
    next[id] = { level: saved[id]?.level ?? BUILDINGS[id].startLevel };
  }
  setBuildingStates(next);
}
// §六 2:取得建築專精(預設 null)
export function BuildingSystem_getSpec(id) { return buildingStates[id]?.spec || null; }
export function BuildingSystem_setSpec(id, spec) {
  if (!buildingStates[id]) return false;
  buildingStates[id] = { ...buildingStates[id], spec };
  return true;
}
export function BuildingSystem_getLevel(id) { return buildingStates[id]?.level ?? 0; }
export function BuildingSystem_getTotalLevels() { return Object.values(buildingStates).reduce((s, b) => s + b.level, 0); }
// §六 3:building_halt 事件期間,指定棟 efficiency -30%
import { townEvent } from './state.js'
import { getEventMul } from './town-events.js'
export function BuildingSystem_getEffectiveLevel(id) {
  const base = BuildingSystem_getLevel(id);
  if (townEvent?.id === 'building_halt' && townEvent.params?.buildingId === id) {
    const penalty = getEventMul(townEvent, 'buildingPenalty'); // 0.3
    if (penalty > 0) return Math.max(0, base * (1 - penalty));
  }
  return base;
}
// 建築等級上限跟隨主堡（獵魔公會）：其他建築上限 = min(自身上限, 公會等級 × 2)
export function buildingMaxLevel(id) {
  const def = BUILDINGS[id]; if (!def) return 0;
  if (id === 'monument') return def.maxLevel;
  return Math.min(def.maxLevel, Math.max(1, BuildingSystem_getLevel('monument')) * 2);
}
export function getBuildingCost(buildingId, targetLevel) {
  const building = BUILDINGS[buildingId];
  if (!building) return null;
  const multiplier = Math.pow(building.costMultiplier, Math.max(0, targetLevel - 1));
  const cost = {};
  for (const [resourceId, baseAmount] of Object.entries(building.baseCost)) {
    cost[resourceId] = Math.floor(baseAmount * multiplier);
  }
  return cost;
}
export function BuildingSystem_upgrade(id) {
  const def = BUILDINGS[id]; if (!def) return false;
  const cur = BuildingSystem_getLevel(id); if (cur >= buildingMaxLevel(id)) return false;
  const cost = getBuildingCost(id, cur + 1); if (!ResourceSystem_spend(cost)) return false;
  buildingStates[id].level += 1; return true;
}
export function BuildingSystem_getWanderingSpawnInterval() { return Math.max(2, 12 - (BuildingSystem_getLevel('tavern') * 2)); }
export function BuildingSystem_getMaxWanderingHeroes() { const t = BuildingSystem_getLevel('tavern'); return 10 + Math.max(0, t - 1) * 3; }
export function BuildingSystem_getTerritoryHeroSlots() { const t = BuildingSystem_getLevel('tavern'); return 7 + Math.max(0, t - 1) * 2; }
export function BuildingSystem_getGoldRate() { return BuildingSystem_getLevel('goldMine') * 2; }
export function BuildingSystem_getPotionProduction() {
  const lvl = BuildingSystem_getLevel('potionShop');
  return { ticks: Math.max(1, 10 - (lvl - 1) * 2), amount: 1 + (lvl - 1) * 2 };
}
