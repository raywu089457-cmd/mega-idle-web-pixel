/**
 * Resource System — manages all game currencies and materials
 * Tier 1 (depends on Save System)
 *
 * Resources:
 * - gold: primary currency, 初始 500, capacity 10,000
 * - magicStones: premium currency, 初始 0, capacity 999
 * - materials (fruitPoor, waterDirty, woodRotten, ironRusty, herbLow): 初始 0, capacity 500 each
 */

const ResourceSystem = (function () {
  // ─── Default resource definitions ───────────────────────────────────────────

  const RESOURCE_CONFIG = {
    gold: { name: '金幣', icon: '🪙', initial: 500, capacity: 10000, type: 'currency' },
    magicStones: { name: '遠古魔法石', icon: '💎', initial: 0, capacity: 999, type: 'currency' },
    fruitPoor: { name: '劣等水果', icon: '🍎', initial: 0, capacity: 500, type: 'material' },
    waterDirty: { name: '髒水', icon: '💧', initial: 0, capacity: 500, type: 'material' },
    woodRotten: { name: '腐朽木頭', icon: '🪵', initial: 0, capacity: 500, type: 'material' },
    ironRusty: { name: '鏽跡斑斑的鐵', icon: '⚙️', initial: 0, capacity: 500, type: 'material' },
    herbLow: { name: '低等藥材', icon: '🌿', initial: 0, capacity: 500, type: 'material' },
  };

  const MATERIAL_TYPES = ['fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow'];

  // ─── State ──────────────────────────────────────────────────────────────────

  let resources = {};
  let listeners = [];

  // ─── Initialization ─────────────────────────────────────────────────────────

  function init(savedState) {
    if (savedState && savedState.resources) {
      // Load from save — validate and fill defaults for missing fields
      resources = {};
      for (const [key, config] of Object.entries(RESOURCE_CONFIG)) {
        resources[key] = {
          value: savedState.resources[key] ?? config.initial,
          capacity: config.capacity,
        };
      }
    } else {
      // Fresh game
      resources = {};
      for (const [key, config] of Object.entries(RESOURCE_CONFIG)) {
        resources[key] = {
          value: config.initial,
          capacity: config.capacity,
        };
      }
    }
    notifyListeners('init', resources);
  }

  // ─── CRUD Operations ────────────────────────────────────────────────────────

  /**
   * Add amount to a resource, clamped to capacity.
   * @param {string} resourceId
   * @param {number} amount
   * @returns {number} actual amount added (may be less if capped)
   */
  function add(resourceId, amount) {
    if (!resources[resourceId]) {
      console.warn(`[ResourceSystem] Unknown resource: ${resourceId}`);
      return 0;
    }
    const config = RESOURCE_CONFIG[resourceId];
    const prev = resources[resourceId].value;
    const newValue = Math.min(prev + amount, config.capacity);
    const actualAdded = newValue - prev;
    resources[resourceId].value = newValue;
    notifyListeners('add', { resourceId, amount: actualAdded, total: newValue });
    return actualAdded;
  }

  /**
   * Subtract amount from a resource, clamped to 0.
   * @param {string} resourceId
   * @param {number} amount
   * @returns {boolean} true if successful, false if insufficient
   */
  function subtract(resourceId, amount) {
    if (!resources[resourceId]) {
      console.warn(`[ResourceSystem] Unknown resource: ${resourceId}`);
      return false;
    }
    const prev = resources[resourceId].value;
    if (prev < amount) {
      notifyListeners('insufficient', { resourceId, required: amount, available: prev });
      return false;
    }
    resources[resourceId].value = prev - amount;
    notifyListeners('subtract', { resourceId, amount, total: resources[resourceId].value });
    return true;
  }

  /**
   * Get current value of a resource.
   * @param {string} resourceId
   * @returns {number}
   */
  function get(resourceId) {
    return resources[resourceId]?.value ?? 0;
  }

  /**
   * Get all resources (for save/display).
   * @returns {Object} resource values
   */
  function getAll() {
    const result = {};
    for (const [key, state] of Object.entries(resources)) {
      result[key] = state.value;
    }
    return result;
  }

  /**
   * Get full resource state including capacity.
   * @returns {Object}
   */
  function getFull() {
    return JSON.parse(JSON.stringify(resources));
  }

  /**
   * Check if player can afford a cost object { resourceId: amount, ... }.
   * @param {Object} cost
   * @returns {boolean}
   */
  function canAfford(cost) {
    for (const [resourceId, amount] of Object.entries(cost)) {
      if (get(resourceId) < amount) return false;
    }
    return true;
  }

  /**
   * Spend a cost object { resourceId: amount, ... }.
   * Deducts all resources atomically only if fully affordable.
   * @param {Object} cost
   * @returns {boolean} true if successful
   */
  function spend(cost) {
    if (!canAfford(cost)) return false;
    for (const [resourceId, amount] of Object.entries(cost)) {
      subtract(resourceId, amount);
    }
    return true;
  }

  /**
   * Get capacity for a resource.
   * @param {string} resourceId
   * @returns {number}
   */
  function getCapacity(resourceId) {
    return resources[resourceId]?.capacity ?? 0;
  }

  /**
   * Get fill percentage (0-100).
   * @param {string} resourceId
   * @returns {number}
   */
  function getFillPercent(resourceId) {
    const state = resources[resourceId];
    if (!state || state.capacity === 0) return 0;
    return (state.value / state.capacity) * 100;
  }

  // ─── Tick Production ────────────────────────────────────────────────────────

  /**
   * Produce 1-3 of each material type (called every second by tick system).
   * Monument level multiplier applies.
   * @param {number} monumentLevel - monument upgrade level (1-10)
   * @returns {Object} production results { resourceId: amountProduced }
   */
  function produceMaterials(monumentLevel = 1) {
    const results = {};
    const multiplier = monumentLevel;

    for (const material of MATERIAL_TYPES) {
      // 1-3 base production per material per tick, scaled by monument level
      const baseProduction = Math.floor(Math.random() * 3) + 1;
      const produced = add(material, baseProduction * multiplier);
      results[material] = produced;
    }

    return results;
  }

  // ─── Listeners ───────────────────────────────────────────────────────────────

  /**
   * Subscribe to resource changes.
   * @param {Function} callback - (event, data) => {}
   */
  function addListener(callback) {
    listeners.push(callback);
  }

  function removeListener(callback) {
    listeners = listeners.filter(l => l !== callback);
  }

  function notifyListeners(event, data) {
    for (const listener of listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('[ResourceSystem] Listener error:', err);
      }
    }
  }

  // ─── Serialization ──────────────────────────────────────────────────────────

  /**
   * Export current state for saving.
   * @returns {Object}
   */
  function exportState() {
    return {
      resources: getAll(),
    };
  }

  // ─── Config accessors ───────────────────────────────────────────────────────

  function getMaterialTypes() {
    return [...MATERIAL_TYPES];
  }

  function getConfig(resourceId) {
    return RESOURCE_CONFIG[resourceId] ?? null;
  }

  function getAllConfigs() {
    return { ...RESOURCE_CONFIG };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    add,
    subtract,
    get,
    getAll,
    getFull,
    canAfford,
    spend,
    getCapacity,
    getFillPercent,
    produceMaterials,
    addListener,
    removeListener,
    exportState,
    getMaterialTypes,
    getConfig,
    getAllConfigs,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceSystem;
}
