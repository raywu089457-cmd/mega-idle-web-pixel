// src/region-unlocks.js — L1 區域綁建築升級(§十 第三)
// 設計:每個區域 boss 擊敗 → 取得 trophy material + 該棟建築解鎖特殊 decoration + UI badge
// state 從既有 mapProgress.zoneProgress[zoneId].bossDefeated derive,不需新 schema
//
// 5 區 boss trophy:
//   Zone 1 迷霧森林 → mistHeart → 煉金(藥水瓶)
//   Zone 2 腐化沼澤 → hiveCore  → 市集(紫晶秤)
//   Zone 3 荒廢礦坑 → golemCore → 鐵匠(金礦堆)
//   Zone 4 熔岩裂谷 → lavaHeart → 公會(熔岩旗)
//   Zone 5 魔域王座 → voidShard → 研究所(暗紫旗)
import { RESOURCES } from './data.js'
import { mapProgress } from './state.js'

export const REGION_UNLOCKS = Object.freeze({
  1: { zoneId: 1, zoneName: '迷霧森林', material: 'mistHeart', building: 'alchemy',   decoration: 'mistFlask',    badge: '🌿 迷霧征服' },
  2: { zoneId: 2, zoneName: '腐化沼澤', material: 'hiveCore',  building: 'market',     decoration: 'crystalScale', badge: '🦂 母巢征服' },
  3: { zoneId: 3, zoneName: '荒廢礦坑', material: 'golemCore', building: 'forge',      decoration: 'goldPile',     badge: '⛏️ 礦心征服' },
  4: { zoneId: 4, zoneName: '熔岩裂谷', material: 'lavaHeart', building: 'monument',   decoration: 'lavaBanner',   badge: '🔥 熔岩征服' },
  5: { zoneId: 5, zoneName: '魔域王座', material: 'voidShard', building: 'research',   decoration: 'voidBanner',   badge: '👹 大君征服' },
})

/** 該 zone 是否已擊敗 boss → 解鎖對應升級 */
export function isRegionUnlocked(zoneId) {
  return !!(mapProgress?.zoneProgress?.[zoneId]?.bossDefeated)
}

/** 給 building id,回傳所有解鎖的區域(每棟最多 1 個 zone 綁定;但保留 array 形式以利未來擴充) */
export function getRegionUpgradesForBuilding(buildingId) {
  const results = []
  for (const u of Object.values(REGION_UNLOCKS)) {
    if (u.building === buildingId && isRegionUnlocked(u.zoneId)) results.push(u)
  }
  return results
}

/** 給 building id,回傳已解鎖的 decoration keys(給 scene.js 用) */
export function getUnlockedDecorationsForBuilding(buildingId) {
  return getRegionUpgradesForBuilding(buildingId).map(u => u.decoration)
}

/** 給 zoneId,回傳 trophy material id(給資源顯示 / 計算用) */
export function getTrophyMaterialId(zoneId) {
  return REGION_UNLOCKS[zoneId]?.material || null
}

/** 給 zoneId,回傳 trophy 在 RESOURCES 裡的資料(若已定義);沒定義就回 null */
export function getTrophyResource(zoneId) {
  const mat = getTrophyMaterialId(zoneId)
  if (!mat || !RESOURCES[mat]) return null
  return RESOURCES[mat]
}

/** 全解鎖 zone 數(給成就 / 統計用) */
export function countUnlockedRegions() {
  return Object.keys(REGION_UNLOCKS).filter(z => isRegionUnlocked(Number(z))).length
}
