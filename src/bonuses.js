// src/bonuses.js — L2 玩家進度 multiplier 聚合
// 從 index.html L1238-1260 抽出(獨立成檔以打破 heroes-stats → meta → combat 循環)
// 業務模組(combat / heroes-stats / scene)只 import 此處的純函式;不需要 meta.js 的其他邏輯

import { ACHIEVEMENTS, BUILDINGS } from './data.js'
import { achievementsUnlocked, prestige, townEvent } from './state.js'
import { BuildingSystem_getLevel } from './resources-buildings.js'
import { getTraditionBonus } from './traditions.js'
import { getEventMul } from './town-events.js'

export function getAchievementBonuses() {
  const agg = { mat: 0, gold: 0, xp: 0, click: 0, atk: 0, def: 0 };
  for (const a of ACHIEVEMENTS) {
    if (!achievementsUnlocked[a.id]) continue;
    agg.mat += a.bonus.mat || 0;
    agg.gold += a.bonus.gold || 0;
    agg.xp += a.bonus.xp || 0;
    agg.click += a.bonus.click || 0;
    agg.atk += a.bonus.atk || 0;
    agg.def += a.bonus.def || 0;
  }
  return agg;
}

// §六 5:hunt tradition 取代舊 shards 全加成(+15%/次累積);shards 保留作 legacy 顯示但不再影響產出
const huntTraditionMul = getTraditionBonus('matMul') + getTraditionBonus('goldMul') + getTraditionBonus('xpMul');
const huntMatMul = getTraditionBonus('matMul');
const huntGoldMul = getTraditionBonus('goldMul');
const huntXpMul = getTraditionBonus('xpMul');
// §六 3:season_shift 事件 ±20%(已 baked-in sign,getEventMul 直接給 1±0.2)
const seasonalMul = () => getEventMul(townEvent, 'seasonalMul');
export function getMaterialMultiplier() { return (1 + getAchievementBonuses().mat + huntMatMul) * seasonalMul(); }
export function getCombatGoldMultiplier() { return (1 + getAchievementBonuses().gold + huntGoldMul + BuildingSystem_getLevel('altar') * 0.04) * seasonalMul(); }
export function getXpMultiplier() { return (1 + getAchievementBonuses().xp + huntXpMul + BuildingSystem_getLevel('altar') * 0.04) * seasonalMul(); }
export function getClickGold() {
  const base = 2 + Math.floor(BuildingSystem_getLevel('goldMine') / 2);
  return base + getAchievementBonuses().click + prestige.shards;
}
