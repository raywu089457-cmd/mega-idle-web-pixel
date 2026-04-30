/**
 * SaveManager — IndexedDB persistence for Idle Kingdom Builder
 * Uses idb-keyval pattern (raw IndexedDB API, no external dependencies)
 *
 * Save Data Structure:
 * {
 *   version: number,
 *   lastOnline: number (timestamp),
 *   resources: { gold, magicStones, materials... },
 *   heroes: [...],
 *   buildings: [...],
 *   mapProgress: { zone: number, cleared: [] },
 *   monumentLevel: number,
 *   shopLevel: number
 * }
 */

const DB_NAME = 'IdleKingdomDB';
const DB_VERSION = 1;
const STORE_NAME = 'saveStore';
const SAVE_KEY = 'idleKingdomSave';
const CURRENT_SCHEMA_VERSION = 2;

const SaveManager = (function () {
  let _db = null;

  // ─── Internal helpers ───────────────────────────────────────────────────────

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async function getDB() {
    if (_db) return _db;
    _db = await openDB();
    return _db;
  }

  function transactionalGet(key) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  function transactionalPut(value) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  function transactionalDelete(key) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─── Version migration ───────────────────────────────────────────────────────

  /**
   * Migrate save data from older versions to CURRENT_SCHEMA_VERSION.
   * Each migration step handles exactly ONE version increment.
   */
  function migrate(rawData) {
    let data = { ...rawData };
    let ver = data.version || 1;

    // Migrate from 1 to 2 (add wanderingHeroes, heroReports, nextWanderingSpawnIn fields)
    if (ver < 2) {
      data.wanderingHeroes = data.wanderingHeroes || [];
      data.heroReports = data.heroReports || { wandering: [], territory: [] };
      data.nextWanderingSpawnIn = data.nextWanderingSpawnIn || 0;
      ver = 2;
    }

    // Add future migration steps here:
    // if (ver < 3) { ... ver = 3; }
    // if (ver < 4) { ... ver = 4; }

    data.version = ver;
    return data;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Save the current game state to IndexedDB.
   * Sets lastOnline to current timestamp and increments version.
   * @param {Object} gameState - Full game state object
   * @returns {Promise<void>}
   */
  async function save(gameState) {
    try {
      const payload = {
        id: SAVE_KEY,
        version: CURRENT_SCHEMA_VERSION,
        lastOnline: Date.now(),
        resources: gameState.resources || {},
        heroes: gameState.heroes || [],
        wanderingHeroes: Array.isArray(gameState.wanderingHeroes) ? gameState.wanderingHeroes : [],
        heroReports: gameState.heroReports || { wandering: [], territory: [] },
        nextWanderingSpawnIn: gameState.nextWanderingSpawnIn || 0,
        buildings: gameState.buildings || [],
        mapProgress: gameState.mapProgress || { zone: 1, cleared: [] },
        shopInventory: gameState.shopInventory || [],
        shopLevel: gameState.shopLevel || 1,
      };
      await transactionalPut(payload);
    } catch (err) {
      console.error('[SaveManager] save() failed:', err);
      throw err;
    }
  }

  /**
   * Load and return the saved game state.
   * Runs migration if saved version < CURRENT_SCHEMA_VERSION.
   * @returns {Promise<Object|null>} Saved game state or null if no save exists
   */
  async function load() {
    try {
      const raw = await transactionalGet(SAVE_KEY);
      if (!raw) return null;

      // Version migration
      if (raw.version < CURRENT_SCHEMA_VERSION) {
        return migrate(raw);
      }

      return raw;
    } catch (err) {
      console.error('[SaveManager] load() failed:', err);
      throw err;
    }
  }

  /**
   * Delete the saved game state.
   * @returns {Promise<void>}
   */
  async function deleteSave() {
    try {
      await transactionalDelete(SAVE_KEY);
    } catch (err) {
      console.error('[SaveManager] deleteSave() failed:', err);
      throw err;
    }
  }

  /**
   * Check whether a save exists.
   * @returns {Promise<boolean>}
   */
  async function hasSave() {
    try {
      const raw = await transactionalGet(SAVE_KEY);
      return raw !== undefined && raw !== null;
    } catch (err) {
      console.error('[SaveManager] hasSave() failed:', err);
      return false;
    }
  }

  /**
   * Return the lastOnline timestamp of the current save.
   * @returns {Promise<number|null>} Timestamp in ms, or null if no save
   */
  async function getLastOnline() {
    try {
      const raw = await transactionalGet(SAVE_KEY);
      return raw ? raw.lastOnline : null;
    } catch (err) {
      console.error('[SaveManager] getLastOnline() failed:', err);
      return null;
    }
  }

  return {
    save,
    load,
    delete: deleteSave,
    deleteSave,
    hasSave,
    getLastOnline,
  };
})();

// Export for module usage (CommonJS / ES modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SaveManager;
}
