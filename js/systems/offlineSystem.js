/**
 * Offline System — Calculates and applies offline progress
 * Tier 3 (depends on Resource System)
 *
 * Core Loop:
 * - When player returns, calculate time away
 * - Apply accumulated resources (capped at 8 hours)
 * - Show welcome back summary
 */

const OfflineSystem = (function () {
  // ─── Constants ───────────────────────────────────────────────────────────────

  const MAX_OFFLINE_SECONDS = 8 * 3600; // 8 hours cap
  const OFFLINE_EFFICIENCY = 0.5; // 50% of normal production while offline

  // ─── State ──────────────────────────────────────────────────────────────────

  let lastOnlineTimestamp = null;
  let isOffline = false;
  let offlineStartTime = null;

  // ─── Initialization ─────────────────────────────────────────────────────────

  function init(savedState) {
    lastOnlineTimestamp = savedState?.lastOnline || Date.now();
    offlineStartTime = lastOnlineTimestamp;
    notifyListeners('init', { lastOnline: lastOnlineTimestamp });
  }

  // ─── Offline Calculation ─────────────────────────────────────────────────────

  /**
   * Mark player as going offline.
   * Call when game is closing/minimized.
   */
  function markOffline() {
    lastOnlineTimestamp = Date.now();
    offlineStartTime = lastOnlineTimestamp;
    isOffline = true;
    notifyListeners('offline_started', { timestamp: lastOnlineTimestamp });
  }

  /**
   * Mark player as returning online.
   * Call when game reopens/resumes.
   * @returns {Object|null} offline summary or null if < 60 seconds
   */
  function markOnline() {
    if (!isOffline) return null;

    const returnTime = Date.now();
    const awaySeconds = Math.floor((returnTime - lastOnlineTimestamp) / 1000);

    if (awaySeconds < 60) {
      // Less than 1 minute, not worth showing
      isOffline = false;
      return null;
    }

    const summary = calculateOfflineProgress(lastOnlineTimestamp, returnTime);
    isOffline = false;

    notifyListeners('offline_ended', summary);
    return summary;
  }

  /**
   * Calculate offline progress.
   * @param {number} lastOnline - previous timestamp in ms
   * @param {number} returnTime - current timestamp in ms
   * @returns {Object} offline summary
   */
  function calculateOfflineProgress(lastOnline, returnTime, monumentLevel = 1) {
    const totalSeconds = Math.floor((returnTime - lastOnline) / 1000);
    const cappedSeconds = Math.min(totalSeconds, MAX_OFFLINE_SECONDS);

    // Material production
    const avgProductionPerTick = 2 * monumentLevel; // 1-3 avg = 2
    const ticks = cappedSeconds;
    const materialEfficiency = avgProductionPerTick * OFFLINE_EFFICIENCY;

    const materialsProduced = {};
    const materialTypes = ResourceSystem.getMaterialTypes();

    for (const mat of materialTypes) {
      // Add some variance to offline production
      const variance = 0.8 + Math.random() * 0.4; // 80-120%
      const produced = Math.floor(materialEfficiency * ticks * variance);
      materialsProduced[mat] = produced;
      ResourceSystem.add(mat, produced);
    }

    // Wandering hero gold (simplified estimate)
    // Average wandering hero generates ~50 gold per minute
    const avgGoldPerMinute = 50;
    const goldProduced = Math.floor(avgGoldPerMinute * (cappedSeconds / 60) * OFFLINE_EFFICIENCY);
    ResourceSystem.add('gold', goldProduced);

    // Wandering hero magic stones (very rare offline)
    const magicStonesProduced = Math.floor(Math.random() * 3); // 0-2
    if (magicStonesProduced > 0) {
      ResourceSystem.add('magicStones', magicStonesProduced);
    }

    return {
      totalSeconds,
      cappedSeconds,
      isCapped: totalSeconds > MAX_OFFLINE_SECONDS,
      materialsProduced,
      goldProduced,
      magicStonesProduced,
      ticksSimulated: ticks,
    };
  }

  // ─── Offline Earnings Preview ─────────────────────────────────────────────────

  /**
   * Preview offline earnings without applying them.
   * Useful for "Continue" button display.
   * @param {number} lastOnline
   * @returns {Object} preview
   */
  function previewOfflineEarnings(lastOnline, monumentLevel = 1) {
    const returnTime = Date.now();
    const totalSeconds = Math.floor((returnTime - lastOnline) / 1000);
    const cappedSeconds = Math.min(totalSeconds, MAX_OFFLINE_SECONDS);

    const avgProductionPerTick = 2 * monumentLevel;
    const materialEfficiency = avgProductionPerTick * OFFLINE_EFFICIENCY;

    const materialsProduced = {};
    const materialTypes = ResourceSystem.getMaterialTypes();

    for (const mat of materialTypes) {
      const variance = 0.8 + Math.random() * 0.4;
      materialsProduced[mat] = Math.floor(materialEfficiency * cappedSeconds * variance);
    }

    const avgGoldPerMinute = 50;
    const goldProduced = Math.floor(avgGoldPerMinute * (cappedSeconds / 60) * OFFLINE_EFFICIENCY);

    return {
      totalSeconds,
      cappedSeconds,
      isCapped: totalSeconds > MAX_OFFLINE_SECONDS,
      preview: {
        materialsProduced,
        goldProduced,
        magicStonesProduced: Math.floor(Math.random() * 3),
      },
    };
  }

  // ─── Listeners ───────────────────────────────────────────────────────────────

  let listeners = [];

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
        console.error('[OfflineSystem] Listener error:', err);
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Format seconds into human-readable string.
   * @param {number} seconds
   * @returns {string}
   */
  function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }

  /**
   * Get last online timestamp.
   * @returns {number}
   */
  function getLastOnline() {
    return lastOnlineTimestamp;
  }

  /**
   * Check if currently marked as offline.
   * @returns {boolean}
   */
  function getIsOffline() {
    return isOffline;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    markOffline,
    markOnline,
    calculateOfflineProgress,
    previewOfflineEarnings,
    formatDuration,
    getLastOnline,
    getIsOffline,
    addListener,
    removeListener,
    // Constants
    MAX_OFFLINE_SECONDS,
    OFFLINE_EFFICIENCY,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineSystem;
}
