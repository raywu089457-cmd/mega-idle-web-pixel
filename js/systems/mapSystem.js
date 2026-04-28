/**
 * Map System — Zone exploration with territory heroes
 * Tier 3 (depends on Hero System)
 *
 * Core Loop:
 * - Territory heroes explore zones
 * - Each zone has difficulty, rewards, and magic stone chance
 * - Completing a zone unlocks the next one
 */

const MapSystem = (function () {
  // ─── State ──────────────────────────────────────────────────────────────────

  let mapProgress = {
    currentZone: 1,
    unlockedZones: [1],
    clearedZones: [],
  };
  let activeExplorations = []; // { heroId, zoneId, progress, startTime }
  let listeners = [];

  // ─── Initialization ─────────────────────────────────────────────────────────

  function init(savedState) {
    mapProgress = savedState?.mapProgress || {
      currentZone: 1,
      unlockedZones: [1],
      clearedZones: [],
    };
    activeExplorations = [];
    notifyListeners('init', { progress: mapProgress, explorations: activeExplorations });
  }

  // ─── Zone Access ─────────────────────────────────────────────────────────────

  /**
   * Get all zones.
   * @returns {Array}
   */
  function getZones() {
    return [...GameData.ZONES];
  }

  /**
   * Get zone by ID.
   * @param {number} zoneId
   * @returns {Object|null}
   */
  function getZone(zoneId) {
    return GameData.ZONES.find(z => z.id === zoneId) || null;
  }

  /**
   * Get current unlocked zones.
   * @returns {Array}
   */
  function getUnlockedZones() {
    return mapProgress.unlockedZones.map(id => getZone(id)).filter(Boolean);
  }

  /**
   * Check if a zone is unlocked.
   * @param {number} zoneId
   * @returns {boolean}
   */
  function isZoneUnlocked(zoneId) {
    return mapProgress.unlockedZones.includes(zoneId);
  }

  /**
   * Check if a zone is cleared.
   * @param {number} zoneId
   * @returns {boolean}
   */
  function isZoneCleared(zoneId) {
    return mapProgress.clearedZones.includes(zoneId);
  }

  // ─── Exploration ─────────────────────────────────────────────────────────────

  /**
   * Start exploring a zone with a territory hero.
   * @param {string} heroId
   * @param {number} zoneId
   * @returns {boolean} success
   */
  function startExploration(heroId, zoneId) {
    const hero = HeroSystem.getTerritoryHero(heroId);
    if (!hero) {
      notifyListeners('exploration_failed', { heroId, zoneId, reason: 'hero_not_found' });
      return false;
    }

    if (!isZoneUnlocked(zoneId)) {
      notifyListeners('exploration_failed', { heroId, zoneId, reason: 'zone_locked' });
      return false;
    }

    if (hero.status !== 'idle') {
      notifyListeners('exploration_failed', { heroId, zoneId, reason: 'hero_busy' });
      return false;
    }

    const zone = getZone(zoneId);
    if (!zone) {
      notifyListeners('exploration_failed', { heroId, zoneId, reason: 'zone_not_found' });
      return false;
    }

    // Check hero level recommendation
    if (hero.level < zone.recommendedLevel - 2) {
      // Allow with warning, but inform player
      notifyListeners('exploration_warning', { heroId, zoneId, recommended: zone.recommendedLevel });
    }

    // Send hero to explore
    hero.status = 'exploring';
    hero.currentZone = zoneId;

    // Add to active explorations
    activeExplorations.push({
      heroId,
      zoneId,
      progress: 0,
      startTime: Date.now(),
      zoneName: zone.name,
    });

    notifyListeners('exploration_started', { heroId, zoneId, zone });
    return true;
  }

  /**
   * Cancel an active exploration.
   * @param {string} heroId
   * @returns {boolean} success
   */
  function cancelExploration(heroId) {
    const index = activeExplorations.findIndex(e => e.heroId === heroId);
    if (index === -1) return false;

    const exploration = activeExplorations.splice(index, 1)[0];
    HeroSystem.returnToIdle(heroId);

    notifyListeners('exploration_cancelled', { heroId, zoneId: exploration.zoneId });
    return true;
  }

  /**
   * Get active explorations.
   * @returns {Array}
   */
  function getActiveExplorations() {
    return [...activeExplorations];
  }

  /**
   * Check if a hero is currently exploring.
   * @param {string} heroId
   * @returns {boolean}
   */
  function isHeroExploring(heroId) {
    return activeExplorations.some(e => e.heroId === heroId);
  }

  // ─── Exploration Tick ───────────────────────────────────────────────────────

  /**
   * Process exploration progress each tick.
   * Called by game tick system.
   * @returns {Array} completed explorations [{ heroId, zoneId, rewards }]
   */
  function processExplorations() {
    const completed = [];

    for (let i = activeExplorations.length - 1; i >= 0; i--) {
      const exploration = activeExplorations[i];
      const hero = HeroSystem.getTerritoryHero(exploration.heroId);

      if (!hero || hero.status !== 'exploring') {
        activeExplorations.splice(i, 1);
        continue;
      }

      const zone = getZone(exploration.zoneId);
      if (!zone) {
        activeExplorations.splice(i, 1);
        continue;
      }

      // Delegate to HeroSystem (handles progress + combat)
      const result = HeroSystem.processExplorationTick(zone.id);

      if (result) {
        // Zone cleared
        activeExplorations.splice(i, 1);

        // Mark zone as cleared if first time
        if (!isZoneCleared(zone.id)) {
          mapProgress.clearedZones.push(zone.id);
        }

        // Unlock next zone
        const nextZoneId = zone.id + 1;
        const nextZone = getZone(nextZoneId);
        if (nextZone && !isZoneUnlocked(nextZoneId)) {
          mapProgress.unlockedZones.push(nextZoneId);
          mapProgress.currentZone = nextZoneId;
          notifyListeners('zone_unlocked', { zoneId: nextZoneId, zone: nextZone });
        }

        completed.push({
          heroId: exploration.heroId,
          zoneId: zone.id,
          zoneName: zone.name,
          rewards: result,
          firstClear: !isZoneCleared(zone.id),
        });
        notifyListeners('exploration_complete', completed[completed.length - 1]);
      } else {
        // Update exploration progress display
        exploration.progress = hero.explorationProgress || 0;
      }
    }

    return completed;
  }

  /**
   * Calculate rewards for clearing a zone.
   * @param {Object} zone
   * @param {Object} hero
   * @returns {Object} rewards { gold, materials: {}, magicStones }
   */
  function calculateRewards(zone, hero) {
    // Base rewards from zone definition
    const goldReward = zone.rewards.gold.min +
      Math.floor(Math.random() * (zone.rewards.gold.max - zone.rewards.gold.min));

    const materials = {};
    for (const mat of zone.rewards.materials) {
      const amount = Math.floor(Math.random() * 5) + 1;
      materials[mat] = amount;
    }

    // Magic stones (chance-based)
    let magicStones = 0;
    if (Math.random() < zone.magicStoneChance) {
      magicStones = zone.magicStoneMin +
        Math.floor(Math.random() * (zone.magicStoneMax - zone.magicStoneMin));
    }

    // Hero level bonus (extra rewards for higher level heroes)
    const levelBonus = 1 + (hero.level - zone.recommendedLevel) * 0.1;

    return {
      gold: Math.floor(goldReward * Math.max(1, levelBonus)),
      materials: Object.fromEntries(
        Object.entries(materials).map(([k, v]) => [k, Math.floor(v * Math.max(1, levelBonus))])
      ),
      magicStones,
    };
  }

  /**
   * Apply rewards to kingdom.
   * @param {Object} rewards
   */
  function applyRewards(rewards) {
    // Add gold
    ResourceSystem.add('gold', rewards.gold);

    // Add materials
    for (const [mat, amount] of Object.entries(rewards.materials)) {
      ResourceSystem.add(mat, amount);
    }

    // Add magic stones (100% to kingdom for territory heroes)
    if (rewards.magicStones > 0) {
      ResourceSystem.add('magicStones', rewards.magicStones);
    }
  }

  // ─── Zone Info ──────────────────────────────────────────────────────────────

  /**
   * Get zone difficulty rating (for display).
   * @param {number} zoneId
   * @returns {string} difficulty label
   */
  function getDifficultyLabel(zoneId) {
    const zone = getZone(zoneId);
    if (!zone) return 'Unknown';

    if (zone.difficulty <= 1) return 'Easy';
    if (zone.difficulty <= 2) return 'Medium';
    if (zone.difficulty <= 3) return 'Hard';
    if (zone.difficulty <= 4) return 'Very Hard';
    return 'Extreme';
  }

  /**
   * Get zone recommendation text.
   * @param {number} zoneId
   * @returns {string}
   */
  function getRecommendationText(zoneId) {
    const zone = getZone(zoneId);
    if (!zone) return '';

    const stars = '★'.repeat(Math.min(zone.difficulty, 5)) + '☆'.repeat(Math.max(0, 5 - zone.difficulty));
    return `${stars} Recommended Lv.${zone.recommendedLevel}+`;
  }

  // ─── Map Progress ────────────────────────────────────────────────────────────

  /**
   * Get current map progress.
   * @returns {Object}
   */
  function getProgress() {
    return {
      currentZone: mapProgress.currentZone,
      unlockedZones: [...mapProgress.unlockedZones],
      clearedZones: [...mapProgress.clearedZones],
    };
  }

  /**
   * Get exploration status for a hero.
   * @param {string} heroId
   * @returns {Object|null}
   */
  function getHeroExplorationStatus(heroId) {
    return activeExplorations.find(e => e.heroId === heroId) || null;
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
        console.error('[MapSystem] Listener error:', err);
      }
    }
  }

  // ─── Serialization ──────────────────────────────────────────────────────────

  function exportState() {
    return {
      mapProgress: {
        currentZone: mapProgress.currentZone,
        unlockedZones: [...mapProgress.unlockedZones],
        clearedZones: [...mapProgress.clearedZones],
      },
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    // Zone access
    getZones,
    getZone,
    getUnlockedZones,
    isZoneUnlocked,
    isZoneCleared,
    // Exploration
    startExploration,
    cancelExploration,
    getActiveExplorations,
    isHeroExploring,
    processExplorations,
    // Helpers
    getDifficultyLabel,
    getRecommendationText,
    getProgress,
    getHeroExplorationStatus,
    // Listeners
    addListener,
    removeListener,
    // Serialization
    exportState,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapSystem;
}
