/**
 * Hero System — manages territory heroes and wandering heroes
 * Tier 2 (depends on Resource System)
 *
 * Hero Types:
 * - Territory Heroes: owned by player, can explore maps, trainable
 * - Wandering Heroes: temporary visitors, auto-fight/buy/leave
 */

const HeroSystem = (function () {
  // ─── State ──────────────────────────────────────────────────────────────────

  let territoryHeroes = []; // Array of territory hero objects
  let wanderingHeroes = []; // Array of wandering hero objects
  let nextWanderingSpawnIn = 0; // ticks until next wandering hero spawn
  let listeners = [];
  let wanderingReports = []; // { id, heroId, heroName, heroLevel, heroClass, combatLog, victory, goldReward, magicStones, timestamp }
  let territoryReports = []; // { id, heroId, heroName, heroLevel, heroClass, zoneId, zoneName, combatLog, victory, goldReward, magicStones, timestamp }
  const MAX_REPORTS = 100; // cap for reports to avoid memory bloat

  const MAX_TERRITORY_HEROES = 10;
  const WANDERING_DURATION = 300; // ticks (5 minutes before forced leave)

  // Wandering hero behavior weights (per tick)
  const BEHAVIOR_WEIGHTS = {
    fighting: 0.60, // 60% chance to fight
    shopping: 0.30, // 30% chance to buy from shop
    leaving: 0.10, // 10% chance to leave immediately
  };

  // ─── Initialization ─────────────────────────────────────────────────────────

  function init(savedState) {
    territoryHeroes = savedState?.heroes ? JSON.parse(JSON.stringify(savedState.heroes)) : [];
    wanderingHeroes = savedState?.wanderingHeroes ? JSON.parse(JSON.stringify(savedState.wanderingHeroes)) : [];
    nextWanderingSpawnIn = savedState?.nextWanderingSpawnIn || getRandomSpawnTime();
    // Load combat reports from save (capped)
    const savedReports = savedState?.heroReports || {};
    wanderingReports = (savedReports.wandering || []).slice(-MAX_REPORTS);
    territoryReports = (savedReports.territory || []).slice(-MAX_REPORTS);
    notifyListeners('init', { territory: territoryHeroes, wandering: wanderingHeroes });
  }

  // ─── Territory Heroes ────────────────────────────────────────────────────────

  /**
   * Add a new territory hero.
   * @param {Object} hero - hero object from GameData.createTerritoryHero()
   * @returns {boolean} success
   */
  function addTerritoryHero(hero) {
    const slots = BuildingSystem.getTerritoryHeroSlots();
    if (territoryHeroes.length >= slots.max) {
      notifyListeners('hero_limit_reached', { limit: slots.max });
      return false;
    }
    territoryHeroes.push(hero);
    notifyListeners('hero_added', { hero, type: 'territory' });
    return true;
  }

  /**
   * Remove a territory hero by id.
   * @param {string} heroId
   * @returns {boolean} success
   */
  function removeTerritoryHero(heroId) {
    const index = territoryHeroes.findIndex(h => h.id === heroId);
    if (index === -1) return false;
    const removed = territoryHeroes.splice(index, 1)[0];
    notifyListeners('hero_removed', { hero: removed });
    return true;
  }

  /**
   * Get all territory heroes.
   * @returns {Array}
   */
  function getTerritoryHeroes() {
    return [...territoryHeroes];
  }

  /**
   * Get a territory hero by id.
   * @param {string} heroId
   * @returns {Object|null}
   */
  function getTerritoryHero(heroId) {
    return territoryHeroes.find(h => h.id === heroId) || null;
  }

  /**
   * Send territory hero to explore a zone.
   * @param {string} heroId
   * @param {number} zoneId
   * @returns {boolean} success
   */
  function sendToExplore(heroId, zoneId) {
    const hero = getTerritoryHero(heroId);
    if (!hero) return false;
    if (hero.status !== 'idle') {
      notifyListeners('hero_busy', { hero });
      return false;
    }

    hero.status = 'exploring';
    hero.currentZone = zoneId;
    hero.explorationProgress = 0;
    notifyListeners('hero_exploring', { hero, zoneId });
    return true;
  }

  /**
   * Return hero to idle (cancel exploration or wake from resting).
   * @param {string} heroId
   */
  function returnToIdle(heroId) {
    const hero = getTerritoryHero(heroId);
    if (!hero) return;
    hero.status = 'idle';
    hero.currentZone = null;
    hero.explorationProgress = 0;
    notifyListeners('hero_idle', { hero });
  }

  /**
   * Wake a resting hero early (force to idle).
   * @param {string} heroId
   */
  function wakeFromResting(heroId) {
    const hero = getTerritoryHero(heroId);
    if (!hero || hero.status !== 'resting') return;
    hero.status = 'idle';
    hero.currentZone = null;
    hero.explorationProgress = 0;
    notifyListeners('hero_woken', { hero });
  }

  /**
   * Train a territory hero (increases stats).
   * @param {string} heroId
   * @param {Object} cost - { gold: amount }
   * @returns {boolean} success
   */
  function trainHero(heroId, cost) {
    const hero = getTerritoryHero(heroId);
    if (!hero) return false;

    // Deduct cost via ResourceSystem
    if (!ResourceSystem.spend(cost)) {
      return false;
    }

    // Increase stats
    hero.level += 1;
    const hpGain = 10;
    const atkGain = 3;
    const defGain = 2;
    hero.maxHp += hpGain;
    hero.hp = hero.maxHp;
    hero.atk += atkGain;
    hero.def += defGain;

    notifyListeners('hero_trained', { hero, cost });
    return true;
  }

  // ─── Wandering Heroes ────────────────────────────────────────────────────────

  /**
   * Spawn a new wandering hero (called by tick system).
   */
  function spawnWanderingHero() {
    const types = GameData.WANDERING_HERO_TYPES;
    const typeDef = types[Math.floor(Math.random() * types.length)];
    const hero = GameData.createWanderingHero(typeDef);
    wanderingHeroes.push(hero);
    nextWanderingSpawnIn = getRandomSpawnTime();
    notifyListeners('wandering_spawned', { hero });
  }

  /**
   * Recruit a wandering hero to become a territory hero.
   * @param {string} heroId
   * @returns {boolean} success
   */
  function recruitWanderingHero(heroId) {
    const index = wanderingHeroes.findIndex(h => h.id === heroId);
    if (index === -1) return false;

    const slots = BuildingSystem.getTerritoryHeroSlots();
    if (territoryHeroes.length >= slots.max) {
      notifyListeners('hero_limit_reached', { limit: slots.max });
      return false;
    }

    const wandering = wanderingHeroes[index];

    // Recruitment cost: level * 100 gold
    const recruitCost = wandering.level * 100;
    if (!ResourceSystem.spend({ gold: recruitCost })) {
      notifyListeners('recruit_cannot_afford', { hero: wandering, cost: recruitCost });
      return false;
    }

    // Convert to territory hero
    const territory = {
      id: `territory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isTerritory: true,
      class: wandering.class,
      name: wandering.name,
      level: wandering.level,
      hp: wandering.hp,
      maxHp: wandering.maxHp,
      atk: wandering.atk,
      def: wandering.def,
      status: 'idle',
      currentZone: null,
      explorationProgress: 0,
      dropMagicStoneChance: wandering.dropMagicStoneChance,
    };

    wanderingHeroes.splice(index, 1);
    territoryHeroes.push(territory);

    // Auto-check HP after recruitment — trigger resting if below 80%
    if (territory.hp < territory.maxHp * 0.8) {
      territory.status = 'resting';
    }

    notifyListeners('hero_recruited', { hero: territory, cost: recruitCost });
    return true;
  }

  /**
   * Get recruitment cost for a wandering hero.
   * @param {string} heroId
   * @returns {number} gold cost
   */
  function getRecruitCost(heroId) {
    const hero = wanderingHeroes.find(h => h.id === heroId);
    if (!hero) return 0;
    return hero.level * 100;
  }

  /**
   * Process wandering hero tick (AI behavior).
   * Called every game tick.
   * @returns {Array} events that occurred [{ type, hero, data }]
   */
  function processWanderingTick() {
    const events = [];

    // Handle spawn timer
    nextWanderingSpawnIn -= 1;
    const maxWandering = BuildingSystem.getMaxWanderingHeroes();
    if (nextWanderingSpawnIn <= 0 && wanderingHeroes.length < maxWandering) {
      spawnWanderingHero();
    }

    // Process each wandering hero
    for (let i = wanderingHeroes.length - 1; i >= 0; i--) {
      const hero = wanderingHeroes[i];

      // Each wandering hero has ~60% combat chance per tick
      // (matches spec: 60% fighting behavior)
      if (Math.random() < 0.60) {
        const combatResult = resolveCombat(hero);

        const report = {
          id: `wreport_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          heroId: hero.id,
          heroName: hero.name,
          heroLevel: hero.level,
          heroClass: hero.class,
          combatLog: combatResult.combatLog,
          victory: combatResult.victory,
          goldReward: Math.floor(combatResult.goldReward * 0.8),
          heroKeeps: combatResult.goldReward - Math.floor(combatResult.goldReward * 0.8),
          magicStones: combatResult.victory && combatResult.magicStones > 0
            ? Math.floor(combatResult.magicStones * 0.2) : 0,
          timestamp: Date.now(),
        };
        wanderingReports.push(report);
        if (wanderingReports.length > MAX_REPORTS) wanderingReports.shift();

        if (combatResult.victory) {
          // Spec: 80% of wandering hero combat earnings go to kingdom, 20% is "kept" by hero (but hero has no persistent gold, so effectively 80% kingdom / 20% lost)
          const kingdomGold = Math.floor(combatResult.goldReward * 0.8);
          const heroKeeps = combatResult.goldReward - kingdomGold;
          if (combatResult.magicStones > 0) {
            ResourceSystem.add('magicStones', Math.floor(combatResult.magicStones * 0.2));
          }
          ResourceSystem.add('gold', kingdomGold);
          events.push({ type: 'combat_victory', hero, rewards: { gold: kingdomGold, heroKeeps, magicStones: combatResult.magicStones }, combatLog: combatResult.combatLog });
          notifyListeners('wandering_combat_result', { hero, result: combatResult });
        } else {
          events.push({ type: 'combat_defeat', hero, combatLog: combatResult.combatLog });
          notifyListeners('wandering_combat_result', { hero, result: combatResult });
        }
      }

      // Hero lifetime tick (wandering duration countdown)
      hero.ticksUntilStateChange -= 1;
      if (hero.ticksUntilStateChange <= 0) {
        const rand = Math.random();
        if (rand < BEHAVIOR_WEIGHTS.leaving) {
          // Hero leaves permanently
          const leaving = wanderingHeroes.splice(i, 1)[0];
          events.push({ type: 'hero_left', hero: leaving });
          notifyListeners('wandering_left', { hero: leaving });
          continue;
        } else if (rand < BEHAVIOR_WEIGHTS.leaving + BEHAVIOR_WEIGHTS.shopping) {
          hero.status = 'shopping';
          hero.ticksUntilStateChange = getStateDuration('shopping');
          events.push({ type: 'shopping_start', hero });
          notifyListeners('wandering_shopping', { hero });
        } else {
          hero.status = 'wandering';
          hero.ticksUntilStateChange = getStateDuration('wandering');
        }
      }

      // Shopping resolution (if shopping)
      if (hero.status === 'shopping') {
        const shopResult = ShopSystem.processShopping(hero);
        if (shopResult) {
          events.push({ type: 'purchase', hero, item: shopResult.item, goldEarned: shopResult.goldEarned });
          notifyListeners('wandering_purchase', { hero, item: shopResult.item, goldEarned: shopResult.goldEarned });
        } else {
          // No items available - hero leaves disappointed
          const leaving = wanderingHeroes.splice(i, 1)[0];
          events.push({ type: 'hero_left', hero: leaving, reason: 'no_shop_items' });
          notifyListeners('wandering_left', { hero: leaving });
          continue;
        }
        hero.status = 'wandering';
        hero.ticksUntilStateChange = getStateDuration('wandering');
      }
    }

    return events;
  }

  function rollNextState(currentState) {
    const rand = Math.random();
    if (rand < BEHAVIOR_WEIGHTS.fighting) return 'fighting';
    if (rand < BEHAVIOR_WEIGHTS.fighting + BEHAVIOR_WEIGHTS.shopping) return 'shopping';
    return 'leaving';
  }

  function getStateDuration(state) {
    switch (state) {
      case 'fighting': return Math.floor(Math.random() * 30) + 15; // 15-45 ticks
      case 'shopping': return Math.floor(Math.random() * 20) + 10; // 10-30 ticks
      case 'wandering': return Math.floor(Math.random() * 60) + 30; // 30-90 ticks
      default: return 60;
    }
  }

  function getRandomSpawnTime() {
    const interval = BuildingSystem.getWanderingSpawnInterval();
    return Math.floor(Math.random() * interval) + interval;
  }

  /**
   * Generate a random enemy name based on hero level/tier.
   * @param {number} level
   * @returns {string}
   */
  function generateEnemyName(level) {
    const enemyTypes = [
      { min: 1, names: ['Goblin Scout', 'Wild Wolf', 'Forest Bandit'] },
      { min: 3, names: ['Orc Warrior', 'Cave Troll', 'Dark Mage'] },
      { min: 5, names: ['Shadow Knight', 'Dire Beast', 'Cursed Knight'] },
      { min: 8, names: ['Ancient Dragon', 'Demon Lord', 'Void Walker'] },
    ];
    const tier = enemyTypes.filter(e => level >= e.min).pop();
    return tier.names[Math.floor(Math.random() * tier.names.length)];
  }

  function resolveCombat(hero) {
    // Simple combat: hero fights a random enemy based on their level
    const enemyHp = 50 + hero.level * 20;
    const enemyAtk = 5 + hero.level * 3;
    const enemyDef = 3 + hero.level * 2;
    const enemyName = generateEnemyName(hero.level);

    // Hero stats
    const heroMaxHp = hero.hp || hero.maxHp;
    const heroAtk = hero.atk;
    const heroDef = hero.def;

    // Combat log array
    const combatLog = [];

    // Simplified combat rounds (max 10 rounds)
    let heroRemainingHp = heroMaxHp;
    let enemyRemainingHp = enemyHp;

    // Opening narration
    combatLog.push({
      type: 'narrate',
      text: `⚔️ ${hero.name} encounters a Level ${hero.level} ${enemyName}!`,
    });

    for (let round = 0; round < 10 && heroRemainingHp > 0 && enemyRemainingHp > 0; round++) {
      const heroHpBefore = heroRemainingHp;
      const enemyHpBefore = enemyRemainingHp;

      const heroDamage = Math.max(1, heroAtk - enemyDef + Math.floor(Math.random() * 5));
      const enemyDamage = Math.max(1, enemyAtk - heroDef + Math.floor(Math.random() * 5));
      enemyRemainingHp -= heroDamage;
      heroRemainingHp -= enemyDamage;

      // Clamp HP to 0 minimum for display
      const heroHpAfter = Math.max(0, heroRemainingHp);
      const enemyHpAfter = Math.max(0, enemyRemainingHp);

      combatLog.push({
        type: 'round',
        round: round + 1,
        text: `【第${round + 1}回合】${hero.name} 攻擊造成 ${heroDamage} 傷害到 ${enemyName} (HP: ${enemyHpBefore} → ${enemyHpAfter})，${enemyName} 反擊造成 ${enemyDamage} 傷害到 ${hero.name} (HP: ${heroHpBefore} → ${heroHpAfter})`,
        heroDamage,
        enemyDamage,
        heroHpBefore,
        heroHpAfter,
        enemyHpBefore,
        enemyHpAfter,
      });
    }

    const victory = enemyRemainingHp <= 0;
    const goldReward = victory ? 20 + hero.level * 10 : 0;
    const magicStones = victory && Math.random() < hero.dropMagicStoneChance
      ? Math.floor(Math.random() * 3) + 1
      : 0;

    // Consume some HP from hero
    if (victory) {
      hero.hp = Math.max(1, heroRemainingHp);
      combatLog.push({
        type: 'result',
        text: `🏆 勝利！${hero.name} 擊敗了 ${enemyName}，獲得 ${goldReward} 金幣${magicStones > 0 ? ` 和 ${magicStones} 顆魔法石` : ''}！`,
      });
    } else {
      // Hero retreats with injuries
      hero.hp = Math.max(1, heroRemainingHp);
      hero.status = 'wandering'; // Return to wandering when defeated
      combatLog.push({
        type: 'result',
        text: `💨 撤退！${hero.name} 從 ${enemyName} 撤退，HP 降至 ${hero.hp}`,
      });
    }

    return { victory, goldReward, magicStones, combatLog };
  }

  /**
   * Process resting heroes: heal 0.1% HP per tick, return to idle when at 80% HP.
   * Called every game tick.
   */
  function processRestingTick() {
    const resting = territoryHeroes.filter(h => h.status === 'resting');
    for (const hero of resting) {
      const healAmount = Math.ceil(hero.maxHp * 0.001); // 0.1% per tick
      hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
      if (hero.hp >= hero.maxHp * 0.8) {
        hero.hp = Math.max(hero.hp, Math.ceil(hero.maxHp * 0.8));
        hero.status = 'idle';
        notifyListeners('hero_recovered', { hero });
      }
    }
  }

  /**
   * Get all wandering heroes.
   * @returns {Array}
   */
  function getWanderingHeroes() {
    return [...wanderingHeroes];
  }

  /**
   * Get combat reports.
   * @param {'wandering'|'territory'|null} type - filter by type, null = all
   * @returns {Array}
   */
  function getCombatReports(type) {
    if (type === 'wandering') return [...wanderingReports];
    if (type === 'territory') return [...territoryReports];
    return [...wanderingReports, ...territoryReports].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear combat reports.
   * @param {'wandering'|'territory'|null} type
   */
  function clearCombatReports(type) {
    if (type === 'wandering') wanderingReports = [];
    else if (type === 'territory') territoryReports = [];
    else { wanderingReports = []; territoryReports = []; }
    notifyListeners('reports_cleared', { type: type || 'all' });
  }

  // ─── Territory Hero Exploration Tick ───────────────────────────────────────

  /**
   * Process territory hero exploration tick.
   * Called every game tick from MapSystem.
   * @param {number} zoneId - zone being explored
   * @returns {Object|null} exploration complete result
   */
  function processExplorationTick(zoneId) {
    const zone = GameData.ZONES.find(z => z.id === zoneId);
    if (!zone) return null;

    const explorers = territoryHeroes.filter(h => h.status === 'exploring' && h.currentZone === zoneId);
    if (explorers.length === 0) return null;

    // Progress based on combined exploration power
    const totalExplorationPower = explorers.reduce((sum, h) => sum + (h.atk + h.def) / 2, 0);
    const progressPerTick = 0.5 + (totalExplorationPower / 100);

    let explorationData = explorers[0].explorationProgress || 0;
    explorationData += progressPerTick;

    // Each explorer has ~60% combat chance per tick (like wandering heroes)
    for (const hero of explorers) {
      if (Math.random() < 0.60) {
        const combatResult = resolveZoneCombat(hero, zone);

        // Record territory report
        const report = {
          id: `treport_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          heroId: hero.id,
          heroName: hero.name,
          heroLevel: hero.level,
          heroClass: hero.class,
          zoneId: zone.id,
          zoneName: zone.name,
          combatLog: combatResult.combatLog,
          victory: combatResult.victory,
          goldReward: combatResult.goldReward,
          magicStones: combatResult.magicStones,
          timestamp: Date.now(),
        };
        territoryReports.push(report);
        if (territoryReports.length > MAX_REPORTS) territoryReports.shift();

        // Apply rewards if victory
        if (combatResult.victory) {
          ResourceSystem.add('gold', combatResult.goldReward);
          if (combatResult.magicStones > 0) {
            ResourceSystem.add('magicStones', combatResult.magicStones);
          }
          hero.hp = Math.max(1, combatResult.heroRemainingHp);
        } else {
          // Hero collapses — set to resting
          hero.hp = Math.max(1, combatResult.heroRemainingHp);
          if (hero.hp <= 1) {
            hero.status = 'resting';
            hero.currentZone = null;
            hero.explorationProgress = 0;
            notifyListeners('hero_resting', { hero });
          }
        }

        notifyListeners('exploration_combat_result', { hero, zone, result: combatResult });
      }
    }

    // Check completion (progress >= 100 = zone cleared)
    if (explorationData >= 100) {
      explorers.forEach(h => {
        h.status = 'idle';
        h.currentZone = null;
        h.explorationProgress = 0;
      });

      // Rewards
      const goldReward = zone.rewards.gold.min + Math.floor(Math.random() * (zone.rewards.gold.max - zone.rewards.gold.min));
      ResourceSystem.add('gold', goldReward);

      // Material drops
      const materialDrops = {};
      for (const mat of zone.rewards.materials) {
        const amount = Math.floor(Math.random() * 5) + 1;
        ResourceSystem.add(mat, amount);
        materialDrops[mat] = amount;
      }

      // Magic stones (chance based on zone)
      let magicStonesDropped = 0;
      if (Math.random() < zone.magicStoneChance) {
        magicStonesDropped = zone.magicStoneMin + Math.floor(Math.random() * (zone.magicStoneMax - zone.magicStoneMin));
        ResourceSystem.add('magicStones', magicStonesDropped);
      }

      const result = { zoneId, goldReward, materials: materialDrops, magicStones: magicStonesDropped };
      notifyListeners('exploration_complete', result);
      return result;
    }

    // Update progress
    explorers.forEach(h => {
      h.explorationProgress = explorationData;
    });

    return null; // Not complete yet
  }

  /**
   * Resolve combat for a territory hero exploring a zone.
   * @param {Object} hero
   * @param {Object} zone - from GameData.ZONES
   * @returns {Object} combat result with combatLog
   */
  function resolveZoneCombat(hero, zone) {
    // Enemy scales with zone difficulty
    const enemyHp = 30 + zone.difficulty * 25 + hero.level * 5;
    const enemyAtk = 3 + zone.difficulty * 4 + hero.level * 2;
    const enemyDef = 2 + zone.difficulty * 3 + hero.level * 2;
    const enemyName = generateZoneEnemyName(zone);

    const heroMaxHp = hero.hp || hero.maxHp;
    const heroAtk = hero.atk;
    const heroDef = hero.def;

    const combatLog = [];

    combatLog.push({
      type: 'narrate',
      text: `⚔️ ${hero.name} explores ${zone.name} and encounters ${enemyName}!`,
    });

    let heroRemainingHp = heroMaxHp;
    let enemyRemainingHp = enemyHp;

    for (let round = 0; round < 10 && heroRemainingHp > 0 && enemyRemainingHp > 0; round++) {
      const heroHpBefore = heroRemainingHp;
      const enemyHpBefore = enemyRemainingHp;

      const heroDamage = Math.max(1, heroAtk - enemyDef + Math.floor(Math.random() * 5));
      const enemyDamage = Math.max(1, enemyAtk - heroDef + Math.floor(Math.random() * 5));
      enemyRemainingHp -= heroDamage;
      heroRemainingHp -= enemyDamage;

      const heroHpAfter = Math.max(0, heroRemainingHp);
      const enemyHpAfter = Math.max(0, enemyRemainingHp);

      combatLog.push({
        type: 'round',
        round: round + 1,
        text: `【第${round + 1}回合】${hero.name} 攻擊 ${enemyName} 造成 ${heroDamage} 傷害 (HP: ${enemyHpBefore}→${enemyHpAfter})，${enemyName} 反擊造成 ${enemyDamage} 傷害 (HP: ${heroHpBefore}→${heroHpAfter})`,
        heroDamage,
        enemyDamage,
        heroHpBefore,
        heroHpAfter,
        enemyHpBefore,
        enemyHpAfter,
      });
    }

    const victory = enemyRemainingHp <= 0;
    const goldReward = victory ? zone.difficulty * 15 + hero.level * 5 : 0;
    const magicStones = victory && Math.random() < (zone.magicStoneChance || 0.1)
      ? Math.floor(Math.random() * 3) + 1
      : 0;

    if (victory) {
      combatLog.push({
        type: 'result',
        text: `🏆 勝利！${hero.name} 擊敗 ${enemyName}，獲得 ${goldReward} 金幣${magicStones > 0 ? ` 和 ${magicStones} 魔法石` : ''}！`,
      });
    } else {
      combatLog.push({
        type: 'result',
        text: `💨 險勝！${hero.name} 勉強擊退 ${enemyName}，HP 降至 ${heroRemainingHp}`,
      });
    }

    return { victory, goldReward, magicStones, combatLog, heroRemainingHp };
  }

  /**
   * Generate enemy name based on zone.
   * @param {Object} zone
   * @returns {string}
   */
  function generateZoneEnemyName(zone) {
    const names = {
      1: ['Goblin Scout', 'Wild Wolf', 'Forest Rat'],
      2: ['Forest Orc', 'Cave Spider', 'Dark Druid'],
      3: ['Mine Golem', 'Skeletal Warrior', 'Swamp Witch'],
      4: ['Swamp Beast', 'Poison Serpent', 'Dark Cultist'],
      5: ['Ancient Dragon', 'Demon Knight', 'Void Titan'],
    };
    const pool = names[zone.id] || names[1];
    return pool[Math.floor(Math.random() * pool.length)];
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
        console.error('[HeroSystem] Listener error:', err);
      }
    }
  }

  // ─── Serialization ──────────────────────────────────────────────────────────

  function exportState() {
    return {
      heroes: [...territoryHeroes],
      wanderingHeroes: [...wanderingHeroes],
      nextWanderingSpawnIn,
      wanderingReports: [...wanderingReports],
      territoryReports: [...territoryReports],
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    // Territory
    addTerritoryHero,
    removeTerritoryHero,
    getTerritoryHeroes,
    getTerritoryHero,
    sendToExplore,
    returnToIdle,
    wakeFromResting,
    trainHero,
    // Wandering
    getWanderingHeroes,
    recruitWanderingHero,
    getRecruitCost,
    processWanderingTick,
    // Exploration
    processExplorationTick,
    resolveZoneCombat,
    // Resting
    processRestingTick,
    // Reports
    getCombatReports,
    clearCombatReports,
    // Listeners
    addListener,
    removeListener,
    // Serialization
    exportState,
    // Constants
    MAX_TERRITORY_HEROES, // kept for external reference compatibility
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeroSystem;
}
