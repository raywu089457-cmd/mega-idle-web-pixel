// src/reachability.js — L1 建築可達性檢查(§七 1)
// 設計:LEAF 模組,不 import scene.js / ui.js / state.js
// 流程:每棟 plot 找最近 ROAD_GRAPH waypoint → BFS 從 gate-north 到該 waypoint → 可達?
//
// 觸發點:renderBuildingsPanel 在每棟卡片讀 getReachability() 結果,加 ⚠️ 標示
// 不可達條件:最近的 waypoint 不可由 gate-north BFS 到(未來 plot 互換時才會真正觸發;現有 9 plot 全可達)

import { ROAD_GRAPH, getWaypoint, pathFind, nearestWaypoint } from './scene-map.js'

// ─── 9 plot 中心座標(對應 src/scene.js PLOT_BUILDINGS 順序)
// 與 PLOT_COORDS 對齊 — tavern/guild/market/restaurant/drinkShop/forge/alchemy/research/gate
const PLOT_CENTERS = Object.freeze([
  { x: 37, y: 185 },   // tavern
  { x: 121, y: 163 },  // guild
  { x: 204, y: 191 },  // market
  { x: 73, y: 202 },   // restaurant
  { x: 169, y: 208 },  // drinkShop
  { x: 44, y: 272 },   // forge
  { x: 121, y: 276 },  // alchemy
  { x: 199, y: 271 },  // research
  { x: 120, y: 331 },  // gate
])
const PLOT_NAMES_LOCAL = Object.freeze(['酒館', '公會', '市集', '餐廳', '飲料店', '鐵匠', '煉金', '研究所', '獵場門'])
const GATE_WAYPOINT = 'gate-north'

// BFS 路徑總長(若不可達回傳 Infinity)
function pathLengthToGate(wpId) {
  if (wpId === GATE_WAYPOINT) return 0
  const path = pathFind(GATE_WAYPOINT, wpId)
  if (!path) return Infinity
  let d = 0
  for (let i = 0; i < path.length - 1; i++) {
    const a = getWaypoint(path[i]); const b = getWaypoint(path[i + 1])
    if (!a || !b) return Infinity
    d += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return d
}

/**
 * 檢查所有 9 plot 的可達性(預設擺位用,給 init toast 或全域提示用)
 * @returns {Array<{plotIdx:number, name:string, x:number, y:number, nearestWp:string, distToGate:number, reachable:boolean}>}
 */
export function checkAllPlotReachability() {
  return PLOT_CENTERS.map((c, i) => {
    const wp = nearestWaypoint(c.x, c.y) || { id: '' }
    const dist = pathLengthToGate(wp.id)
    return {
      plotIdx: i,
      name: PLOT_NAMES_LOCAL[i],
      x: c.x, y: c.y,
      nearestWp: wp.id,
      distToGate: dist,
      reachable: Number.isFinite(dist),
    }
  })
}

/**
 * 給定 scenePlots(來自 state.buildingPlots,key=sceneKey, value=plotIdx),回傳每棟 sceneKey 的可達性 map
 * @param {Object<string, number>} scenePlots - state.buildingPlots 物件
 * @returns {Object<string, {plotIdx:number, nearestWp:string, distToGate:number, reachable:boolean}>}
 */
export function checkSceneReachability(scenePlots) {
  const result = {}
  for (const [sceneKey, plotIdx] of Object.entries(scenePlots || {})) {
    const c = PLOT_CENTERS[plotIdx]
    if (!c) { result[sceneKey] = { plotIdx, nearestWp: '', distToGate: Infinity, reachable: false }; continue }
    const wp = nearestWaypoint(c.x, c.y) || { id: '' }
    const dist = pathLengthToGate(wp.id)
    result[sceneKey] = { plotIdx, nearestWp: wp.id, distToGate: dist, reachable: Number.isFinite(dist) }
  }
  return result
}

/** 單棟快速檢查(sceneKey → boolean) */
export function isSceneReachable(sceneKey, scenePlots) {
  const r = checkSceneReachability(scenePlots || {})[sceneKey]
  return r ? r.reachable : true
}
