/**
 * Building System — manages building levels and upgrades
 * Tier 1 (depends on Resource System)
 */

const BuildingSystem = (function () {
  // ─── State ──────────────────────────────────────────────────────────────────

  /** @type {Object.<string, {level: number}>} */
  let buildingStates = {};
  let listeners = [];

  // ─── Initialization ─────────────────────────────────────────────────────────

  function init(savedState) {
    const saved = savedState?.buildings || {};
    const defaults = GameData.getDefaultGameState().buildings;

    // Merge: saved takes precedence, default for missing
    for (const [id, def] of Object.entries(defaults)) {
      buildingStates[id] = {
        level: saved[id]?.level ?? def.level,
      };
    }

    notifyListeners('init', { buildingStates });
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  /**
   * Get building definition from GameData.
   * @param {string} buildingId
   * @returns {Object|null}
   */
  function getBuildingDef(buildingId) {
    return GameData.BUILDINGS[buildingId] || null;
  }

  /**
   * Get current level of a building.
   * @param {string} buildingId
   * @returns {number}
   */
  function getLevel(buildingId) {
    return buildingStates[buildingId]?.level ?? 1;
  }

  /**
   * Get all building states.
   * @returns {Object}
   */
  function getAll() {
    const result = {};
    for (const [id, state] of Object.entries(buildingStates)) {
      const def = getBuildingDef(id);
      if (!def) continue;
      result[id] = {
        id,
        name: def.name,
        description: def.description,
        effect: def.effect,
        level: state.level,
        maxLevel: def.maxLevel,
        cost: GameData.getBuildingCost(id, state.level + 1),
        canUpgrade: state.level < def.maxLevel,
      };
    }
    return result;
  }

  /**
   * Check if a building upgrade is affordable.
   * @param {string} buildingId
   * @returns {boolean}
   */
  function canUpgrade(buildingId) {
    const level = getLevel(buildingId);
    const def = getBuildingDef(buildingId);
    if (!def || level >= def.maxLevel) return false;
    const cost = GameData.getBuildingCost(buildingId, level + 1);
    return ResourceSystem.canAfford(cost);
  }

  // ─── Upgrades ───────────────────────────────────────────────────────────────

  /**
   * Upgrade a building to the next level.
   * @param {string} buildingId
   * @returns {boolean} success
   */
  function upgrade(buildingId) {
    const def = getBuildingDef(buildingId);
    if (!def) return false;

    const currentLevel = getLevel(buildingId);
    if (currentLevel >= def.maxLevel) {
      notifyListeners('upgrade_maxed', { buildingId });
      return false;
    }

    const cost = GameData.getBuildingCost(buildingId, currentLevel + 1);
    if (!ResourceSystem.spend(cost)) {
      notifyListeners('upgrade_cannot_afford', { buildingId, cost });
      return false;
    }

    buildingStates[buildingId].level += 1;
    const newLevel = buildingStates[buildingId].level;

    notifyListeners('upgraded', {
      buildingId,
      newLevel,
      previousLevel: currentLevel,
      cost,
    });

    return true;
  }

  // ─── Tavern-specific: Wandering Hero Spawning ───────────────────────────────

  /**
   * Get the wandering hero spawn interval based on tavern level.
   * Higher tavern level = faster spawns.
   * Level 1: 120 ticks, Level 5: 60 ticks
   * @returns {number} ticks between spawns
   */
  function getWanderingSpawnInterval() {
    const tavernLevel = getLevel('tavern');
    // Lv1: 10s, Lv2: 8s, Lv3: 6s, Lv4: 4s, Lv5: 2s
    const interval = 12 - (tavernLevel * 2);
    return Math.max(2, interval);
  }

  /**
   * Get max wandering heroes based on tavern level.
   * Level 1: 3, Level 5: 5
   * @returns {number}
   */
  function getMaxWanderingHeroes() {
    const tavernLevel = getLevel('tavern');
    return 3 + (tavernLevel * 3); // 6 at Lv1, 9 at Lv2, 12 at Lv3, 15 at Lv4, 18 at Lv5
  }

  /**
   * Check if tavern can recruit (has available territory hero slots).
   * @returns {boolean}
   */
  function canRecruitTerritory() {
    const tavernLevel = getLevel('tavern');
    const maxTerritory = 2 + (tavernLevel * 2);
    const currentCount = HeroSystem.getTerritoryHeroes().length;
    return currentCount < maxTerritory;
  }

  /**
   * Get the tavern territory hero slot count.
   * @returns {{current: number, max: number}}
   */
  function getTerritoryHeroSlots() {
    const tavernLevel = getLevel('tavern');
    const maxTerritory = 2 + (tavernLevel * 2); // 4 at Lv1, 6 at Lv2, 8 at Lv3, 10 at Lv4, 12 at Lv5
    const current = HeroSystem.getTerritoryHeroes().length;
    return { current, max: maxTerritory };
  }

  // ─── Listeners ───────────────────────────────────────────────────────────────

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
        console.error('[BuildingSystem] Listener error:', err);
      }
    }
  }

  // ─── Serialization ─────────────────────────────────────────────────────────

  function exportState() {
    return { ...buildingStates };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    getBuildingDef,
    getLevel,
    getAll,
    canUpgrade,
    upgrade,
    // Tavern
    getWanderingSpawnInterval,
    getMaxWanderingHeroes,
    canRecruitTerritory,
    getTerritoryHeroSlots,
    // Listeners
    addListener,
    removeListener,
    // Serialization
    exportState,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingSystem;
}
