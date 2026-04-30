/**
 * main.js — Game initialization and main loop
 * Tier 4 (coordinates all systems)
 */

const Game = (function () {
  // ─── State ──────────────────────────────────────────────────────────────────

  let isRunning = false;
  let tickInterval = null;
  let lastTickTime = 0;
  let gameStartTime = 0;
  let tickCount = 0;
  let lastAutoSave = 0;

  const TICK_INTERVAL_MS = 30000; // 30 seconds (was 1 second)
  const AUTO_SAVE_INTERVAL = 30; // save every 30 ticks (15 minutes at 30s/tick)

  // ─── Initialization ─────────────────────────────────────────────────────────

  /**
   * Initialize game from scratch or loaded save.
   */
  async function init() {
    console.log('[Game] Initializing...');

    try {
      // Try to load save
      const savedState = await SaveManager.load();

      if (savedState) {
        console.log('[Game] Loading saved game...');

        // Initialize systems with saved state
        ResourceSystem.init(savedState);
        BuildingSystem.init(savedState);
        HeroSystem.init(savedState);
        ShopSystem.init(savedState);
        MapSystem.init(savedState);
        OfflineSystem.init(savedState);

        // Calculate offline progress
        if (savedState.lastOnline) {
          const monumentLevel = BuildingSystem.getLevel('monument');
          const offlineResult = OfflineSystem.calculateOfflineProgress(
            savedState.lastOnline,
            Date.now(),
            monumentLevel
          );

          if (offlineResult.totalSeconds > 60) {
            // Show welcome back modal if away > 1 minute
            showWelcomeBack(offlineResult);
          }
        }
      } else {
        console.log('[Game] Starting new game...');

        // Fresh start
        const defaultState = GameData.getDefaultGameState();
        ResourceSystem.init(defaultState);
        BuildingSystem.init(defaultState);
        HeroSystem.init(defaultState);
        ShopSystem.init(defaultState);
        MapSystem.init(defaultState);
        OfflineSystem.init(defaultState);

        // Create starting territory hero
        const starterHero = GameData.createTerritoryHero('warrior', 'Sir Aldric', 1);
        HeroSystem.addTerritoryHero(starterHero);
      }

      // Start game loop
      startGameLoop();

      console.log('[Game] Initialization complete!');
      document.dispatchEvent(new CustomEvent('game_ready'));
    } catch (err) {
      console.error('[Game] Initialization failed:', err);
      throw err;
    }
  }

  /**
   * Show welcome back modal with offline earnings.
   * @param {Object} offlineResult
   */
  function showWelcomeBack(offlineResult) {
    const hours = Math.floor(offlineResult.cappedSeconds / 3600);
    const minutes = Math.floor((offlineResult.cappedSeconds % 3600) / 60);

    const event = {
      type: 'welcome_back',
      offlineTime: `${hours}h ${minutes}m`,
      earnings: offlineResult,
      materialsProduced: offlineResult.materialsProduced,
      goldProduced: offlineResult.goldProduced,
    };

    document.dispatchEvent(new CustomEvent('game_welcome_back', { detail: event }));
  }

  // ─── Game Loop ──────────────────────────────────────────────────────────────

  /**
   * Start the game loop.
   */
  function startGameLoop() {
    if (isRunning) return;

    isRunning = true;
    gameStartTime = Date.now();
    lastTickTime = gameStartTime;
    lastAutoSave = 0;
    tickCount = 0;

    console.log('[Game] Starting game loop...');
    tickInterval = setInterval(gameTick, TICK_INTERVAL_MS);
  }

  /**
   * Stop the game loop.
   */
  function stopGameLoop() {
    if (!isRunning) return;

    isRunning = false;
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    console.log('[Game] Game loop stopped.');
  }

  /**
   * Main game tick — called every second.
   */
  async function gameTick() {
    const tickStart = Date.now();
    tickCount++;

    try {
      // 1. Resource production (every tick)
      const monumentLevel = BuildingSystem.getLevel('monument');
      ResourceSystem.produceMaterials(monumentLevel);

      // 2. Wandering hero AI (every tick)
      HeroSystem.processWanderingTick();

      // 3. Territory hero exploration (every tick)
      MapSystem.processExplorations();

      // 3b. Resting hero healing (every tick)
      HeroSystem.processRestingTick();

      // 4. Shop auto-production (every tick, based on shop level)
      ShopSystem.processAutoProduction();

      // 5. Auto-save check (every 30 seconds)
      if (tickCount - lastAutoSave >= AUTO_SAVE_INTERVAL) {
        await autoSave();
        lastAutoSave = tickCount;
      }

      // 6. Dispatch tick event for UI updates
      document.dispatchEvent(new CustomEvent('game_tick', {
        detail: {
          tickCount,
          tickTime: tickStart,
          resources: ResourceSystem.getAll(),
        }
      }));

    } catch (err) {
      console.error('[Game] Tick error:', err);
    }

    const tickDuration = Date.now() - tickStart;
    if (tickDuration > 100) {
      console.warn(`[Game] Slow tick: ${tickDuration}ms`);
    }
  }

  /**
   * Auto-save current game state.
   */
  async function autoSave() {
    try {
      const gameState = buildSaveState();
      await SaveManager.save(gameState);
      document.dispatchEvent(new CustomEvent('game_saved', { detail: { tickCount } }));
    } catch (err) {
      console.error('[Game] Auto-save failed:', err);
    }
  }

  /**
   * Build save state from all systems.
   * @returns {Object}
   */
  function buildSaveState() {
    const heroState = HeroSystem.exportState();
    return {
      version: 1,
      lastOnline: Date.now(),
      resources: ResourceSystem.getAll(),
      heroes: heroState.heroes,
      wanderingHeroes: heroState.wanderingHeroes,
      heroReports: {
        wandering: heroState.wanderingReports,
        territory: heroState.territoryReports,
      },
      nextWanderingSpawnIn: heroState.nextWanderingSpawnIn,
      buildings: BuildingSystem.exportState(),
      mapProgress: MapSystem.exportState().mapProgress,
      shopInventory: ShopSystem.exportState().shopInventory,
      shopLevel: ShopSystem.getShopLevel(),
      tickCount,
      _debug: Date.now(), // timestamp to verify this is fresh save
    };
  }

  // ─── Manual Save/Load ───────────────────────────────────────────────────────

  /**
   * Manual save — player triggered.
   */
  async function manualSave() {
    const gameState = buildSaveState();
    await SaveManager.save(gameState);
    document.dispatchEvent(new CustomEvent('game_saved', { detail: { manual: true } }));
    return true;
  }

  /**
   * New game — reset everything.
   */
  async function newGame() {
    stopGameLoop();
    await SaveManager.delete();

    const defaultState = GameData.getDefaultGameState();
    ResourceSystem.init(defaultState);
    BuildingSystem.init(defaultState);
    HeroSystem.init(defaultState);
    ShopSystem.init(defaultState);
    MapSystem.init(defaultState);
    OfflineSystem.init(defaultState);

    // Create starting hero
    const starterHero = GameData.createTerritoryHero('warrior', 'Sir Aldric', 1);
    HeroSystem.addTerritoryHero(starterHero);

    startGameLoop();
    document.dispatchEvent(new CustomEvent('game_new', { detail: {} }));
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────────

  /**
   * Handle visibility change (tab switching).
   */
  function onVisibilityChange() {
    if (document.hidden) {
      console.log('[Game] Page hidden');
      OfflineSystem.markOffline();
    } else {
      console.log('[Game] Page visible');
      OfflineSystem.markOnline();
    }
  }

  /**
   * Handle before unload — save before closing.
   */
  function onBeforeUnload() {
    if (isRunning) {
      const gameState = buildSaveState();
      SaveManager.save(gameState).catch(err => {
        console.warn('[Game] Pre-unload save failed:', err);
      });
    }
  }

  // ─── Setup ──────────────────────────────────────────────────────────────────

  // Attach event listeners
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('beforeunload', onBeforeUnload);

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    startGameLoop,
    stopGameLoop,
    manualSave,
    newGame,
    getTickCount: () => tickCount,
    isRunning: () => isRunning,
  };
})();

// ─── Auto-start when DOM ready ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Game] DOM ready, starting game...');

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[Game] SW registered:', reg.scope);
    } catch (err) {
      console.warn('[Game] SW registration failed:', err);
    }
  }

  Game.init();
});
