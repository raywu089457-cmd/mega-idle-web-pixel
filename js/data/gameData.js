/**
 * Game Data — Initial definitions for all game entities
 * Buildings, Heroes, Maps, Items, etc.
 */

const GameData = (function () {
  // ─── Resources (same as ResourceSystem) ────────────────────────────────────

  const RESOURCES = {
    gold: { name: '金幣', icon: '🪙', initial: 500, capacity: 10000 },
    magicStones: { name: '遠古魔法石', icon: '💎', initial: 0, capacity: 999 },
    fruitPoor: { name: '劣等水果', icon: '🍎', initial: 0, capacity: 500 },
    waterDirty: { name: '髒水', icon: '💧', initial: 0, capacity: 500 },
    woodRotten: { name: '腐朽木頭', icon: '🪵', initial: 0, capacity: 500 },
    ironRusty: { name: '鏽跡斑斑的鐵', icon: '⚙️', initial: 0, capacity: 500 },
    herbLow: { name: '低等藥材', icon: '🌿', initial: 0, capacity: 500 },
  };

  const MATERIAL_TYPES = ['fruitPoor', 'waterDirty', 'woodRotten', 'ironRusty', 'herbLow'];

  // ─── Buildings ───────────────────────────────────────────────────────────────

  /**
   * Building definitions.
   * Each building has:
   * - id: unique identifier
   * - name: display name
   * - level: current level (starts at 1)
   * - maxLevel: maximum upgrade level
   * - cost: { resourceId: amount } to build/upgrade
   * - effect: function or description of building effect
   */
  const BUILDINGS = {
    monument: {
      id: 'monument',
      name: 'Ancient Monument',
      description: 'Produces 1-3 materials per second',
      level: 1,
      maxLevel: 10,
      baseCost: { gold: 500 },
      costMultiplier: 2.0,
      effect: 'produces materials',
    },
    castle: {
      id: 'castle',
      name: 'Castle',
      description: 'Kingdom defense and prosperity',
      level: 1,
      maxLevel: 5,
      baseCost: { gold: 800 },
      costMultiplier: 2.0,
      effect: 'kingdom defense',
    },
    tavern: {
      id: 'tavern',
      name: 'Tavern',
      description: 'Recruit and manage heroes',
      level: 1,
      maxLevel: 5,
      baseCost: { gold: 300 },
      costMultiplier: 1.5,
      effect: 'hero slots',
    },
    weaponShop: {
      id: 'weaponShop',
      name: 'Weapon Shop',
      description: 'Sells weapons to wandering heroes',
      level: 1,
      maxLevel: 10,
      baseCost: { gold: 200, woodRotten: 50, ironRusty: 30 },
      costMultiplier: 2.0,
      effect: 'unlocks wandering hero purchases',
    },
    potionShop: {
      id: 'potionShop',
      name: 'Potion Shop',
      description: 'Sells potions to wandering heroes',
      level: 1,
      maxLevel: 10,
      baseCost: { gold: 200, herbLow: 50, waterDirty: 30 },
      costMultiplier: 2.0,
      effect: 'unlocks wandering hero purchases',
    },
    armorShop: {
      id: 'armorShop',
      name: 'Armor Shop',
      description: 'Sells armor to wandering heroes',
      level: 1,
      maxLevel: 10,
      baseCost: { gold: 200, ironRusty: 40, woodRotten: 20 },
      costMultiplier: 2.0,
      effect: 'unlocks wandering hero purchases',
    },
  };

  // ─── Heroes ─────────────────────────────────────────────────────────────────

  /**
   * Hero class definitions.
   */
  const HERO_CLASSES = {
    warrior: { name: 'Warrior', baseHp: 100, baseAtk: 15, baseDef: 10 },
    mage: { name: 'Mage', baseHp: 70, baseAtk: 25, baseDef: 5 },
    rogue: { name: 'Rogue', baseHp: 85, baseAtk: 18, baseDef: 8 },
    cleric: { name: 'Cleric', baseHp: 90, baseAtk: 10, baseDef: 15 },
    ranger: { name: 'Ranger', baseHp: 80, baseAtk: 20, baseDef: 7 },
  };

  /**
   * Wandering hero type definitions (spawned automatically).
   */
  const WANDERING_HERO_TYPES = [
    { typeId: 'wandering_warrior_1', class: 'warrior', name: 'Mercenary Soldier', level: 1, dropGold: 20, dropMagicStoneChance: 0.1 },
    { typeId: 'wandering_warrior_2', class: 'warrior', name: 'Veteran Sellsword', level: 5, dropGold: 50, dropMagicStoneChance: 0.15 },
    { typeId: 'wandering_mage_1', class: 'mage', name: 'Hedge Wizard', level: 2, dropGold: 25, dropMagicStoneChance: 0.12 },
    { typeId: 'wandering_mage_2', class: 'mage', name: 'Itinerant Sorcerer', level: 7, dropGold: 60, dropMagicStoneChance: 0.18 },
    { typeId: 'wandering_rogue_1', class: 'rogue', name: 'Street Urchin', level: 1, dropGold: 15, dropMagicStoneChance: 0.08 },
    { typeId: 'wandering_rogue_2', class: 'rogue', name: 'Master Thief', level: 8, dropGold: 70, dropMagicStoneChance: 0.2 },
  ];

  /**
   * Create a new territory hero.
   * @param {string} classType - warrior, mage, rogue, cleric, ranger
   * @param {string} name - custom name
   * @param {number} level - starting level
   * @returns {Object} hero instance
   */
  function createTerritoryHero(classType, name, level = 1) {
    const classDef = HERO_CLASSES[classType];
    if (!classDef) {
      console.warn(`[GameData] Unknown hero class: ${classType}`);
      return null;
    }
    return {
      id: `territory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isTerritory: true,
      class: classType,
      name: name || `${classDef.name} #${Math.floor(Math.random() * 1000)}`,
      level: level,
      hp: classDef.baseHp + (level - 1) * 10,
      maxHp: classDef.baseHp + (level - 1) * 10,
      atk: classDef.baseAtk + (level - 1) * 3,
      def: classDef.baseDef + (level - 1) * 2,
      status: 'idle', // idle, exploring, resting
      currentZone: null,
      explorationProgress: 0,
    };
  }

  /**
   * Create a wandering hero instance from a type.
   * @param {Object} typeDef - from WANDERING_HERO_TYPES
   * @returns {Object} wandering hero instance
   */
  function createWanderingHero(typeDef) {
    const classDef = HERO_CLASSES[typeDef.class];
    return {
      id: `wandering_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isTerritory: false,
      typeId: typeDef.typeId,
      class: typeDef.class,
      name: typeDef.name,
      level: typeDef.level,
      hp: classDef.baseHp + (typeDef.level - 1) * 10,
      maxHp: classDef.baseHp + (typeDef.level - 1) * 10,
      atk: classDef.baseAtk + (typeDef.level - 1) * 3,
      def: classDef.baseDef + (typeDef.level - 1) * 2,
      status: 'wandering', // wandering, shopping, fighting, leaving
      dropGold: typeDef.dropGold,
      dropMagicStoneChance: typeDef.dropMagicStoneChance,
      ticksUntilStateChange: Math.floor(Math.random() * 120) + 60, // 60-180 ticks
    };
  }

  // ─── Maps / Zones ────────────────────────────────────────────────────────────

  /**
   * Zone definitions for map exploration.
   */
  const ZONES = [
    {
      id: 1,
      name: 'Countryside',
      difficulty: 1,
      recommendedLevel: 1,
      rewards: { gold: { min: 50, max: 100 }, materials: ['fruitPoor', 'waterDirty'] },
      magicStoneChance: 0.1,
      magicStoneMin: 1,
      magicStoneMax: 3,
    },
    {
      id: 2,
      name: 'Dark Forest',
      difficulty: 2,
      recommendedLevel: 3,
      rewards: { gold: { min: 100, max: 200 }, materials: ['woodRotten', 'herbLow'] },
      magicStoneChance: 0.15,
      magicStoneMin: 1,
      magicStoneMax: 5,
    },
    {
      id: 3,
      name: 'Abandoned Mine',
      difficulty: 3,
      recommendedLevel: 5,
      rewards: { gold: { min: 150, max: 300 }, materials: ['ironRusty', 'woodRotten'] },
      magicStoneChance: 0.2,
      magicStoneMin: 2,
      magicStoneMax: 6,
    },
    {
      id: 4,
      name: 'Swamp Depths',
      difficulty: 4,
      recommendedLevel: 7,
      rewards: { gold: { min: 200, max: 400 }, materials: ['herbLow', 'waterDirty'] },
      magicStoneChance: 0.25,
      magicStoneMin: 2,
      magicStoneMax: 8,
    },
    {
      id: 5,
      name: 'Dragon Ruins',
      difficulty: 5,
      recommendedLevel: 10,
      rewards: { gold: { min: 300, max: 600 }, materials: ['ironRusty', 'magicStones'] },
      magicStoneChance: 0.3,
      magicStoneMin: 3,
      magicStoneMax: 10,
    },
  ];

  // ─── Shop Items ─────────────────────────────────────────────────────────────

  /**
   * Item definitions for shop system.
   */
  const ITEMS = {
    woodenSword: { id: 'woodenSword', name: 'Wooden Sword', type: 'weapon', price: 30, cost: { woodRotten: 5 } },
    ironDagger: { id: 'ironDagger', name: 'Iron Dagger', type: 'weapon', price: 80, cost: { ironRusty: 8, woodRotten: 3 } },
    healthPotion: { id: 'healthPotion', name: 'Health Potion', type: 'potion', price: 25, cost: { herbLow: 4, waterDirty: 2 } },
    ironArmor: { id: 'ironArmor', name: 'Iron Armor', type: 'armor', price: 120, cost: { ironRusty: 15, woodRotten: 5 } },
    mysticStaff: { id: 'mysticStaff', name: 'Mystic Staff', type: 'weapon', price: 150, cost: { woodRotten: 10, ironRusty: 5, herbLow: 3 } },
  };

  // ─── Building Costs ──────────────────────────────────────────────────────────

  /**
   * Calculate cost for building upgrade.
   * @param {string} buildingId
   * @param {number} targetLevel
   * @returns {Object} cost { resourceId: amount }
   */
  function getBuildingCost(buildingId, targetLevel) {
    const building = BUILDINGS[buildingId];
    if (!building) return null;
    const multiplier = Math.pow(building.costMultiplier, targetLevel - 1);
    const cost = {};
    for (const [resourceId, baseAmount] of Object.entries(building.baseCost)) {
      cost[resourceId] = Math.floor(baseAmount * multiplier);
    }
    return cost;
  }

  // ─── Default Game State ─────────────────────────────────────────────────────

  /**
   * Get default game state for new game.
   * @returns {Object}
   */
  function getDefaultGameState() {
    return {
      version: 1,
      lastOnline: Date.now(),
      resources: {
        gold: RESOURCES.gold.initial,
        magicStones: RESOURCES.magicStones.initial,
        fruitPoor: RESOURCES.fruitPoor.initial,
        waterDirty: RESOURCES.waterDirty.initial,
        woodRotten: RESOURCES.woodRotten.initial,
        ironRusty: RESOURCES.ironRusty.initial,
        herbLow: RESOURCES.herbLow.initial,
      },
      heroes: [], // territory heroes
      wanderingHeroes: [], // currently present wandering heroes
      buildings: {
        monument: { level: 1 },
        castle: { level: 1 },
        tavern: { level: 1 },
        weaponShop: { level: 1 },
        potionShop: { level: 1 },
        armorShop: { level: 1 },
      },
      mapProgress: {
        currentZone: 1,
        unlockedZones: [1],
        clearedZones: [],
      },
      shopInventory: {}, // itemId: quantity
      settings: {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        notificationsEnabled: true,
      },
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    RESOURCES,
    MATERIAL_TYPES,
    BUILDINGS,
    HERO_CLASSES,
    WANDERING_HERO_TYPES,
    ZONES,
    ITEMS,
    createTerritoryHero,
    createWanderingHero,
    getBuildingCost,
    getDefaultGameState,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameData;
}
