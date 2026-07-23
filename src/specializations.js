// src/specializations.js — L1 建築專精分支(§六 2)
// 設計:Lv3 時(developed 階段起)給玩家 2 選 1,永久鎖定,影響該棟產量/品質/速度/容量
// 狀態:buildingStates[id].spec = 'yield' | 'quality' | 'speed' | 'capacity' | 'special'

import { BuildingSystem_getSpec } from './resources-buildings.js'

// 每棟建築的 2 個可選專精(只做核心 3 棟:weaponShop / armorShop / alchemy)
export const BUILDING_SPECS = Object.freeze({
  weaponShop: [
    { id: 'yield',   name: '量產線',   icon: '⚔️', desc: '武器製作產量 +50%(成本不變);店內武器庫存量提升' },
    { id: 'quality', name: '匠心坊',   icon: '✨', desc: '精良/傳說裝備出現率 +3%/級(累積);稀有詞綴更容易' },
  ],
  armorShop: [
    { id: 'yield',    name: '量產線',   icon: '🛡️', desc: '防具製作產量 +50%;店內防具庫存量提升' },
    { id: 'capacity', name: '護衛庫',   icon: '🏛', desc: '裝備庫存容量 +30%(玩家也受惠);屯貨更多' },
  ],
  potionShop: [
    { id: 'yield',  name: '量產線',   icon: '⚗️', desc: '藥水生產量 +50%(每 tick 量翻倍後再 ×1.5)' },
    { id: 'speed',  name: '快鍋爐',   icon: '⏱️', desc: '藥水生產間隔 -20%(更快產出);煉金工房效益提升' },
  ],
});

/** 該棟建築是否可選專精(目前只 3 棟) */
export function canSpecialize(buildingId) {
  return !!BUILDING_SPECS[buildingId];
}

/** 取該棟可選專精列表 */
export function getSpecOptions(buildingId) {
  return BUILDING_SPECS[buildingId] || [];
}

/** 取當前專精 spec obj(若已選) */
export function getCurrentSpec(buildingId) {
  const id = BuildingSystem_getSpec(buildingId);
  if (!id) return null;
  const opt = (BUILDING_SPECS[buildingId] || []).find(o => o.id === id);
  return opt || null;
}

/** 計算專精 multiplier(給 wrappers 套用) */
export function getSpecMultiplier(buildingId, kind) {
  const spec = BuildingSystem_getSpec(buildingId);
  if (!spec) return 1;
  // yield:產量 ×1.5;quality/speed/capacity 由對應呼叫端自行讀 spec 處理
  if (kind === 'yield' && spec === 'yield') return 1.5;
  if (kind === 'speed' && spec === 'speed') return 1.25; // +25% speed = ×0.8 ticks,但包成 mul
  return 1;
}
