// src/town-events.js — L1 城鎮隨機事件系統(§六 3)
// 設計:7 種事件隨機觸發,持續一段時間,影響生產/價格/可用度;觸發率低,給遊戲多樣性
// state.townEvent = { id, startTick, duration } | null

export const TOWN_EVENTS = Object.freeze({
  medical_surge: { id: 'medical_surge', name: '大量傷患回城', icon: '🏥', desc: '大量獵人同時帶傷返村,煉金工房藥水營收 +100%',
    effect: { potionBuyMul: 2.0 }, duration: 60 },
  caravan:        { id: 'caravan',        name: '商隊到訪',     icon: '🐪', desc: '稀有商隊帶來限時商品,裝備精良/傳說出現率 +15%',
    effect: { gearTierBoost: 0.15 }, duration: 90 },
  night_raid:     { id: 'night_raid',     name: '夜間怪物襲擊', icon: '🌙', desc: '夜晚怪區 HP/ATK +30%,掉落也提升',
    effect: { nightZoneBoost: 0.3 }, duration: 45 },
  building_halt:  { id: 'building_halt',  name: '建築停工',     icon: '🔧', desc: '施工噪音導致某棟建築效率 -30%(事件期內)',
    effect: { buildingPenalty: 0.3 }, duration: 30, pickBuilding: true },
  rare_visitor:   { id: 'rare_visitor',   name: '稀有獵人造訪', icon: '✨', desc: '傳說級獵人造訪,招募成本 -50%',
    effect: { recruitDiscount: 0.5 }, duration: 60 },
  material_wave:  { id: 'material_wave',  name: '材料價格波動', icon: '💱', desc: '隨機素材買賣價格 ±50%(波動劇烈)',
    effect: { priceWave: 0.5 }, duration: 120, pickResource: true },
  season_shift:   { id: 'season_shift',   name: '季節轉換',     icon: '🍂', desc: '整體生產效率 ±20%(隨機方向)',
    effect: { seasonalMul: 0.2 }, duration: 180, pickSign: true },
})

export const EVENT_IDS = Object.keys(TOWN_EVENTS)

/**
 * 隨機挑一個事件並 baked-in 隨機參數(building_halt pick building,material_wave pick resource,season_shift pick sign)
 * @param {object|null} currentEvent - state.townEvent
 * @param {number} tickCounter - game tick
 * @param {() => number} rng - 0-1 rng
 * @returns {object|null}
 */
export function maybeTriggerNewEvent(currentEvent, tickCounter, rng = Math.random) {
  if (currentEvent) return null;
  if (rng() > 1 / 180) return null;
  const id = EVENT_IDS[Math.floor(rng() * EVENT_IDS.length)];
  const def = TOWN_EVENTS[id];
  const multipliers = { ...def.effect };
  const params = {};
  if (def.pickBuilding) {
    const candidates = ['goldMine', 'tavern', 'potionShop', 'weaponShop', 'armorShop', 'alchemy', 'altar'];
    params.buildingId = candidates[Math.floor(rng() * candidates.length)];
  }
  if (def.pickResource) {
    const candidates = ['fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow', 'gold'];
    params.resourceId = candidates[Math.floor(rng() * candidates.length)];
  }
  if (def.pickSign) params.sign = rng() < 0.5 ? -1 : 1;
  return { id, startTick: tickCounter, duration: def.duration, multipliers, params };
}

/** 取指定 key 的 multiplier(若無 active 事件回傳 1) */
export function getEventMul(currentEvent, key) {
  if (!currentEvent || !currentEvent.multipliers) return 1;
  const v = currentEvent.multipliers[key];
  if (v == null) return 1;
  // season_shift 套 sign
  if (key === 'seasonalMul' && currentEvent.params?.sign) return 1 + currentEvent.params.sign * v;
  return v;
}

/**
 * 檢查並清除過期事件
 * @param {object|null} currentEvent
 * @param {number} tickCounter
 * @returns {object|null} 若過期回 null,否則回傳原 event
 */
export function tickEventDuration(currentEvent, tickCounter) {
  if (!currentEvent) return null;
  const def = TOWN_EVENTS[currentEvent.id];
  if (!def) return null;
  if (tickCounter - currentEvent.startTick >= currentEvent.duration) return null;
  return currentEvent;
}

/** 取當前事件的剩餘 ticks(給 UI 顯示) */
export function getRemainingTicks(currentEvent, tickCounter) {
  if (!currentEvent) return 0;
  return Math.max(0, currentEvent.duration - (tickCounter - currentEvent.startTick));
}
