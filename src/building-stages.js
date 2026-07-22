// src/building-stages.js — L1 建築 4 階段定義 + 純函式 helpers
// 設計:不 import 任何業務模組(避免循環);完全 stateless,只接 level 數字
// 階段由 level 推導(derived),不寫入 gameState → 老存檔零破壞
// 階段表來自 research doc §十 第二優先;四階段 = 初建 / 改建 / 專業 / 地標

// ─── STAGE TABLE ─────────────────────────────────────────────────────
export const BUILDING_STAGES = {
  foundation: {
    id: 'foundation',
    label: '初建',
    minLevel: 1,
    maxLevel: 2,
    palette: { wall: '#8b5a2b', roof: '#6b3410', trim: '#d4a574' },
    decorations: [],
  },
  developed: {
    id: 'developed',
    label: '改建',
    minLevel: 3,
    maxLevel: 6,
    palette: { wall: '#9a9a9a', roof: '#6b3410', trim: '#e0c089' },
    decorations: ['chimney', 'shelves', 'sign_lit'],
    effects: { capacityMul: 1.2, productionMul: 1.2, label: '+20% 容量/產量' },
  },
  professional: {
    id: 'professional',
    label: '專業',
    minLevel: 7,
    maxLevel: 9,
    palette: { wall: '#a8a8b0', roof: '#7a4520', trim: '#ffd700' },
    decorations: ['banner', 'window_glow', 'chimney_smoke'],
  },
  landmark: {
    id: 'landmark',
    label: '地標',
    minLevel: 10,
    maxLevel: Infinity,
    palette: { wall: '#c0b890', roof: '#8b1a1a', trim: '#ffe066' },
    decorations: ['tower', 'big_flag', 'lantern', 'glow_aura'],
  },
};

export const STAGE_ORDER = ['foundation', 'developed', 'professional', 'landmark'];

// ─── PURE HELPERS ────────────────────────────────────────────────────

/**
 * 由建築 level 推導當前階段(level=0 → null 表示未建造)
 * @param {number} level
 * @returns {object|null}
 */
export function getBuildingStage(level) {
  if (!level || level <= 0) return null;
  if (level >= 10) return BUILDING_STAGES.landmark;
  if (level >= 7) return BUILDING_STAGES.professional;
  if (level >= 3) return BUILDING_STAGES.developed;
  return BUILDING_STAGES.foundation;
}

/**
 * 讀取指定階段乘數(無該 key 或 level=0 → 1)
 * @param {number} level
 * @param {'capacityMul'|'productionMul'} key
 * @returns {number}
 */
export function getBuildingStageMultiplier(level, key) {
  const s = getBuildingStage(level);
  return s?.effects?.[key] ?? 1;
}

/**
 * 取下一階段(currentStage 已是最高 → null)
 * @param {object|null} currentStage
 * @returns {object|null}
 */
export function getNextStage(currentStage) {
  if (!currentStage) return null;
  const i = STAGE_ORDER.indexOf(currentStage.id);
  if (i < 0 || i === STAGE_ORDER.length - 1) return null;
  return BUILDING_STAGES[STAGE_ORDER[i + 1]];
}

/**
 * 距離下個階段還差幾級(已是最高 → null)
 * @param {number} level
 * @returns {number|null}
 */
export function levelsToNextStage(level) {
  const next = getNextStage(getBuildingStage(level));
  return next ? Math.max(0, next.minLevel - level) : null;
}
