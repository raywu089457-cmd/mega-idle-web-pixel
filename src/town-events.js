// src/town-events.js — L1 城鎮隨機事件系統(§六 3)
// 設計:7 種事件隨機觸發,持續一段時間,影響生產/價格/可用度;觸發率低,給遊戲多樣性
// state.townEvent = { id, startTick, duration } | null

export const TOWN_EVENTS = Object.freeze({
  medical_surge: { id: 'medical_surge', name: '大量傷患回城', icon: '🏥', desc: '大量獵人同時帶傷返村,煉金工房需求暴增',
    effect: { potionBuyMul: 2.0, duration: 60 } },
  caravan:        { id: 'caravan',        name: '商隊到訪',     icon: '🐪', desc: '稀有商隊帶來限時商品,裝備品質 +1 階機率上升',
    effect: { gearTierBoost: 0.15, duration: 90 } },
  night_raid:     { id: 'night_raid',     name: '夜間怪物襲擊', icon: '🌙', desc: '夜晚怪區強度 +30%,門 portal 加速',
    effect: { nightZoneBoost: 0.3, duration: 45 } },
  building_halt:  { id: 'building_halt',  name: '建築停工',     icon: '🔧', desc: '施工噪音導致某棟建築暫停運作 1 級效率',
    effect: { randomBuildingPenalty: 0.3, duration: 30 } },
  rare_visitor:   { id: 'rare_visitor',   name: '稀有獵人造訪', icon: '✨', desc: '傳說級獵人造訪,3 分鐘內招募成本 -50%',
    effect: { recruitDiscount: 0.5, duration: 60 } },
  material_wave:  { id: 'material_wave',  name: '材料價格波動', icon: '💱', desc: '隨機素材買賣價格 ±50%(波動劇烈)',
    effect: { priceWave: 0.5, duration: 120 } },
  season_shift:   { id: 'season_shift',   name: '季節轉換',     icon: '🍂', desc: '整體生產效率 ±20%(隨機方向)',
    effect: { seasonalMul: 0.2, duration: 180 } },
})

export const EVENT_IDS = Object.keys(TOWN_EVENTS)

/**
 * 隨機挑一個事件觸發(返回 null 如果當前已有事件)
 * @param {object|null} currentEvent - state.townEvent
 * @param {number} tickCounter - game tick 計數
 * @param {() => number} rng - random 0-1 function
 * @returns {object|null} 新事件或 null
 */
export function maybeTriggerNewEvent(currentEvent, tickCounter, rng = Math.random) {
  if (currentEvent) return null;
  // 平均 180 ticks 觸發一次(每 3 分鐘機率 1/180)
  if (rng() > 1 / 180) return null;
  const id = EVENT_IDS[Math.floor(rng() * EVENT_IDS.length)];
  const def = TOWN_EVENTS[id];
  return { id, startTick: tickCounter, duration: def.effect.duration };
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

/** 取當前事件的 effect multiplier key(給其他系統讀) */
export function getCurrentEventMul(key) {
  // 注:state.townEvent 全域讀取由 caller 傳入(此函式為 fallback)
  return 1;
}
