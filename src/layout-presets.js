// src/layout-presets.js — L1 服務區配置方案(§十 4)
// 設計:3 種 preset 將 9 plot 上的建築重新配置(不增新建築),一鍵套用
// preset 結構: { id, name, desc, map: { sceneKey: targetPlotIdx } }
// sceneKey:tavern/guild/market/restaurant/drinkShop/forge/alchemy/research/gate
// plotIdx:0..8 (對應 PLOT_COORDS[0..8])

import { PLOT_BUILDINGS } from './data.js'

export const LAYOUT_PRESETS = Object.freeze({
  service: {
    id: 'service', name: '🏥 服務型', icon: '🏥',
    desc: '高頻服務建築(酒館/煉金/餐廳)靠近主幹道;生產/研究往外圍',
    map: { tavern: 0, guild: 2, alchemy: 1, restaurant: 3, drinkShop: 4, forge: 5, market: 6, research: 7, gate: 8 },
  },
  forge: {
    id: 'forge', name: '⚒️ 鍛造型', icon: '⚒️',
    desc: '鐵匠/皮甲/飾品在中央,服務在外圍;適合裝備衝等期',
    map: { forge: 1, guild: 2, alchemy: 5, tavern: 0, market: 4, restaurant: 3, drinkShop: 6, research: 7, gate: 8 },
  },
  commerce: {
    id: 'commerce', name: '💰 商業型', icon: '💰',
    desc: '市集/餐廳/飲料店靠近主幹道,消費人流聚集;狩獵裝備在外',
    map: { market: 1, guild: 2, tavern: 0, restaurant: 3, drinkShop: 4, forge: 5, alchemy: 6, research: 7, gate: 8 },
  },
})

export const PRESET_ORDER = ['service', 'forge', 'commerce']

/** 取 preset 名稱 */
export function getPresetName(id) {
  return LAYOUT_PRESETS[id]?.name || id
}

/**
 * 計算套用 preset 需要的 swap 序列
 * @param {Object<string,number>} currentPlots - state.buildingPlots(sceneKey → plotIdx)
 * @param {string} presetId
 * @returns {Array<[sceneKey, sceneKey]>} swap pairs(原 pickPlacement 概念)
 */
export function computePresetSwaps(currentPlots, presetId) {
  const preset = LAYOUT_PRESETS[presetId]; if (!preset) return []
  // 反向:plot → sceneKey(目標)
  const targetAtPlot = Object.fromEntries(Object.entries(preset.map).map(([k, v]) => [v, k]))
  // 對每個 sceneKey,若它的當前 plot ≠ 目標 plot → 與占據目標 plot 的 sceneKey 互換
  const swaps = []
  for (const [sceneKey, targetPlot] of Object.entries(preset.map)) {
    const currentPlot = currentPlots[sceneKey] ?? PLOT_BUILDINGS.indexOf(sceneKey)
    if (currentPlot === targetPlot) continue
    const occupyingScene = targetAtPlot[targetPlot]
    if (!occupyingScene) continue
    swaps.push([sceneKey, occupyingScene])
  }
  return swaps
}
