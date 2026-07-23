// src/building-effects.js — L1 建築階段效果 wrapper
// 設計:不修改既有 BuildingSystem_getXxxRate 純函式;在所有呼叫端套 stage multiplier
// 純函式:只讀建築 level + 既有 baseRate,不動 state
// 階段表來自 building-stages.js;level→stage multiplier 全 derive 自 level,零存檔破壞

import { getBuildingStageMultiplier } from './building-stages.js'
import { BuildingSystem_getLevel, BuildingSystem_getEffectiveLevel } from './resources-buildings.js'
import { getSpecMultiplier } from './specializations.js'

/**
 * 把既有 baseRate 套上該建築的階段產量乘數 + 專精乘數
 * (用 effective level — §六 3 building_halt 期間指定棟降一級效率)
 * @param {string} buildingId - 建築 id('goldMine' / 'potionShop' 等)
 * @param {number} baseRate - 既有 BuildingSystem_getXxxRate() 的回傳
 * @returns {number} baseRate × stage.productionMul × spec.yield
 */
export function stageProductionRate(buildingId, baseRate) {
  const lv = BuildingSystem_getEffectiveLevel(buildingId)
  const stageMul = getBuildingStageMultiplier(lv, 'productionMul')
  const specMul = getSpecMultiplier(buildingId, 'yield')
  return baseRate * stageMul * specMul
}

/**
 * 把既有 baseCapacity 套上該建築的階段容量乘數(目前僅 developed=×1.2)
 * @param {string} buildingId
 * @param {number} baseCapacity
 * @returns {number} floor(baseCapacity × stage.capacityMul)
 */
export function stageCapacity(buildingId, baseCapacity) {
  const lv = BuildingSystem_getEffectiveLevel(buildingId)
  const mul = getBuildingStageMultiplier(lv, 'capacityMul')
  return Math.floor(baseCapacity * mul)
}
